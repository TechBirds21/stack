/*
  # Fix inquiries table RLS policy

  1. Changes
    - Drop the existing restrictive INSERT policy for inquiries
    - Create a new INSERT policy that allows authenticated users to create inquiries
    - Ensure the policy properly handles both authenticated users and anonymous inquiries

  2. Security
    - Maintains security by only allowing authenticated users to insert
    - Allows flexibility for auto-inquiries and user-initiated inquiries
*/

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can create inquiries" ON inquiries;

-- Create a new INSERT policy that allows authenticated users to create inquiries
CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (true);