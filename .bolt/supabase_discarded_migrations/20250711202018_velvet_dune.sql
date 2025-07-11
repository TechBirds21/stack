/*
  # Fix User Custom ID Generation

  1. System Counters
    - Create system_counters table if it doesn't exist
    - Insert initial counter values for different user types
  
  2. Trigger Function
    - Create or replace the assign_user_custom_id function
    - Ensure it properly generates custom_id based on user_type
  
  3. Trigger
    - Create the trigger on the users table
*/

-- Create system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id TEXT PRIMARY KEY,
  current_value BIGINT DEFAULT 0 NOT NULL,
  prefix TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Insert initial counter values if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_buyer', 0, 'BUYER'),
  ('user_seller', 0, 'SELLER'),
  ('user_agent', 0, 'AGENT'),
  ('user_admin', 0, 'ADMIN'),
  ('property', 0, 'PROP')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access to system_counters
CREATE POLICY "Admin can view system counters" 
  ON system_counters 
  FOR SELECT 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Create or replace the assign_user_custom_id function
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
  formatted_id TEXT;
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

  -- Format the custom_id (e.g., BUYER001)
  formatted_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  -- Set the custom_id
  NEW.custom_id := formatted_id;
  
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

-- Create or replace the assign_property_custom_id function
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  prefix TEXT;
  formatted_id TEXT;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL AND NEW.custom_id != '' THEN
    RETURN NEW;
  END IF;

  -- Get and increment counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'property'
  RETURNING current_value, prefix INTO counter_val, prefix;

  -- Format the custom_id (e.g., PROP001)
  formatted_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  -- Set the custom_id
  NEW.custom_id := formatted_id;
  
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

-- Disable RLS temporarily to fix existing users without custom_id
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Update existing users without custom_id
DO $$
DECLARE
  user_rec RECORD;
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
  formatted_id TEXT;
BEGIN
  FOR user_rec IN SELECT * FROM users WHERE custom_id IS NULL OR custom_id = '' LOOP
    -- Determine counter_id based on user_type
    CASE user_rec.user_type
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

    -- Format the custom_id (e.g., BUYER001)
    formatted_id := prefix || LPAD(counter_val::TEXT, 3, '0');
    
    -- Update the user
    UPDATE users SET custom_id = formatted_id WHERE id = user_rec.id;
  END LOOP;
END;
$$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "admin_full_access" 
  ON users 
  FOR ALL 
  TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users admin_user WHERE admin_user.id = auth.uid() AND admin_user.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users admin_user WHERE admin_user.id = auth.uid() AND admin_user.user_type = 'admin'
  ));

CREATE POLICY "service_role_insert" 
  ON users 
  FOR INSERT 
  TO service_role 
  WITH CHECK (true);

CREATE POLICY "users_insert_own" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_update_own" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "users_view_own" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (id = auth.uid());