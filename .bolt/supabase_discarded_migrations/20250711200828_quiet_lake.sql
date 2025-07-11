/*
  # Fix custom_id generation for users

  1. Create trigger function
    - Creates a function to automatically generate custom_id for users
    - Uses system_counters table to maintain sequential IDs
    - Formats IDs based on user type (BUYER001, SELLER001, etc.)
  
  2. Create trigger
    - Attaches the function to the users table
    - Runs before INSERT or UPDATE
*/

-- First, create the system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert initial counter values if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_buyer', 0, 'BUYER'),
  ('user_seller', 0, 'SELLER'),
  ('user_agent', 0, 'AGENT'),
  ('user_admin', 0, 'ADMIN')
ON CONFLICT (id) DO NOTHING;

-- Create or replace the trigger function
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

  -- Determine counter ID based on user_type
  counter_id := 'user_' || LOWER(NEW.user_type);
  
  -- Get and increment the counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- If no counter found (shouldn't happen with our inserts above), use a default
  IF counter_val IS NULL THEN
    counter_val := 1;
    prefix := UPPER(NEW.user_type);
  END IF;
  
  -- Format the custom_id
  NEW.custom_id := prefix || LPAD(counter_val::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;

-- Create the trigger
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Create a similar function for properties
CREATE OR REPLACE FUNCTION assign_property_custom_id()
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

  -- Determine counter ID based on property_type
  counter_id := 'property_' || LOWER(NEW.property_type);
  
  -- Get and increment the counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- If no counter found, create it
  IF counter_val IS NULL THEN
    INSERT INTO system_counters (id, current_value, prefix)
    VALUES (counter_id, 1, UPPER(SUBSTRING(NEW.property_type FROM 1 FOR 3)))
    RETURNING current_value, prefix INTO counter_val, prefix;
  END IF;
  
  -- Format the custom_id
  NEW.custom_id := prefix || LPAD(counter_val::text, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;

-- Create the trigger
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT OR UPDATE ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

-- Make sure RLS is enabled for system_counters
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