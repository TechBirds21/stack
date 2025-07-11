/*
  # Reset and Setup Custom ID Generation

  1. System Setup
    - Drop and recreate system_counters table
    - Create functions for custom ID generation
  
  2. User Management
    - Create trigger for user custom_id generation
    - Create trigger for agent license number generation
  
  3. Property Management
    - Create trigger for property custom_id generation
*/

-- First, drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS system_counters CASCADE;

-- Create system_counters table
CREATE TABLE IF NOT EXISTS system_counters (
  id TEXT PRIMARY KEY,
  current_value BIGINT DEFAULT 0 NOT NULL,
  prefix TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to system_counters
CREATE POLICY "Admin can view system counters" 
  ON system_counters
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Initialize counters for different user types and properties
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('buyer_id', 0, 'BUYER'),
  ('seller_id', 0, 'SELLER'),
  ('agent_id', 0, 'AGENT'),
  ('admin_id', 0, 'ADMIN'),
  ('property_id', 0, 'PROP'),
  ('license_number', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

-- Create function to assign user custom_id
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine counter_id based on user_type
  CASE NEW.user_type
    WHEN 'buyer' THEN counter_id := 'buyer_id';
    WHEN 'seller' THEN counter_id := 'seller_id';
    WHEN 'agent' THEN counter_id := 'agent_id';
    WHEN 'admin' THEN counter_id := 'admin_id';
    ELSE counter_id := 'buyer_id'; -- Default
  END CASE;

  -- Update counter and get new value
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;

  -- Format custom_id with leading zeros (e.g., BUYER001)
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');

  -- For agents, also assign a license number if not already set
  IF NEW.user_type = 'agent' AND NEW.agent_license_number IS NULL THEN
    -- Update license counter
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_number'
    RETURNING current_value, prefix INTO counter_val, prefix;
    
    -- Assign license number
    NEW.agent_license_number := prefix || LPAD(counter_val::TEXT, 3, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user custom_id
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Create function to assign property custom_id
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

  -- Update counter and get new value
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'property_id'
  RETURNING current_value, prefix INTO counter_val, prefix;

  -- Format custom_id with leading zeros (e.g., PROP001)
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for property custom_id
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

-- Fix any existing users without custom_id
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT id, user_type, custom_id
    FROM users
    WHERE custom_id IS NULL
  LOOP
    UPDATE users
    SET custom_id = NULL -- This will trigger the function to generate a new custom_id
    WHERE id = user_rec.id;
  END LOOP;
END;
$$;

-- Fix any existing properties without custom_id
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
    SET custom_id = NULL -- This will trigger the function to generate a new custom_id
    WHERE id = prop_rec.id;
  END LOOP;
END;
$$;