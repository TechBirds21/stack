/*
  # Comprehensive fixes for production readiness

  1. Database Schema Fixes
    - Fix custom_id generation for users and properties
    - Add system_counters table for ID tracking
    - Create proper trigger functions
    - Fix RLS policies for all tables
  
  2. Storage Fixes
    - Create proper storage buckets with policies
    - Enable public access for images
    - Set up proper RLS for uploads
*/

-- First, create system_counters table if it doesn't exist
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for system_counters
CREATE POLICY "Admin can view system counters"
  ON system_counters
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Insert initial counter values if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('buyer_id', 0, 'BUYER'),
  ('seller_id', 0, 'SELLER'),
  ('agent_id', 0, 'AGENT'),
  ('admin_id', 0, 'ADMIN'),
  ('property_id', 0, 'PROP')
ON CONFLICT (id) DO NOTHING;

-- Create or replace the user custom_id generation function
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

  -- Determine counter ID based on user_type
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

  -- Format the custom_id with leading zeros (e.g., BUYER001)
  NEW.custom_id := prefix || LPAD(counter_val::text, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace the property custom_id generation function
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

  -- Format the custom_id with leading zeros (e.g., PROP001)
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

-- Fix RLS policies for users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "admin_full_access" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "service_role_insert" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;

-- Create comprehensive policies
CREATE POLICY "admin_full_access"
  ON users
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid() AND admin_user.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users admin_user
    WHERE admin_user.id = auth.uid() AND admin_user.user_type = 'admin'
  ));

CREATE POLICY "users_view_own"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "users_update_own"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

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

-- Fix RLS policies for properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admins can do everything with properties" ON properties;
DROP POLICY IF EXISTS "Agents can view assigned properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can view properties" ON properties;
DROP POLICY IF EXISTS "Property owners can manage their properties" ON properties;
DROP POLICY IF EXISTS "Public can view active properties" ON properties;

-- Create comprehensive policies for properties
CREATE POLICY "Admins can do everything with properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

CREATE POLICY "Agents can view assigned properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING ((agent_id = auth.uid()) OR (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'agent'
  )));

CREATE POLICY "Authenticated users can view properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Property owners can manage their properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Public can view active properties"
  ON properties
  FOR SELECT
  TO public
  USING (status = 'active');

-- Create storage buckets and policies
-- First, ensure the storage extension is enabled
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";

-- Create storage schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS storage;

-- Create storage.buckets table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.buckets (
  id text NOT NULL,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  public boolean DEFAULT false,
  avif_autodetection boolean DEFAULT false,
  file_size_limit bigint,
  allowed_mime_types text[],
  PRIMARY KEY (id)
);

-- Create storage.objects table if it doesn't exist
CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  bucket_id text NOT NULL,
  name text NOT NULL,
  owner uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now(),
  metadata jsonb,
  path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/')) STORED,
  PRIMARY KEY (id),
  UNIQUE (bucket_id, name),
  FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id)
);

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('images', 'images', true),
  ('property-images', 'property-images', true),
  ('documents', 'documents', false),
  ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Individual User Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Access" ON storage.objects;

-- Create storage policies
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id IN ('images', 'property-images', 'profile-images'));

CREATE POLICY "Individual User Access"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id IN ('documents', 'profile-images') AND 
    (owner = auth.uid() OR 
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid() AND users.user_type = 'admin'
     ))
  )
  WITH CHECK (
    bucket_id IN ('documents', 'profile-images') AND 
    (owner = auth.uid() OR 
     EXISTS (
       SELECT 1 FROM users
       WHERE users.id = auth.uid() AND users.user_type = 'admin'
     ))
  );

CREATE POLICY "Admin Access"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Create notification function for user changes
CREATE OR REPLACE FUNCTION enhanced_user_notification()
RETURNS TRIGGER AS $$
DECLARE
  notification_title TEXT;
  notification_message TEXT;
  notification_type TEXT := 'user_registration';
