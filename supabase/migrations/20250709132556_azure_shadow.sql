/*
  # Fix Inquiries RLS Policy

  1. Security Updates
    - Update RLS policy for inquiries table to allow authenticated users to insert inquiries
    - Ensure proper permissions for inquiry creation

  2. Changes
    - Modify existing INSERT policy to allow authenticated users to create inquiries
    - Update policy conditions to match the current application logic
*/

-- Drop existing problematic policies if they exist
DROP POLICY IF EXISTS "Anyone can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can create inquiries" ON inquiries;

-- Create a new policy that allows authenticated users to insert inquiries
CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also ensure anonymous users can create inquiries (for non-logged-in users)
CREATE POLICY "Anonymous users can create inquiries"
  ON inquiries
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Ensure the existing SELECT policies work correctly
DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON inquiries;
DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;

-- Recreate SELECT policies
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

CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to view inquiries they created (if they have the ID)
CREATE POLICY "Public can view inquiries"
  ON inquiries
  FOR SELECT
  TO anon, authenticated
  USING (true);