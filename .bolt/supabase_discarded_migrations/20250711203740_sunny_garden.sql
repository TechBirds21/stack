/*
  # Fix custom_id generation and license number assignment

  1. New Functions
    - `assign_user_custom_id()` - Generates custom IDs like BUYER001, SELLER001, etc.
    - `assign_property_custom_id()` - Generates custom IDs like PROP001, PROP002, etc.
  
  2. System Counters
    - Creates a system_counters table to track sequential IDs
    - Initializes counters for different user types and properties
  
  3. Triggers
    - Adds triggers to automatically assign custom_id and license numbers
    - Fixes existing users without custom_id
*/

-- Create system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
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

-- Create or replace function to assign user custom_id
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id text;
  counter_val bigint;
  prefix text;
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
  NEW.custom_id := prefix || LPAD(counter_val::text, 3, '0');

  -- If user is an agent and doesn't have a license number, assign one
  IF NEW.user_type = 'agent' AND NEW.agent_license_number IS NULL THEN
    -- Update license counter and get new value
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_number'
    RETURNING current_value, prefix INTO counter_val, prefix;

    -- Format license number with leading zeros (e.g., LICENSE001)
    NEW.agent_license_number := prefix || LPAD(counter_val::text, 3, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace function to assign property custom_id
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val bigint;
  prefix text;
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
  NEW.custom_id := prefix || LPAD(counter_val::text, 3, '0');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;

-- Create trigger for users table
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Create trigger for properties table
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

-- Fix existing users without custom_id
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, user_type, custom_id
    FROM users
    WHERE custom_id IS NULL
  LOOP
    UPDATE users
    SET custom_id = NULL  -- This will trigger the function to generate a new custom_id
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Fix existing properties without custom_id
DO $$
DECLARE
  property_record RECORD;
BEGIN
  FOR property_record IN 
    SELECT id, custom_id
    FROM properties
    WHERE custom_id IS NULL
  LOOP
    UPDATE properties
    SET custom_id = NULL  -- This will trigger the function to generate a new custom_id
    WHERE id = property_record.id;
  END LOOP;
END $$;