/*
  # Fix custom_id generation and license number assignment

  1. System Counters
    - Create system_counters table if it doesn't exist
    - Initialize counters for different user types and license numbers
  
  2. User Custom ID Generation
    - Create or replace function to generate custom_id for users
    - Add trigger to automatically assign custom_id on insert/update
  
  3. Agent License Number Generation
    - Create or replace function to generate license numbers for agents
    - Add trigger to automatically assign license numbers to agents
  
  4. Fix Existing Users
    - Update users without custom_id
    - Update agents without license numbers
*/

-- Create system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Initialize counters if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_buyer', 0, 'BUYER'),
  ('user_seller', 0, 'SELLER'),
  ('user_agent', 0, 'AGENT'),
  ('user_admin', 0, 'ADMIN'),
  ('license_number', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

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

-- Create or replace function to generate custom_id for users
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
  counter_id := 'user_' || LOWER(NEW.user_type);
  
  -- Update counter and get new value
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- If no counter found, use default values
  IF counter_val IS NULL THEN
    counter_val := 1;
    prefix := UPPER(NEW.user_type);
  END IF;
  
  -- Format custom_id with leading zeros (e.g., BUYER001)
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for user custom_id
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE OF user_type ON users
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION assign_user_custom_id();

-- Create or replace function to assign license numbers to agents
CREATE OR REPLACE FUNCTION assign_agent_license_number()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Only proceed if user_type is 'agent' and license_number is NULL
  IF NEW.user_type = 'agent' AND NEW.agent_license_number IS NULL THEN
    -- Update counter and get new value
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_number'
    RETURNING current_value, prefix INTO counter_val, prefix;
    
    -- If no counter found, use default values
    IF counter_val IS NULL THEN
      counter_val := 1;
      prefix := 'LICENSE';
    END IF;
    
    -- Format license_number with leading zeros (e.g., LICENSE001)
    NEW.agent_license_number := prefix || LPAD(counter_val::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger for agent license_number
DROP TRIGGER IF EXISTS agent_license_number_trigger ON users;
CREATE TRIGGER agent_license_number_trigger
BEFORE INSERT OR UPDATE OF user_type ON users
FOR EACH ROW
WHEN (NEW.user_type = 'agent' AND NEW.agent_license_number IS NULL)
EXECUTE FUNCTION assign_agent_license_number();

-- Fix existing users without custom_id
DO $$
DECLARE
  user_record RECORD;
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  FOR user_record IN 
    SELECT id, user_type FROM users WHERE custom_id IS NULL
  LOOP
    -- Determine counter_id based on user_type
    counter_id := 'user_' || LOWER(user_record.user_type);
    
    -- Update counter and get new value
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = counter_id
    RETURNING current_value, prefix INTO counter_val, prefix;
    
    -- If no counter found, use default values
    IF counter_val IS NULL THEN
      counter_val := 1;
      prefix := UPPER(user_record.user_type);
    END IF;
    
    -- Format custom_id with leading zeros and update user
    UPDATE users
    SET custom_id = prefix || LPAD(counter_val::TEXT, 3, '0')
    WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Fix existing agents without license numbers
DO $$
DECLARE
  agent_record RECORD;
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  FOR agent_record IN 
    SELECT id FROM users WHERE user_type = 'agent' AND agent_license_number IS NULL
  LOOP
    -- Update counter and get new value
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_number'
    RETURNING current_value, prefix INTO counter_val, prefix;
    
    -- If no counter found, use default values
    IF counter_val IS NULL THEN
      counter_val := 1;
      prefix := 'LICENSE';
    END IF;
    
    -- Format license_number with leading zeros and update user
    UPDATE users
    SET agent_license_number = prefix || LPAD(counter_val::TEXT, 3, '0')
    WHERE id = agent_record.id;
  END LOOP;
END;
$$;