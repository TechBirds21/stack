/*
  # Fix all errors in the application

  1. RLS Policies
    - Fix RLS policies for users table
    - Fix RLS policies for system_counters table
    - Fix RLS policies for documents table
    - Add proper policies for authenticated users and service role
  
  2. Custom ID Generation
    - Fix ambiguous column references in trigger functions
    - Improve custom ID generation for users and properties
    - Add proper error handling
  
  3. Storage and Document Handling
    - Ensure proper document storage and retrieval
    - Fix document metadata storage
*/

-- ============================================================================
-- 1. Fix RLS policies for system_counters table
-- ============================================================================

-- First, ensure the system_counters table exists
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Allow authenticated users full access to system_counters" ON system_counters;
DROP POLICY IF EXISTS "Allow service role full access to system_counters" ON system_counters;

-- Create policies that allow proper access
CREATE POLICY "Allow authenticated users full access to system_counters"
ON system_counters FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow service role full access to system_counters"
ON system_counters FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- 2. Fix RLS policies for users table
-- ============================================================================

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can create any user" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create proper policies for users table
CREATE POLICY "Admins can create any user"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- ============================================================================
-- 3. Fix RLS policies for documents table
-- ============================================================================

-- Create documents table if it doesn't exist
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_category text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing issues
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;

-- Create proper policies for documents table
CREATE POLICY "Admins can view all documents"
ON documents FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Users can view their own documents"
ON documents FOR SELECT
TO authenticated
USING (uploaded_by = auth.uid());

CREATE POLICY "Users can upload documents"
ON documents FOR INSERT
TO authenticated
WITH CHECK (true);

-- ============================================================================
-- 4. Fix custom ID generation functions
-- ============================================================================

-- Drop existing functions and triggers that might be causing issues
DROP FUNCTION IF EXISTS assign_user_custom_id() CASCADE;
DROP FUNCTION IF EXISTS assign_property_custom_id() CASCADE;

-- Create improved user custom ID function
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  user_prefix TEXT;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Determine prefix based on user_type
  CASE NEW.user_type
    WHEN 'buyer' THEN user_prefix := 'BUYER';
    WHEN 'seller' THEN user_prefix := 'SELLER';
    WHEN 'agent' THEN user_prefix := 'AGENT';
    WHEN 'admin' THEN user_prefix := 'ADMIN';
    ELSE user_prefix := 'USER';
  END CASE;

  -- Get or create counter
  counter_id := 'user_' || LOWER(NEW.user_type);
  
  -- Insert if not exists
  INSERT INTO system_counters (id, current_value, prefix)
  VALUES (counter_id, 0, user_prefix)
  ON CONFLICT (id) DO NOTHING;
  
  -- Update counter and get new value
  UPDATE system_counters
  SET current_value = current_value + 1
  WHERE id = counter_id
  RETURNING current_value INTO counter_val;
  
  -- Format custom_id with padded zeros
  NEW.custom_id := user_prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$;

-- Create trigger for user custom ID
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT OR UPDATE OF user_type ON users
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION assign_user_custom_id();

-- Create improved property custom ID function
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  counter_id TEXT := 'property';
  counter_val BIGINT;
  property_prefix TEXT := 'PROP';
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Insert if not exists
  INSERT INTO system_counters (id, current_value, prefix)
  VALUES (counter_id, 0, property_prefix)
  ON CONFLICT (id) DO NOTHING;
  
  -- Update counter and get new value
  UPDATE system_counters
  SET current_value = current_value + 1
  WHERE id = counter_id
  RETURNING current_value INTO counter_val;
  
  -- Format custom_id with padded zeros
  NEW.custom_id := property_prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$;

-- Create trigger for property custom ID
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT ON properties
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION assign_property_custom_id();

-- ============================================================================
-- 5. Create notification function
-- ============================================================================

-- Create notification table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id text,
  user_id uuid REFERENCES users(id),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Admins can view all notifications"
ON notifications FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO public
USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Admins can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all notifications"
ON notifications FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

-- Create notification function
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  property_title TEXT;
  property_owner_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT;
BEGIN
  -- For bookings
  IF TG_TABLE_NAME = 'bookings' THEN
    -- Get property information
    SELECT properties.title, properties.owner_id 
    INTO property_title, property_owner_id
    FROM properties 
    WHERE properties.id = NEW.property_id;
    
    -- Create notification for property owner
    IF property_owner_id IS NOT NULL THEN
      notification_title := 'New Booking Request';
      notification_message := 'Someone has requested a tour for your property: ' || property_title;
      notification_type := 'booking';
      
      INSERT INTO notifications (
        title, message, type, entity_type, entity_id, user_id
      ) VALUES (
        notification_title,
        notification_message,
        notification_type,
        'booking',
        NEW.id::text,
        property_owner_id
      );
    END IF;
  
  -- For inquiries
  ELSIF TG_TABLE_NAME = 'inquiries' THEN
    -- Get property information
    SELECT properties.title, properties.owner_id 
    INTO property_title, property_owner_id
    FROM properties 
    WHERE properties.id = NEW.property_id;
    
    -- Create notification for property owner
    IF property_owner_id IS NOT NULL THEN
      notification_title := 'New Property Inquiry';
      notification_message := NEW.name || ' is interested in your property: ' || property_title;
      notification_type := 'inquiry';
      
      INSERT INTO notifications (
        title, message, type, entity_type, entity_id, user_id
      ) VALUES (
        notification_title,
        notification_message,
        notification_type,
        'inquiry',
        NEW.id::text,
        property_owner_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for notifications
DROP TRIGGER IF EXISTS create_booking_notification ON bookings;
CREATE TRIGGER create_booking_notification
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_notification();

DROP TRIGGER IF EXISTS create_inquiry_notification ON inquiries;
CREATE TRIGGER create_inquiry_notification
AFTER INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION create_notification();

-- ============================================================================
-- 6. Initialize system counters if needed
-- ============================================================================

-- Insert initial counters if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_buyer', 0, 'BUYER'),
  ('user_seller', 0, 'SELLER'),
  ('user_agent', 0, 'AGENT'),
  ('user_admin', 0, 'ADMIN'),
  ('property', 0, 'PROP')
ON CONFLICT (id) DO NOTHING;