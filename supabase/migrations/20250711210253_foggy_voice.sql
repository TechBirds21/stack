/*
  # Fix custom_id generation for users and agents
  
  1. System Counters
    - Creates a system_counters table to track sequential IDs
    - Adds RLS policies for the counters table
  
  2. User Custom ID Generation
    - Creates a robust trigger function for generating custom IDs
    - Adds a trigger to the users table
    - Fixes any existing users without custom_id
  
  3. Agent License Number Generation
    - Implements a trigger function for generating sequential license numbers
    - Ensures license numbers are unique and sequential
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
CREATE POLICY "Admin can manage system counters"
  ON system_counters
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'admin'
    )
  );

-- Create policy for service role access to system_counters
CREATE POLICY "Service role can manage system counters"
  ON system_counters
  FOR ALL
  TO service_role
  USING (true);

-- Initialize counters if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('buyer_counter', 0, 'BUYER'),
  ('seller_counter', 0, 'SELLER'),
  ('agent_counter', 0, 'AGENT'),
  ('admin_counter', 0, 'ADMIN'),
  ('license_counter', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

-- Create or replace the function to assign custom_id to users
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id text;
  counter_val bigint;
  id_prefix text;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL AND NEW.custom_id != '' THEN
    RETURN NEW;
  END IF;
  
  -- Determine counter based on user_type
  CASE NEW.user_type
    WHEN 'buyer' THEN counter_id := 'buyer_counter';
    WHEN 'seller' THEN counter_id := 'seller_counter';
    WHEN 'agent' THEN counter_id := 'agent_counter';
    WHEN 'admin' THEN counter_id := 'admin_counter';
    ELSE counter_id := 'buyer_counter'; -- Default
  END CASE;
  
  -- Get and increment counter atomically
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, id_prefix;
  
  -- Format the custom_id with leading zeros (e.g., BUYER001)
  NEW.custom_id := id_prefix || LPAD(counter_val::text, 3, '0');
  
  -- If this is an agent and license number is not set, assign one
  IF NEW.user_type = 'agent' AND (NEW.agent_license_number IS NULL OR NEW.agent_license_number = '') THEN
    -- Get and increment license counter
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_counter'
    RETURNING current_value, prefix INTO counter_val, id_prefix;
    
    -- Format the license number
    NEW.agent_license_number := id_prefix || LPAD(counter_val::text, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;

-- Create the trigger
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Fix existing users without custom_id
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, user_type, custom_id, agent_license_number
    FROM users
    WHERE custom_id IS NULL OR custom_id = ''
  LOOP
    UPDATE users
    SET custom_id = NULL -- This will trigger the function to generate a new custom_id
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Fix existing agents without license numbers
DO $$
DECLARE
  agent_record RECORD;
BEGIN
  FOR agent_record IN 
    SELECT id
    FROM users
    WHERE user_type = 'agent' 
    AND (agent_license_number IS NULL OR agent_license_number = '')
  LOOP
    UPDATE users
    SET agent_license_number = NULL -- This will trigger the function to generate a new license number
    WHERE id = agent_record.id;
  END LOOP;
END $$;