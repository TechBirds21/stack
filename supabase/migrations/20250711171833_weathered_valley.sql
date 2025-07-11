/*
  # Fix booking and inquiry timestamps

  1. Changes
    - Add default timestamps to bookings and inquiries tables
    - Add indexes for faster queries
    - Update RLS policies for better security
*/

-- Fix bookings table timestamps
ALTER TABLE bookings 
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Fix inquiries table timestamps
ALTER TABLE inquiries
ALTER COLUMN created_at SET DEFAULT now(),
ALTER COLUMN updated_at SET DEFAULT now();

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);

-- Update RLS policies for bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own bookings" 
  ON bookings
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create bookings" 
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own bookings" 
  ON bookings
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id);

-- Update RLS policies for inquiries
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view their own inquiries" 
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can create inquiries" 
  ON inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update their own inquiries" 
  ON inquiries
  FOR UPDATE
  TO authenticated
  USING (uid() = user_id);