/*
  # Fix notification RLS policies and database triggers

  1. Security Updates
    - Update RLS policies on notifications table to allow system-generated notifications
    - Allow authenticated users and system to insert notifications properly

  2. Trigger Fixes
    - Fix database triggers that incorrectly reference OLD record during INSERT operations
    - Ensure triggers handle both INSERT and UPDATE operations correctly

  3. Policy Updates
    - Add policy for system-generated notifications from triggers
    - Maintain security while allowing proper notification creation
*/

-- Enable RLS on notifications table if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive policies that might be blocking system notifications
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON notifications;

-- Create new policies that allow proper notification creation
CREATE POLICY "Allow system to create notifications"
  ON notifications
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can view notifications meant for them"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    -- Allow if user is admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
    OR
    -- Allow if notification is related to user's property
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = notifications.entity_id::uuid 
      AND properties.owner_id = auth.uid()
    )
    OR
    -- Allow if notification is related to user's inquiry
    EXISTS (
      SELECT 1 FROM inquiries 
      WHERE inquiries.id = notifications.entity_id::uuid 
      AND inquiries.user_id = auth.uid()
    )
    OR
    -- Allow if notification is related to user's booking
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = notifications.entity_id::uuid 
      AND bookings.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Fix the enhanced_user_notification function to handle INSERT vs UPDATE properly
CREATE OR REPLACE FUNCTION enhanced_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if this is an INSERT or if verification_status actually changed
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.verification_status IS DISTINCT FROM NEW.verification_status) THEN
    
    -- Handle verification status changes
    IF NEW.verification_status = 'verified' THEN
      INSERT INTO notifications (
        title,
        message,
        type,
        entity_type,
        entity_id
      ) VALUES (
        'Account Verified',
        'Your account has been successfully verified. You can now access all features.',
        'verification',
        'user',
        NEW.id
      );
    ELSIF NEW.verification_status = 'rejected' THEN
      INSERT INTO notifications (
        title,
        message,
        type,
        entity_type,
        entity_id
      ) VALUES (
        'Account Verification Failed',
        'Your account verification was rejected. Please contact support for assistance.',
        'verification',
        'user',
        NEW.id
      );
    END IF;

    -- Handle new user registration (INSERT only)
    IF TG_OP = 'INSERT' THEN
      INSERT INTO notifications (
        title,
        message,
        type,
        entity_type,
        entity_id
      ) VALUES (
        'Welcome to Our Platform',
        'Welcome! Your account has been created successfully. Please verify your email to get started.',
        'welcome',
        'user',
        NEW.id
      );
    END IF;

  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the enhanced_inquiry_notification function to handle INSERT properly
CREATE OR REPLACE FUNCTION enhanced_inquiry_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id uuid;
  property_title text;
  inquirer_name text;
BEGIN
  -- Get property owner and title
  SELECT owner_id, title INTO property_owner_id, property_title
  FROM properties 
  WHERE id = NEW.property_id;
  
  -- Get inquirer name
  inquirer_name := NEW.name;
  
  -- Create notification for property owner
  IF property_owner_id IS NOT NULL THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'New Property Inquiry',
      'You have received a new inquiry for "' || COALESCE(property_title, 'your property') || '" from ' || COALESCE(inquirer_name, 'a potential buyer') || '.',
      'inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  -- Create notification for inquirer (if they have an account)
  IF NEW.user_id IS NOT NULL THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'Inquiry Submitted',
      'Your inquiry for "' || COALESCE(property_title, 'the property') || '" has been submitted successfully. The property owner will contact you soon.',
      'inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix the create_notification function to handle INSERT properly
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_owner_id uuid;
  property_title text;
  user_name text;
BEGIN
  -- Get property owner and title
  SELECT owner_id, title INTO property_owner_id, property_title
  FROM properties 
  WHERE id = NEW.property_id;
  
  -- Get user name
  SELECT CONCAT(first_name, ' ', last_name) INTO user_name
  FROM users 
  WHERE id = NEW.user_id;
  
  -- Create notification for property owner
  IF property_owner_id IS NOT NULL THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'New Booking Request',
      COALESCE(user_name, 'A user') || ' has requested to book a tour for "' || COALESCE(property_title, 'your property') || '" on ' || NEW.booking_date || ' at ' || NEW.booking_time || '.',
      'booking',
      'booking',
      NEW.id
    );
  END IF;
  
  -- Create notification for user
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'Tour Request Submitted',
    'Your tour request for "' || COALESCE(property_title, 'the property') || '" has been submitted for ' || NEW.booking_date || ' at ' || NEW.booking_time || '. The property owner will confirm shortly.',
    'booking',
    'booking',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure all functions are set with SECURITY DEFINER to bypass RLS
ALTER FUNCTION enhanced_user_notification() SECURITY DEFINER;
ALTER FUNCTION enhanced_inquiry_notification() SECURITY DEFINER;
ALTER FUNCTION create_notification() SECURITY DEFINER;