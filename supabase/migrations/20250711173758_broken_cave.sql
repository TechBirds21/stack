/*
  # Fix Realtime Data and Modals

  1. Updates
    - Add default timestamps to bookings and inquiries
    - Add proper indexes for faster queries
    - Fix booking_time and inquiry_type constraints
    - Add RLS policies for better security

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Fix booking_time column to ensure proper time format
ALTER TABLE bookings 
  ALTER COLUMN booking_time TYPE time without time zone;

-- Add default timestamps to ensure they're always set
ALTER TABLE bookings 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

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
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at);

-- Enable RLS on all tables if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for bookings
CREATE POLICY "Users can view their own bookings" 
  ON bookings FOR SELECT 
  TO authenticated 
  USING (uid() = user_id);

CREATE POLICY "Users can create bookings" 
  ON bookings FOR INSERT 
  TO authenticated 
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
  ON bookings FOR UPDATE 
  TO authenticated 
  USING (uid() = user_id);

CREATE POLICY "Users can delete their own bookings" 
  ON bookings FOR DELETE 
  TO authenticated 
  USING (uid() = user_id);

-- Add RLS policies for inquiries
CREATE POLICY "Users can view their own inquiries" 
  ON inquiries FOR SELECT 
  TO authenticated 
  USING (uid() = user_id);

CREATE POLICY "Users can create inquiries" 
  ON inquiries FOR INSERT 
  TO authenticated 
  WITH CHECK (uid() = user_id);

CREATE POLICY "Users can update their own inquiries" 
  ON inquiries FOR UPDATE 
  TO authenticated 
  USING (uid() = user_id);

CREATE POLICY "Users can delete their own inquiries" 
  ON inquiries FOR DELETE 
  TO authenticated 
  USING (uid() = user_id);

-- Add policies for property owners to view bookings and inquiries for their properties
CREATE POLICY "Property owners can view bookings for their properties" 
  ON bookings FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = bookings.property_id 
      AND properties.owner_id = uid()
    )
  );

CREATE POLICY "Property owners can view inquiries for their properties" 
  ON inquiries FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = inquiries.property_id 
      AND properties.owner_id = uid()
    )
  );

-- Add policies for agents
CREATE POLICY "Agents can view all bookings" 
  ON bookings FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.user_type = 'agent'
    )
  );

CREATE POLICY "Agents can view all inquiries" 
  ON inquiries FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.user_type = 'agent'
    )
  );

-- Add policies for admins
CREATE POLICY "Admins can manage all bookings" 
  ON bookings FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Admins can manage all inquiries" 
  ON inquiries FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = uid() 
      AND users.user_type = 'admin'
    )
  );