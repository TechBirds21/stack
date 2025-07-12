/*
  # Fix RLS Policies for Admin User Creation

  1. Security Updates
    - Drop existing conflicting policies
    - Create proper admin policies for user creation
    - Allow admins to perform all operations on users table
    - Maintain security for non-admin users

  2. Policy Structure
    - Admins can create, read, update any user
    - Users can read/update their own data
    - Public can view active properties
*/

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Admins can create users" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;

-- Create comprehensive admin policies for users table
CREATE POLICY "Admins can create any user" 
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can view all users" 
ON public.users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all users" 
ON public.users
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can delete users" 
ON public.users
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Allow users to view and update their own data
CREATE POLICY "Users can view their own data" 
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" 
ON public.users
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Similar policies for other tables that admins need to manage

-- Properties table policies
DROP POLICY IF EXISTS "Admins can create properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can view all properties" ON public.properties;
DROP POLICY IF EXISTS "Admins can update all properties" ON public.properties;

CREATE POLICY "Admins can create properties" 
ON public.properties
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can view all properties" 
ON public.properties
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all properties" 
ON public.properties
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Bookings table policies
DROP POLICY IF EXISTS "Admins can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON public.bookings;

CREATE POLICY "Admins can create bookings" 
ON public.bookings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can view all bookings" 
ON public.bookings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all bookings" 
ON public.bookings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Inquiries table policies
DROP POLICY IF EXISTS "Admins can create inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins can view all inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Admins can update all inquiries" ON public.inquiries;

CREATE POLICY "Admins can create inquiries" 
ON public.inquiries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can view all inquiries" 
ON public.inquiries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

CREATE POLICY "Admins can update all inquiries" 
ON public.inquiries
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND user_type = 'admin'
  )
);

-- Notifications table policies (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can update all notifications" ON public.notifications;

    EXECUTE 'CREATE POLICY "Admins can create notifications" 
    ON public.notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = ''admin''
      )
    )';

    EXECUTE 'CREATE POLICY "Admins can view all notifications" 
    ON public.notifications
    FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = ''admin''
      )
    )';

    EXECUTE 'CREATE POLICY "Admins can update all notifications" 
    ON public.notifications
    FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.users 
        WHERE id = auth.uid() AND user_type = ''admin''
      )
    )';
  END IF;
END $$;

-- Ensure RLS is enabled on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Enable RLS on notifications table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    EXECUTE 'ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY';
  END IF;
END $$;