BEGIN
  -- For new users
  IF TG_OP = 'INSERT' THEN
    notification_title := 'New User Registration';
    notification_message := 'User ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.user_type || ') has registered.';
    
    -- Insert into notifications table
    INSERT INTO notifications (
      title, message, type, entity_type, entity_id, read
    ) VALUES (
      notification_title, notification_message, notification_type, 'user', NEW.id, false
    );
  
  -- For user verification status changes
  ELSIF TG_OP = 'UPDATE' AND OLD.verification_status != NEW.verification_status THEN
    notification_title := 'User Verification Status Changed';
    notification_message := 'User ' || NEW.first_name || ' ' || NEW.last_name || ' verification status changed to ' || NEW.verification_status;
    
    -- Insert into notifications table
    INSERT INTO notifications (
      title, message, type, entity_type, entity_id, read
    ) VALUES (
      notification_title, notification_message, 'verification', 'user', NEW.id, false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user notifications
DROP TRIGGER IF EXISTS user_notification_trigger ON users;
CREATE TRIGGER user_notification_trigger
AFTER INSERT OR UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION enhanced_user_notification();

-- Create notification function for inquiries
CREATE OR REPLACE FUNCTION create_inquiry_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_title TEXT;
  owner_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get property information
  SELECT title, owner_id INTO property_title, owner_id
  FROM properties
  WHERE id = NEW.property_id;
  
  -- For new inquiries
  IF TG_OP = 'INSERT' THEN
    notification_title := 'New Property Inquiry';
    notification_message := NEW.name || ' is interested in ' || property_title;
    
    -- Insert into notifications table for property owner
    INSERT INTO notifications (
      title, message, type, entity_type, entity_id, read
    ) VALUES (
      notification_title, notification_message, 'inquiry', 'inquiry', NEW.id, false
    );
  
  -- For status changes
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    notification_title := 'Inquiry Status Updated';
    notification_message := 'Inquiry for ' || property_title || ' status changed to ' || NEW.status;
    
    -- Insert into notifications table for property owner
    INSERT INTO notifications (
      title, message, type, entity_type, entity_id, read
    ) VALUES (
      notification_title, notification_message, 'inquiry', 'inquiry', NEW.id, false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for inquiry notifications
DROP TRIGGER IF EXISTS inquiry_notification_trigger ON inquiries;
CREATE TRIGGER inquiry_notification_trigger
AFTER INSERT OR UPDATE OF status ON inquiries
FOR EACH ROW
EXECUTE FUNCTION create_inquiry_notification();

-- Create notification function for bookings
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_title TEXT;
  owner_id UUID;
  customer_name TEXT;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Get property information
  SELECT p.title, p.owner_id, CONCAT(u.first_name, ' ', u.last_name)
  INTO property_title, owner_id, customer_name
  FROM properties p
  LEFT JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.property_id;
  
  -- For new bookings
  IF TG_OP = 'INSERT' THEN
    notification_title := 'New Property Tour Request';
    notification_message := customer_name || ' wants to tour ' || property_title || ' on ' || NEW.booking_date;
    
    -- Insert into notifications table for property owner
    INSERT INTO notifications (
      title, message, type, entity_type, entity_id, read
    ) VALUES (
      notification_title, notification_message, 'booking', 'booking', NEW.id, false
    );
  
  -- For status changes
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    notification_title := 'Tour Request Status Updated';
    notification_message := 'Tour request for ' || property_title || ' status changed to ' || NEW.status;
    
    -- Insert into notifications table for property owner and customer
    INSERT INTO notifications (
      title, message, type, entity_type, entity_id, read
    ) VALUES (
      notification_title, notification_message, 'booking', 'booking', NEW.id, false
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for booking notifications
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
CREATE TRIGGER booking_notification_trigger
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_notification();

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index on notifications
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Admin can manage all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Allow system to create notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view notifications meant for them" ON notifications;

-- Create notification policies
CREATE POLICY "Admin can manage all notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

CREATE POLICY "Allow system to create notifications"
  ON notifications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view notifications meant for them"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    (EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )) OR
    (EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = notifications.entity_id AND properties.owner_id = auth.uid()
    )) OR
    (EXISTS (
      SELECT 1 FROM inquiries
      WHERE inquiries.id = notifications.entity_id AND inquiries.user_id = auth.uid()
    )) OR
    (EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = notifications.entity_id AND bookings.user_id = auth.uid()
    ))
  );