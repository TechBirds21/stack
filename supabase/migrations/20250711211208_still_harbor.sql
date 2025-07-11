/*
  # Fix Custom ID Generation

  1. System Counters
    - Creates system_counters table for tracking sequential IDs
    - Initializes counters for different entity types
  
  2. Custom ID Generation
    - Creates function to generate custom IDs for users and properties
    - Adds triggers to automatically assign custom IDs
  
  3. Agent License Numbers
    - Implements automatic license number generation for agents
*/

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS assign_property_custom_id() CASCADE;
DROP FUNCTION IF EXISTS assign_user_custom_id() CASCADE;

-- Create system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for system_counters
CREATE POLICY "Allow full access to authenticated users"
  ON system_counters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Initialize counters if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('buyer_id', 0, 'BUYER'),
  ('seller_id', 0, 'SELLER'),
  ('agent_id', 0, 'AGENT'),
  ('admin_id', 0, 'ADMIN'),
  ('property_id', 0, 'PROP'),
  ('license_number', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

-- Function to assign custom ID to users
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Determine counter ID based on user_type
  IF NEW.user_type = 'buyer' THEN
    counter_id := 'buyer_id';
  ELSIF NEW.user_type = 'seller' THEN
    counter_id := 'seller_id';
  ELSIF NEW.user_type = 'agent' THEN
    counter_id := 'agent_id';
  ELSIF NEW.user_type = 'admin' THEN
    counter_id := 'admin_id';
  ELSE
    counter_id := 'buyer_id'; -- Default
  END IF;
  
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get and increment counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- Assign custom_id
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  -- For agents, also assign a license number if not already set
  IF NEW.user_type = 'agent' AND (NEW.agent_license_number IS NULL OR NEW.agent_license_number = '') THEN
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_number'
    RETURNING current_value, prefix INTO counter_val, prefix;
    
    NEW.agent_license_number := prefix || LPAD(counter_val::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to assign custom ID to properties
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get and increment counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'property_id'
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- Assign custom_id
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE OF user_type ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Create trigger for properties table
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

-- Fix existing users without custom_id
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT id, user_type, custom_id, agent_license_number
    FROM users
    WHERE custom_id IS NULL OR (user_type = 'agent' AND agent_license_number IS NULL)
  LOOP
    UPDATE users
    SET custom_id = NULL  -- Force trigger to run by setting to NULL first
    WHERE id = user_rec.id;
  END LOOP;
END $$;

-- Fix existing properties without custom_id
DO $$
DECLARE
  prop_rec RECORD;
BEGIN
  FOR prop_rec IN 
    SELECT id, custom_id
    FROM properties
    WHERE custom_id IS NULL
  LOOP
    UPDATE properties
    SET custom_id = NULL  -- Force trigger to run by setting to NULL first
    WHERE id = prop_rec.id;
  END LOOP;
END $$;