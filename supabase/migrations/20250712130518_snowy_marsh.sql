/*
  # Complete Database Schema for Home & Own

  1. New Tables
    - `users` - User accounts with authentication
    - `properties` - Property listings
    - `bookings` - Property tour bookings
    - `inquiries` - Property inquiries
    - `notifications` - System notifications
    - `seller_profiles` - Additional seller information
    - `agent_profiles` - Additional agent information
    - `agent_bank_details` - Agent payment information
    - `agent_inquiry_assignments` - Inquiry assignments to agents
    - `earnings` - Agent earnings records
    - `documents` - Document storage metadata
  
  2. Security
    - Enable RLS on all tables
    - Add policies for data access
    
  3. Functions
    - Custom ID generation
    - Email verification
    - Bank account verification
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_id text UNIQUE,
  email text UNIQUE NOT NULL,
  password_hash text,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  date_of_birth date,
  user_type text NOT NULL DEFAULT 'buyer',
  status text NOT NULL DEFAULT 'active',
  verification_status text NOT NULL DEFAULT 'pending',
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  agent_license_number text,
  city text,
  state text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_id text UNIQUE,
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

-- Bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL REFERENCES users(id),
  agent_id uuid REFERENCES users(id),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid REFERENCES users(id),
  assigned_agent_id uuid REFERENCES users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new',
  inquiry_type text,
  location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id text,
  user_id uuid REFERENCES users(id),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Seller profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) UNIQUE,
  business_name text,
  business_type text,
  experience_years integer,
  license_number text,
  pan_number text,
  gst_number text,
  address text,
  city text,
  state text,
  pincode text,
  bank_account text,
  ifsc_code text,
  documents jsonb,
  verification_status text DEFAULT 'pending',
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) UNIQUE,
  education_background text,
  specialization text,
  bio text,
  experience_years integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent bank details table
CREATE TABLE IF NOT EXISTS agent_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) UNIQUE,
  bank_account_number text NOT NULL,
  ifsc_code text NOT NULL,
  account_verified boolean DEFAULT false,
  account_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent inquiry assignments table
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid NOT NULL REFERENCES inquiries(id),
  agent_id uuid NOT NULL REFERENCES users(id),
  status text DEFAULT 'pending',
  assigned_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  responded_at timestamptz,
  notes text
);

-- Agent property assignments table
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  agent_id uuid NOT NULL REFERENCES users(id),
  status text DEFAULT 'active',
  assigned_at timestamptz DEFAULT now(),
  notes text
);

-- Earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  year integer NOT NULL,
  month integer NOT NULL,
  total_commission numeric NOT NULL DEFAULT 0,
  sale_commission numeric DEFAULT 0,
  rental_commission numeric DEFAULT 0,
  bonus numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, year, month)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_by uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_category text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users policies
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Properties policies
CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create properties" ON properties
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own properties" ON properties
  FOR UPDATE USING (auth.uid() = owner_id);

-- Bookings policies
CREATE POLICY "Property owners can view bookings for their properties" ON bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = bookings.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

-- Inquiries policies
CREATE POLICY "Property owners can view inquiries for their properties" ON inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inquiries" ON inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can view their own inquiries" ON inquiries
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Create functions for custom ID generation
CREATE OR REPLACE FUNCTION generate_custom_id(prefix text, table_name text)
RETURNS text AS $$
DECLARE
  last_id text;
  new_id text;
  counter integer;
BEGIN
  -- Get the last ID with the given prefix
  EXECUTE format('SELECT custom_id FROM %I WHERE custom_id LIKE $1 ORDER BY custom_id DESC LIMIT 1', table_name)
  INTO last_id
  USING prefix || '%';
  
  -- Extract the counter from the last ID or start at 1
  IF last_id IS NULL THEN
    counter := 1;
  ELSE
    counter := (regexp_replace(last_id, '^' || prefix, '', 'i')::integer) + 1;
  END IF;
  
  -- Generate the new ID with leading zeros
  new_id := prefix || lpad(counter::text, 3, '0');
  
  RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for custom ID generation
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_id IS NULL THEN
    CASE NEW.user_type
      WHEN 'buyer' THEN
        NEW.custom_id := generate_custom_id('BUYER', 'users');
      WHEN 'seller' THEN
        NEW.custom_id := generate_custom_id('SELLER', 'users');
      WHEN 'agent' THEN
        NEW.custom_id := generate_custom_id('AGENT', 'users');
      WHEN 'admin' THEN
        NEW.custom_id := generate_custom_id('ADMIN', 'users');
      ELSE
        NEW.custom_id := generate_custom_id('USER', 'users');
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_id IS NULL THEN
    CASE NEW.listing_type
      WHEN 'SALE' THEN
        NEW.custom_id := generate_custom_id('SALE', 'properties');
      WHEN 'RENT' THEN
        NEW.custom_id := generate_custom_id('RENT', 'properties');
      ELSE
        NEW.custom_id := generate_custom_id('PROP', 'properties');
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create email verification function
CREATE OR REPLACE FUNCTION verify_email_token(token_param text)
RETURNS jsonb AS $$
DECLARE
  user_id uuid;
  result jsonb;
BEGIN
  -- In a real implementation, this would validate a token
  -- For demo purposes, we'll just return success
  result := jsonb_build_object(
    'success', true,
    'message', 'Email verified successfully'
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create bank account verification function
CREATE OR REPLACE FUNCTION verify_agent_bank_account(agent_id uuid)
RETURNS boolean AS $$
DECLARE
  success boolean;
BEGIN
  -- In a real implementation, this would verify with a bank API
  -- For demo purposes, we'll just update the record
  UPDATE agent_bank_details
  SET 
    account_verified = true,
    account_verified_at = now()
  WHERE agent_id = $1;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  RETURN success > 0;
END;
$$ LANGUAGE plpgsql;

-- Create notification function
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (title, message, type, entity_type, entity_id, user_id)
  VALUES (
    CASE
      WHEN TG_TABLE_NAME = 'bookings' THEN 'New Booking'
      WHEN TG_TABLE_NAME = 'inquiries' THEN 'New Inquiry'
      ELSE 'New ' || TG_TABLE_NAME
    END,
    CASE
      WHEN TG_TABLE_NAME = 'bookings' THEN 'A new booking has been created'
      WHEN TG_TABLE_NAME = 'inquiries' THEN 'A new inquiry has been received'
      ELSE 'A new ' || TG_TABLE_NAME || ' has been created'
    END,
    TG_TABLE_NAME,
    TG_TABLE_NAME,
    NEW.id,
    CASE
      WHEN TG_TABLE_NAME = 'bookings' THEN 
        (SELECT owner_id FROM properties WHERE id = NEW.property_id)
      WHEN TG_TABLE_NAME = 'inquiries' THEN 
        (SELECT owner_id FROM properties WHERE id = NEW.property_id)
      ELSE NULL
    END
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER assign_user_custom_id_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

CREATE TRIGGER assign_property_custom_id_trigger
BEFORE INSERT ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

CREATE TRIGGER create_booking_notification
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_notification();

CREATE TRIGGER create_inquiry_notification
AFTER INSERT ON inquiries
FOR EACH ROW
EXECUTE FUNCTION create_notification();

-- Insert sample data
-- Sample users
INSERT INTO users (email, first_name, last_name, user_type, status, verification_status, password_hash, phone_number, city, state)
VALUES
  ('admin@homeandown.com', 'Admin', 'User', 'admin', 'active', 'verified', '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', '+91 9876543210', 'Hyderabad', 'Telangana'),
  ('buyer@example.com', 'John', 'Doe', 'buyer', 'active', 'verified', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', '+91 9876543211', 'Visakhapatnam', 'Andhra Pradesh'),
  ('seller@example.com', 'Jane', 'Smith', 'seller', 'active', 'verified', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', '+91 9876543212', 'Hyderabad', 'Telangana'),
  ('agent@example.com', 'Alex', 'Johnson', 'agent', 'active', 'verified', 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3', '+91 9876543213', 'Bangalore', 'Karnataka')
ON CONFLICT (email) DO NOTHING;

-- Sample properties
INSERT INTO properties (title, description, price, monthly_rent, property_type, bedrooms, bathrooms, area_sqft, address, city, state, zip_code, latitude, longitude, images, amenities, listing_type, status, owner_id)
VALUES
  (
    'Beautiful 3BHK Apartment in Prime Location',
    'Spacious apartment with modern amenities in a prime location.',
    5000000, NULL, 'apartment', 3, 2, 1200, 'MG Road', 'Visakhapatnam', 'Andhra Pradesh', '530003',
    17.6868, 83.2185, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
    ARRAY['Power Backup', 'Security', 'Parking'], 'SALE', 'active',
    (SELECT id FROM users WHERE email = 'seller@example.com')
  ),
  (
    'Luxury Villa with Garden',
    'Beautiful villa with spacious garden and modern amenities.',
    8500000, NULL, 'villa', 4, 3, 2500, 'Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530002',
    17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
    ARRAY['Garden', 'Swimming Pool', 'Gym'], 'SALE', 'active',
    (SELECT id FROM users WHERE email = 'seller@example.com')
  ),
  (
    'Modern 2BHK Flat',
    'Contemporary flat with all modern amenities in a great location.',
    NULL, 25000, 'apartment', 2, 2, 950, 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', '530016',
    17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
    ARRAY['Power Backup', 'Lift', 'Parking'], 'RENT', 'active',
    (SELECT id FROM users WHERE email = 'seller@example.com')
  )
ON CONFLICT DO NOTHING;

-- Sample bookings
INSERT INTO bookings (property_id, user_id, booking_date, booking_time, status, notes)
VALUES
  (
    (SELECT id FROM properties WHERE title = 'Beautiful 3BHK Apartment in Prime Location' LIMIT 1),
    (SELECT id FROM users WHERE email = 'buyer@example.com'),
    (CURRENT_DATE + INTERVAL '1 day'),
    '10:00:00',
    'pending',
    'Interested in viewing the property'
  )
ON CONFLICT DO NOTHING;

-- Sample inquiries
INSERT INTO inquiries (property_id, user_id, name, email, phone, message, status)
VALUES
  (
    (SELECT id FROM properties WHERE title = 'Luxury Villa with Garden' LIMIT 1),
    (SELECT id FROM users WHERE email = 'buyer@example.com'),
    'John Doe',
    'buyer@example.com',
    '+91 9876543211',
    'I am interested in this property. Please contact me with more details.',
    'new'
  )
ON CONFLICT DO NOTHING;

-- Sample agent profile
INSERT INTO agent_profiles (user_id, education_background, specialization, bio, experience_years)
VALUES
  (
    (SELECT id FROM users WHERE email = 'agent@example.com'),
    'MBA in Real Estate',
    'Luxury Properties',
    'Experienced real estate agent specializing in luxury properties.',
    5
  )
ON CONFLICT DO NOTHING;

-- Sample agent bank details
INSERT INTO agent_bank_details (agent_id, bank_account_number, ifsc_code)
VALUES
  (
    (SELECT id FROM users WHERE email = 'agent@example.com'),
    '1234567890',
    'SBIN0001234'
  )
ON CONFLICT DO NOTHING;

-- Sample notifications
INSERT INTO notifications (title, message, type, entity_type, entity_id, user_id)
VALUES
  (
    'Welcome to Home & Own',
    'Thank you for joining our platform. Start exploring properties now!',
    'system',
    'user',
    (SELECT id FROM users WHERE email = 'buyer@example.com'),
    (SELECT id FROM users WHERE email = 'buyer@example.com')
  ),
  (
    'New Property Inquiry',
    'You have received a new inquiry for your property.',
    'inquiry',
    'inquiry',
    (SELECT id FROM inquiries LIMIT 1),
    (SELECT id FROM users WHERE email = 'seller@example.com')
  )
ON CONFLICT DO NOTHING;