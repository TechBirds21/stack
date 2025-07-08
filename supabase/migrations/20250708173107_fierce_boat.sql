/*
  # Fix RLS policy for bookings table

  1. Changes
    - Drop existing policies that use incorrect `uid()` function
    - Create new policies using correct `auth.uid()` function
    - Ensure proper INSERT and SELECT permissions for authenticated users

  2. Security
    - Users can only create bookings for themselves
    - Users can view their own bookings
    - Property owners can view bookings for their properties
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Property owners can view bookings for their properties" ON bookings;

-- Create corrected policies with proper auth.uid() function
CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

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
      SELECT 1
      FROM properties
      WHERE properties.id = bookings.property_id
        AND properties.owner_id = auth.uid()
    )
  );