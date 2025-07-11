/*
  # Fix User Creation RLS Policy

  1. Security Changes
    - Add policy to allow admins to create users
    - Add policy to allow service role to create users during signup
    - Ensure proper RLS policies for user management

  2. Changes
    - Drop existing restrictive policies
    - Add comprehensive admin policies
    - Add service role policies for auth operations
*/

-- Drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create comprehensive policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow admins to do everything with users
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Allow service role to create users (for signup process)
CREATE POLICY "Service role can create users"
  ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to create users if they are admin
CREATE POLICY "Authenticated admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );

-- Also ensure the AddUserModal can work by allowing the user creation process
-- This policy allows the initial user creation during the signup process
CREATE POLICY "Allow user creation during signup"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Allow if the user being created matches the authenticated user
    id = auth.uid()
    OR
    -- Or if the authenticated user is an admin
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND user_type = 'admin'
    )
  );