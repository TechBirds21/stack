/*
  # Fix RLS policy for users table

  1. Security
    - Drop existing policies that may be conflicting
    - Create proper RLS policies for users table
    - Allow admins to create users
    - Allow users to view and update their own data
    - Allow admins to view and update all users
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can create any user" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;

-- Create comprehensive RLS policies for users table
CREATE POLICY "Admins can create any user"
ON users FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.user_type = 'admin'
  )
);

CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all users"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.user_type = 'admin'
  )
);

CREATE POLICY "Admins can delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM users admin_user
    WHERE admin_user.id = auth.uid() 
    AND admin_user.user_type = 'admin'
  )
);

CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);