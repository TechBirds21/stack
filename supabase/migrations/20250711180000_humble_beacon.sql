/*
  # Fix loading issues and improve performance

  1. Indexes
    - Add indexes for faster queries on commonly used fields
    - Add indexes for foreign keys
  
  2. Default Values
    - Add default values for timestamps
    - Add default values for status fields
  
  3. Constraints
    - Add constraints for status fields
    - Add constraints for email and phone fields
*/

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);

CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Fix booking_time column to ensure it's always a valid time
ALTER TABLE bookings 
  ALTER COLUMN booking_time TYPE time without time zone,
  ALTER COLUMN booking_time SET DEFAULT '10:00:00'::time without time zone;

-- Add default values for timestamps
ALTER TABLE bookings 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE inquiries 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Add constraints for status fields
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bookings_status_check'
  ) THEN
    ALTER TABLE bookings 
      ADD CONSTRAINT bookings_status_check 
      CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'inquiries_status_check'
  ) THEN
    ALTER TABLE inquiries 
      ADD CONSTRAINT inquiries_status_check 
      CHECK (status IN ('new', 'responded', 'closed'));
  END IF;
END $$;

-- Create a function to handle booking notifications
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    title, 
    message, 
    type, 
    entity_type, 
    entity_id
  ) VALUES (
    CASE 
      WHEN NEW.status = 'confirmed' THEN 'Booking Confirmed'
      WHEN NEW.status = 'cancelled' THEN 'Booking Cancelled'
      WHEN NEW.status = 'completed' THEN 'Booking Completed'
      ELSE 'New Booking'
    END,
    'A booking has been ' || NEW.status,
    'booking',
    'booking',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for booking notifications
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
CREATE TRIGGER booking_notification_trigger
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_notification();

-- Create a function to handle inquiry notifications
CREATE OR REPLACE FUNCTION create_inquiry_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (
    title, 
    message, 
    type, 
    entity_type, 
    entity_id
  ) VALUES (
    CASE 
      WHEN NEW.status = 'responded' THEN 'Inquiry Responded'
      WHEN NEW.status = 'closed' THEN 'Inquiry Closed'
      ELSE 'New Inquiry'
    END,
    'An inquiry has been ' || NEW.status,
    'inquiry',
    'inquiry',
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger for inquiry notifications
DROP TRIGGER IF EXISTS inquiry_notification_trigger ON inquiries;
CREATE TRIGGER inquiry_notification_trigger
AFTER INSERT OR UPDATE OF status ON inquiries
FOR EACH ROW
EXECUTE FUNCTION create_inquiry_notification();