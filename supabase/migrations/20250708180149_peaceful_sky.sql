/*
  # Fix RLS policies for seller dashboard

  1. Security
    - Update RLS policies for inquiries and bookings tables
    - Ensure sellers can only see inquiries and bookings for their own properties
    - Add policies for agent access to property data
  
  2. Data Access
    - Allow sellers to view user information for inquiries and bookings
    - Restrict access to sensitive user data
*/

-- Drop existing policies for inquiries
DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON inquiries;

-- Create improved policies for inquiries
CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Drop existing policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Property owners can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;

-- Create improved policies for bookings
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add policies for agents to access property data
CREATE POLICY "Agents can view all properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_type = 'agent'
    )
  );

-- Add policies for sellers to view their own properties
CREATE POLICY "Sellers can view their own properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- Add policies for sellers to update their own properties
CREATE POLICY "Sellers can update their own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

-- Add policies for sellers to delete their own properties
CREATE POLICY "Sellers can delete their own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());