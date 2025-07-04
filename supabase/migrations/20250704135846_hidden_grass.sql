/*
  # Initial Schema Setup for Home & Own

  1. New Tables
    - `users` - User accounts with authentication
    - `properties` - Property listings
    - `bookings` - Property tour bookings
    - `inquiries` - Property inquiries
  
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  date_of_birth date,
  user_type text NOT NULL DEFAULT 'buyer',
  status text NOT NULL DEFAULT 'active',
  verification_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  price numeric,
  monthly_rent numeric,
  security_deposit numeric,
  property_type text NOT NULL,
  bedrooms integer,
  bathrooms integer,
  area_sqft numeric NOT NULL,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  zip_code text NOT NULL,
  latitude numeric,
  longitude numeric,
  images text[],
  amenities text[],
  owner_id uuid REFERENCES users(id),
  status text DEFAULT 'active',
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  listing_type text NOT NULL,
  available_from date,
  furnishing_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) NOT NULL,
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Create policies for properties table
CREATE POLICY "Anyone can view active properties"
  ON properties
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can create properties"
  ON properties
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties"
  ON properties
  FOR UPDATE
  USING (auth.uid() = owner_id);

-- Create policies for bookings table
CREATE POLICY "Users can view their own bookings"
  ON bookings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookings"
  ON bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = bookings.property_id
    AND properties.owner_id = auth.uid()
  ));

-- Create policies for inquiries table
CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can create inquiries"
  ON inquiries
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries
  FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = inquiries.property_id
    AND properties.owner_id = auth.uid()
  ));

-- Insert sample data
INSERT INTO properties (
  title, description, price, monthly_rent, property_type, 
  bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
  latitude, longitude, images, amenities, status, featured, verified, listing_type
) VALUES 
(
  'Beautiful 3BHK Apartment in Prime Location',
  'Spacious apartment with modern amenities in a prime location.',
  5000000, NULL, 'apartment', 3, 2, 1200, 'MG Road', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.6868, 83.2185, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Power Backup', 'Security', 'Parking'], 'active', true, true, 'SALE'
),
(
  'Luxury Villa with Garden',
  'Beautiful villa with spacious garden and modern amenities.',
  8500000, NULL, 'villa', 4, 3, 2500, 'Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530002',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
  ARRAY['Garden', 'Swimming Pool', 'Gym'], 'active', true, true, 'SALE'
),
(
  'Modern 2BHK Flat',
  'Contemporary flat with all modern amenities in a great location.',
  3500000, NULL, 'apartment', 2, 2, 950, 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', '530016',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Parking'], 'active', true, true, 'SALE'
),
(
  'Fully Furnished 2BHK Apartment',
  'Beautifully furnished apartment ready to move in.',
  NULL, 25000, 'apartment', 2, 2, 1100, 'MVP Colony', 'Visakhapatnam', 'Andhra Pradesh', '530017',
  17.7342, 83.3255, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Furnished', 'Power Backup', 'Security'], 'active', false, true, 'RENT'
),
(
  'Spacious 3BHK House',
  'Large house with garden and parking in a quiet neighborhood.',
  NULL, 35000, 'house', 3, 3, 1500, 'Gajuwaka', 'Visakhapatnam', 'Andhra Pradesh', '530026',
  17.6868, 83.2185, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
  ARRAY['Garden', 'Parking', 'Security'], 'active', false, true, 'RENT'
),
(
  'Modern Studio Apartment',
  'Compact and stylish studio apartment perfect for singles or couples.',
  NULL, 18000, 'studio', 1, 1, 600, 'Siripuram', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Furnished', 'Power Backup', 'Lift'], 'active', false, true, 'RENT'
);