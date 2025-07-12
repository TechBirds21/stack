/*
  # Add Custom ID Generation for Entities

  1. System Counters
    - Creates a system_counters table to track sequential IDs
    - Adds initial counter records for users, properties, agents, and inquiries
  
  2. Trigger Functions
    - Creates functions to generate custom IDs with sequential numbers
    - Format: PREFIX + padded sequential number (e.g., USER001, PROP001)
  
  3. Triggers
    - Attaches triggers to tables to automatically assign custom IDs
    - Ensures IDs are assigned before insert
*/

-- Create system counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id TEXT PRIMARY KEY,
  current_value BIGINT DEFAULT 0,
  prefix TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated users (especially admins)
CREATE POLICY "Allow full access to authenticated users" 
  ON system_counters
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert initial counter records if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_counter', 0, 'USER'),
  ('buyer_counter', 0, 'BUYER'),
  ('seller_counter', 0, 'SELLER'),
  ('agent_counter', 0, 'AGENT'),
  ('admin_counter', 0, 'ADMIN'),
  ('property_counter', 0, 'PROP'),
  ('inquiry_counter', 0, 'INQ'),
  ('booking_counter', 0, 'BOOK')
ON CONFLICT (id) DO NOTHING;

-- Function to assign user custom ID based on user_type
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  -- Determine which counter to use based on user_type
  IF NEW.user_type = 'buyer' THEN
    counter_id := 'buyer_counter';
  ELSIF NEW.user_type = 'seller' THEN
    counter_id := 'seller_counter';
  ELSIF NEW.user_type = 'agent' THEN
    counter_id := 'agent_counter';
  ELSIF NEW.user_type = 'admin' THEN
    counter_id := 'admin_counter';
  ELSE
    counter_id := 'user_counter';
  END IF;
  
  -- Get and increment the counter
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, id_prefix;
  
  -- Assign the custom ID with padded number
  NEW.custom_id := id_prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to assign property custom ID
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  -- Get and increment the counter
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'property_counter'
  RETURNING current_value, prefix INTO counter_val, id_prefix;
  
  -- Assign the custom ID with padded number
  NEW.custom_id := id_prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to assign inquiry custom ID
CREATE OR REPLACE FUNCTION assign_inquiry_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  -- Get and increment the counter
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'inquiry_counter'
  RETURNING current_value, prefix INTO counter_val, id_prefix;
  
  -- Assign the custom ID with padded number
  NEW.custom_id := id_prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to assign booking custom ID
CREATE OR REPLACE FUNCTION assign_booking_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  -- Get and increment the counter
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'booking_counter'
  RETURNING current_value, prefix INTO counter_val, id_prefix;
  
  -- Assign the custom ID with padded number
  NEW.custom_id := id_prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add custom_id column to inquiries if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'inquiries' AND column_name = 'custom_id'
  ) THEN
    ALTER TABLE inquiries ADD COLUMN custom_id TEXT;
  END IF;
END $$;

-- Add custom_id column to bookings if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'custom_id'
  ) THEN
    ALTER TABLE bookings ADD COLUMN custom_id TEXT;
  END IF;
END $$;

-- Create or replace triggers for each table

-- User trigger (only create if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'user_custom_id_trigger'
  ) THEN
    CREATE TRIGGER user_custom_id_trigger
    BEFORE INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_user_custom_id();
  END IF;
END $$;

-- Property trigger (only create if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'property_custom_id_trigger'
  ) THEN
    CREATE TRIGGER property_custom_id_trigger
    BEFORE INSERT ON properties
    FOR EACH ROW
    EXECUTE FUNCTION assign_property_custom_id();
  END IF;
END $$;

-- Inquiry trigger (only create if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'inquiry_custom_id_trigger'
  ) THEN
    CREATE TRIGGER inquiry_custom_id_trigger
    BEFORE INSERT ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION assign_inquiry_custom_id();
  END IF;
END $$;

-- Booking trigger (only create if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'booking_custom_id_trigger'
  ) THEN
    CREATE TRIGGER booking_custom_id_trigger
    BEFORE INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION assign_booking_custom_id();
  END IF;
END $$;

-- Update existing records that don't have custom_id
-- Users
DO $$ 
DECLARE
  user_record RECORD;
  counter_val BIGINT;
  id_prefix TEXT;
  counter_id TEXT;
BEGIN
  FOR user_record IN 
    SELECT id, user_type FROM users WHERE custom_id IS NULL
  LOOP
    -- Determine which counter to use based on user_type
    IF user_record.user_type = 'buyer' THEN
      counter_id := 'buyer_counter';
    ELSIF user_record.user_type = 'seller' THEN
      counter_id := 'seller_counter';
    ELSIF user_record.user_type = 'agent' THEN
      counter_id := 'agent_counter';
    ELSIF user_record.user_type = 'admin' THEN
      counter_id := 'admin_counter';
    ELSE
      counter_id := 'user_counter';
    END IF;
    
    -- Get and increment the counter
    UPDATE system_counters 
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = counter_id
    RETURNING current_value, prefix INTO counter_val, id_prefix;
    
    -- Update the user record
    UPDATE users
    SET custom_id = id_prefix || LPAD(counter_val::TEXT, 3, '0')
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Properties
DO $$ 
DECLARE
  property_record RECORD;
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  FOR property_record IN 
    SELECT id FROM properties WHERE custom_id IS NULL
  LOOP
    -- Get and increment the counter
    UPDATE system_counters 
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'property_counter'
    RETURNING current_value, prefix INTO counter_val, id_prefix;
    
    -- Update the property record
    UPDATE properties
    SET custom_id = id_prefix || LPAD(counter_val::TEXT, 3, '0')
    WHERE id = property_record.id;
  END LOOP;
END $$;

-- Inquiries
DO $$ 
DECLARE
  inquiry_record RECORD;
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  FOR inquiry_record IN 
    SELECT id FROM inquiries WHERE custom_id IS NULL
  LOOP
    -- Get and increment the counter
    UPDATE system_counters 
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'inquiry_counter'
    RETURNING current_value, prefix INTO counter_val, id_prefix;
    
    -- Update the inquiry record
    UPDATE inquiries
    SET custom_id = id_prefix || LPAD(counter_val::TEXT, 3, '0')
    WHERE id = inquiry_record.id;
  END LOOP;
END $$;

-- Bookings
DO $$ 
DECLARE
  booking_record RECORD;
  counter_val BIGINT;
  id_prefix TEXT;
BEGIN
  FOR booking_record IN 
    SELECT id FROM bookings WHERE custom_id IS NULL
  LOOP
    -- Get and increment the counter
    UPDATE system_counters 
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'booking_counter'
    RETURNING current_value, prefix INTO counter_val, id_prefix;
    
    -- Update the booking record
    UPDATE bookings
    SET custom_id = id_prefix || LPAD(counter_val::TEXT, 3, '0')
    WHERE id = booking_record.id;
  END LOOP;
END $$;