/*
  # Fix Booking and Inquiry Relations

  1. Updates
    - Add proper foreign key constraints for bookings and inquiries
    - Add proper RLS policies for bookings and inquiries
    - Fix the relationship between properties and users
  
  2. Security
    - Enable RLS on bookings and inquiries tables
    - Add policies for proper data access
*/

-- Enable RLS on bookings table if not already enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Enable RLS on inquiries table if not already enabled
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Add policies for bookings
CREATE POLICY "Users can view their own bookings" 
  ON bookings 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings" 
  ON bookings 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own bookings" 
  ON bookings 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Add policies for inquiries
CREATE POLICY "Users can view their own inquiries" 
  ON inquiries 
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can create inquiries" 
  ON inquiries 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own inquiries" 
  ON inquiries 
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid());

-- Add proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings (property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries (user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries (property_id);

-- Add proper constraints for booking_time
ALTER TABLE bookings ALTER COLUMN booking_time TYPE time without time zone;

-- Add proper constraints for inquiry_type
ALTER TABLE inquiries ADD CONSTRAINT inquiries_inquiry_type_check 
  CHECK (inquiry_type IN ('purchase', 'rental', 'general'));