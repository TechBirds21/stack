/*
  # Fix Users Table RLS Policies Completely

  1. Security Changes
    - Disable RLS temporarily to clear all existing policies
    - Drop all existing policies that might be conflicting
    - Re-enable RLS with proper policies
    - Add comprehensive admin policies for user management
    - Add proper user self-management policies

  2. Policies Added
    - Admin can manage all users (INSERT, SELECT, UPDATE, DELETE)
    - Users can view and update their own data
    - Service role can create users (for Supabase Auth)
*/

-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all users" ON users;
DROP POLICY IF EXISTS "Allow user creation during signup" ON users;
DROP POLICY IF EXISTS "Authenticated admins can create users" ON users;
DROP POLICY IF EXISTS "Service role can create users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "admin_users_all_policy" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_insert_admin" ON users;
DROP POLICY IF EXISTS "users_delete_admin" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create comprehensive admin policy for all operations
CREATE POLICY "admin_full_access" ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user 
      WHERE admin_user.id = auth.uid() 
      AND admin_user.user_type = 'admin'
    )
  );

-- Allow users to view their own data
CREATE POLICY "users_view_own" ON users
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Allow users to update their own data
CREATE POLICY "users_update_own" ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Allow service role to create users (needed for Supabase Auth)
CREATE POLICY "service_role_insert" ON users
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Allow authenticated users to insert their own record during signup
CREATE POLICY "users_insert_own" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());