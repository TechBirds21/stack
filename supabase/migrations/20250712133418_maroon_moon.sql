/*
  # Fix RLS policies for system_counters table

  1. Security
    - Drop existing restrictive policies on system_counters
    - Add policies that allow authenticated users to read/write system_counters
    - Add policies that allow service operations (triggers) to work
    - Ensure trigger functions can access system_counters properly

  2. Changes
    - Remove conflicting RLS policies
    - Add comprehensive policies for system_counters access
    - Recreate trigger functions with SECURITY DEFINER to bypass RLS
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON system_counters;
DROP POLICY IF EXISTS "Allow anon insert on system_counters" ON system_counters;

-- Create comprehensive policies for system_counters
CREATE POLICY "Allow authenticated users full access to system_counters"
  ON system_counters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow service role full access to system_counters"
  ON system_counters
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Recreate the user custom ID function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  user_prefix TEXT;
  next_number BIGINT;
  formatted_id TEXT;
BEGIN
  -- Only assign custom_id if it's not already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine prefix based on user type
  CASE NEW.user_type
    WHEN 'buyer' THEN user_prefix := 'BUYER';
    WHEN 'seller' THEN user_prefix := 'SELLER';
    WHEN 'agent' THEN user_prefix := 'AGENT';
    WHEN 'admin' THEN user_prefix := 'ADMIN';
    ELSE user_prefix := 'USER';
  END CASE;

  -- Get or create counter for this user type
  INSERT INTO system_counters (id, current_value, prefix)
  VALUES (user_prefix, 1, user_prefix)
  ON CONFLICT (id) DO UPDATE SET
    current_value = system_counters.current_value + 1,
    updated_at = now()
  RETURNING current_value INTO next_number;

  -- Format the custom ID
  formatted_id := user_prefix || LPAD(next_number::TEXT, 3, '0');
  
  -- Assign the custom ID
  NEW.custom_id := formatted_id;
  
  RETURN NEW;
END;
$$;

-- Recreate the property custom ID function with SECURITY DEFINER
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  next_number BIGINT;
  formatted_id TEXT;
BEGIN
  -- Only assign custom_id if it's not already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get or create counter for properties
  INSERT INTO system_counters (id, current_value, prefix)
  VALUES ('PROPERTY', 1, 'PROP')
  ON CONFLICT (id) DO UPDATE SET
    current_value = system_counters.current_value + 1,
    updated_at = now()
  RETURNING current_value INTO next_number;

  -- Format the custom ID
  formatted_id := 'PROP' || LPAD(next_number::TEXT, 3, '0');
  
  -- Assign the custom ID
  NEW.custom_id := formatted_id;
  
  RETURN NEW;
END;
$$;