/*
  # Fix booking and inquiry errors

  1. Changes
     - Add default timestamps to bookings and inquiries tables
     - Fix booking_time column to ensure proper time format
     - Add constraints for inquiry_type
     - Create indexes for faster queries
     - Add Row Level Security (RLS) policies
*/

-- Fix booking_time column to ensure proper time format
ALTER TABLE bookings ALTER COLUMN booking_time TYPE time without time zone;

-- Add default timestamps to bookings
ALTER TABLE bookings 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Add default timestamps to inquiries
ALTER TABLE inquiries 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Add constraints for inquiry_type
ALTER TABLE inquiries 
  ADD CONSTRAINT inquiries_inquiry_type_check 
  CHECK (inquiry_type IN ('purchase', 'rental', 'general'));

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);

-- Add Row Level Security (RLS) policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

-- Property owners can view bookings for their properties
CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = uid()
    )
  );

-- Add Row Level Security (RLS) policies for inquiries
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own inquiries
CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

-- Property owners can view inquiries for their properties
CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = uid()
    )
  );