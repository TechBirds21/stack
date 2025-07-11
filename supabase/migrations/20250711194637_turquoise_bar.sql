/*
  # Fix RLS Policies for Admin Operations

  1. Security Updates
    - Add admin policies for properties table (INSERT, UPDATE, DELETE)
    - Add admin policies for property-images storage bucket
    - Add admin policies for all related tables
    - Ensure admins can perform all operations

  2. Storage Policies
    - Create property-images bucket if not exists
    - Add policies for image upload/download
    - Allow public read access for property images
*/

-- Enable RLS on properties table
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Anyone can view active properties" ON properties;
DROP POLICY IF EXISTS "Sellers can view their own properties" ON properties;
DROP POLICY IF EXISTS "Sellers can update their own properties" ON properties;
DROP POLICY IF EXISTS "Sellers can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Users can create properties" ON properties;
DROP POLICY IF EXISTS "Users can update their own properties" ON properties;
DROP POLICY IF EXISTS "Agents can view all properties" ON properties;

-- Create comprehensive policies for properties table
CREATE POLICY "Public can view active properties"
  ON properties
  FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Authenticated users can view properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can do everything with properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Property owners can manage their properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Agents can view assigned properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    agent_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'agent'
    )
  );

-- Create storage bucket for property images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies
DROP POLICY IF EXISTS "Public can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can manage all property images" ON storage.objects;
DROP POLICY IF EXISTS "Property owners can upload images" ON storage.objects;

-- Create storage policies for property-images bucket
CREATE POLICY "Public can view property images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-images');

CREATE POLICY "Admins can manage all property images"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    bucket_id = 'property-images' AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

CREATE POLICY "Property owners can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Property owners can update their images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  )
  WITH CHECK (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Property owners can delete their images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-images' AND
    auth.uid() IS NOT NULL
  );

-- Fix other tables RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

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

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Fix bookings table RLS
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Property owners can view bookings for their properties" ON bookings;
DROP POLICY IF EXISTS "Authenticated users can create bookings" ON bookings;

CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage all bookings"
  ON bookings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Fix inquiries table RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON inquiries;
DROP POLICY IF EXISTS "Anonymous users can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Public can view inquiries" ON inquiries;

CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

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

CREATE POLICY "Anyone can create inquiries"
  ON inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all inquiries"
  ON inquiries
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.user_type = 'admin'
    )
  );

-- Create default images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for images bucket
CREATE POLICY "Public can view images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'images');

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can update their images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'images')
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Users can delete their images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'images');