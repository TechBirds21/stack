/*
  # Fix custom_id generation and implement sequential license numbers

  1. System Counters
    - Create system_counters table if it doesn't exist
    - Add initial counter values for different user types and license numbers
  
  2. User Custom ID Function
    - Create or replace the assign_user_custom_id function
    - Implement proper prefix based on user_type
    - Fix the counter increment logic
  
  3. Agent License Number Function
    - Create a new function to assign sequential license numbers to agents
    - Implement a trigger to automatically assign license numbers
*/

-- Create system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Ensure RLS is enabled
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access
CREATE POLICY IF NOT EXISTS "Admin can view system counters"
  ON system_counters
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Insert initial counter values if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_buyer', 0, 'BUYER'),
  ('user_seller', 0, 'SELLER'),
  ('user_agent', 0, 'AGENT'),
  ('user_admin', 0, 'ADMIN'),
  ('agent_license', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

-- Create or replace the function to assign custom_id to users
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL AND NEW.custom_id != '' THEN
    RETURN NEW;
  END IF;

  -- Determine counter_id based on user_type
  CASE NEW.user_type
    WHEN 'buyer' THEN counter_id := 'user_buyer';
    WHEN 'seller' THEN counter_id := 'user_seller';
    WHEN 'agent' THEN counter_id := 'user_agent';
    WHEN 'admin' THEN counter_id := 'user_admin';
    ELSE counter_id := 'user_buyer'; -- Default
  END CASE;

  -- Get and increment counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;

  -- Format custom_id with leading zeros (e.g., BUYER001)
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;

-- Create the trigger
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Create or replace the function to assign license numbers to agents
CREATE OR REPLACE FUNCTION assign_agent_license_number()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  license_prefix TEXT := 'LICENSE';
BEGIN
  -- Only proceed if this is an agent and license number is not set
  IF NEW.user_type = 'agent' AND (NEW.agent_license_number IS NULL OR NEW.agent_license_number = '') THEN
    -- Get and increment counter
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'agent_license'
    RETURNING current_value INTO counter_val;

    -- Format license number with leading zeros (e.g., LICENSE001)
    NEW.agent_license_number := license_prefix || LPAD(counter_val::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the existing trigger if it exists
DROP TRIGGER IF EXISTS agent_license_number_trigger ON users;

-- Create the trigger for agent license numbers
CREATE TRIGGER agent_license_number_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION assign_agent_license_number();

-- Fix any existing users without custom_id
DO $$
DECLARE
  user_rec RECORD;
BEGIN
  FOR user_rec IN 
    SELECT id, user_type, custom_id 
    FROM users 
    WHERE custom_id IS NULL OR custom_id = ''
  LOOP
    UPDATE users 
    SET custom_id = NULL  -- This will trigger the function to generate a new custom_id
    WHERE id = user_rec.id;
  END LOOP;
END $$;

-- Fix any existing agents without license numbers
DO $$
DECLARE
  agent_rec RECORD;
BEGIN
  FOR agent_rec IN 
    SELECT id 
    FROM users 
    WHERE user_type = 'agent' AND (agent_license_number IS NULL OR agent_license_number = '')
  LOOP
    UPDATE users 
    SET agent_license_number = NULL  -- This will trigger the function to generate a new license number
    WHERE id = agent_rec.id;
  END LOOP;
END $$;