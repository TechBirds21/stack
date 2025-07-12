/*
  # Complete Database Schema for Home & Own

  1. New Tables
    - `users` - User accounts with different roles (buyer, seller, agent, admin)
    - `properties` - Property listings with details
    - `bookings` - Property tour bookings
    - `inquiries` - Property inquiries
    - `notifications` - System notifications
    - `seller_profiles` - Additional seller information
    - `agent_profiles` - Additional agent information
    - `agent_bank_details` - Agent payment information
    - `agent_inquiry_assignments` - Assignments of inquiries to agents
    - `documents` - Document storage metadata
    - `earnings` - Agent earnings records

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
    - Set up custom ID generation triggers
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==================== USERS TABLE ====================
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
  profile_image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==================== PROPERTIES TABLE ====================
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
  nearby_highlights text[],
  owner_id uuid REFERENCES users(id),
  status text DEFAULT 'active',
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  listing_type text NOT NULL,
  available_from date,
  furnishing_status text,
  floor text,
  facing text,
  rera_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==================== BOOKINGS TABLE ====================
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

-- ==================== INQUIRIES TABLE ====================
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid REFERENCES users(id),
  assigned_agent_id uuid REFERENCES users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  inquiry_type text,
  location text,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==================== NOTIFICATIONS TABLE ====================
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

-- ==================== SELLER PROFILES TABLE ====================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id),
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

-- ==================== AGENT PROFILES TABLE ====================
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id),
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  education_background text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==================== AGENT BANK DETAILS TABLE ====================
CREATE TABLE IF NOT EXISTS agent_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid UNIQUE NOT NULL REFERENCES users(id),
  bank_account_number text NOT NULL,
  ifsc_code text NOT NULL,
  account_verified boolean DEFAULT false,
  account_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ==================== AGENT INQUIRY ASSIGNMENTS TABLE ====================
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

-- ==================== DOCUMENTS TABLE ====================
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

-- ==================== EARNINGS TABLE ====================
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

-- ==================== CUSTOM ID GENERATION TRIGGERS ====================

-- Function to generate custom ID for users
CREATE OR REPLACE FUNCTION generate_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_id TEXT;
BEGIN
  -- Set prefix based on user_type
  CASE NEW.user_type
    WHEN 'buyer' THEN prefix := 'BUY';
    WHEN 'seller' THEN prefix := 'SEL';
    WHEN 'agent' THEN prefix := 'AGT';
    WHEN 'admin' THEN prefix := 'ADM';
    ELSE prefix := 'USR';
  END CASE;
  
  -- Generate next ID
  SELECT COALESCE(
    MAX(SUBSTRING(custom_id FROM LENGTH(prefix) + 1)::INTEGER),
    0
  ) + 1 INTO next_id
  FROM users
  WHERE custom_id LIKE prefix || '%';
  
  -- Set custom_id
  NEW.custom_id := prefix || LPAD(next_id, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user custom ID
CREATE TRIGGER set_user_custom_id
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION generate_user_custom_id();

-- Function to generate custom ID for properties
CREATE OR REPLACE FUNCTION generate_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  prefix TEXT;
  next_id TEXT;
BEGIN
  -- Set prefix based on property_type
  CASE NEW.property_type
    WHEN 'apartment' THEN prefix := 'APT';
    WHEN 'house' THEN prefix := 'HSE';
    WHEN 'villa' THEN prefix := 'VIL';
    WHEN 'studio' THEN prefix := 'STD';
    WHEN 'penthouse' THEN prefix := 'PNT';
    WHEN 'townhouse' THEN prefix := 'TWN';
    ELSE prefix := 'PRP';
  END CASE;
  
  -- Generate next ID
  SELECT COALESCE(
    MAX(SUBSTRING(custom_id FROM LENGTH(prefix) + 1)::INTEGER),
    0
  ) + 1 INTO next_id
  FROM properties
  WHERE custom_id LIKE prefix || '%';
  
  -- Set custom_id
  NEW.custom_id := prefix || LPAD(next_id, 4, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for property custom ID
CREATE TRIGGER set_property_custom_id
BEFORE INSERT ON properties
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION generate_property_custom_id();

-- Function to send email verification
CREATE OR REPLACE FUNCTION send_email_verification(user_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- In a real implementation, this would send an actual email
  -- For now, we'll just mark the user as verified for demo purposes
  UPDATE users
  SET email_verified = true,
      email_verified_at = now()
  WHERE id = user_id_param;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- Function to verify email token
CREATE OR REPLACE FUNCTION verify_email_token(token_param TEXT)
RETURNS JSONB AS $$
BEGIN
  -- In a real implementation, this would verify a token
  -- For now, we'll just return success for demo purposes
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email verified successfully!'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Invalid or expired token'
    );
END;
$$ LANGUAGE plpgsql;

-- Function to verify agent bank account
CREATE OR REPLACE FUNCTION verify_agent_bank_account(agent_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_bank_details
  SET account_verified = true,
      account_verified_at = now()
  WHERE agent_id = agent_id::uuid;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- ==================== SAMPLE DATA ====================

-- Insert sample users
INSERT INTO users (email, first_name, last_name, user_type, status, verification_status, email_verified)
VALUES
  ('admin@homeandown.com', 'System', 'Administrator', 'admin', 'active', 'verified', true),
  ('seller@example.com', 'Property', 'Owner', 'seller', 'active', 'verified', true),
  ('agent@example.com', 'Real Estate', 'Agent', 'agent', 'active', 'verified', true),
  ('buyer@example.com', 'Test', 'User', 'buyer', 'active', 'verified', true);

-- Insert sample properties
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
  'Modern apartment with all amenities and fully furnished.',
  NULL, 25000, 'apartment', 2, 2, 1100, 'MVP Colony', 'Visakhapatnam', 'Andhra Pradesh', '530017',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Parking', 'Furnished'], 'active', true, true, 'RENT'
),
(
  'Spacious 3BHK House',
  'Large house with garden and modern amenities.',
  NULL, 35000, 'house', 3, 3, 1500, 'Gajuwaka', 'Visakhapatnam', 'Andhra Pradesh', '530026',
  17.6868, 83.2185, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
  ARRAY['Garden', 'Parking', 'Security'], 'active', false, true, 'RENT'
),
(
  'Modern Studio Apartment',
  'Compact and stylish studio apartment in the heart of the city.',
  NULL, 18000, 'studio', 1, 1, 600, 'Siripuram', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Security'], 'active', false, true, 'RENT'
);

-- Insert sample inquiries
INSERT INTO inquiries (property_id, user_id, name, email, phone, message, status, inquiry_type)
SELECT 
  p.id, 
  (SELECT id FROM users WHERE user_type = 'buyer' LIMIT 1),
  'John Doe',
  'john@example.com',
  '+91 9876543210',
  'I am interested in this property. Please contact me for more details.',
  'new',
  CASE WHEN p.listing_type = 'SALE' THEN 'purchase' ELSE 'rental' END
FROM properties p
LIMIT 3;

-- Insert sample bookings
INSERT INTO bookings (property_id, user_id, booking_date, booking_time, status, notes)
SELECT 
  p.id, 
  (SELECT id FROM users WHERE user_type = 'buyer' LIMIT 1),
  (CURRENT_DATE + INTERVAL '1 day'),
  '10:00:00',
  'pending',
  'I would like to visit this property tomorrow morning.'
FROM properties p
LIMIT 2;

-- Insert sample notifications
INSERT INTO notifications (title, message, type, entity_type, entity_id, user_id)
VALUES
  ('New User Registration', 'A new user has registered on the platform', 'user_registration', 'user', (SELECT id FROM users WHERE user_type = 'buyer' LIMIT 1), NULL),
  ('New Property Inquiry', 'Someone inquired about a property', 'inquiry', 'inquiry', (SELECT id FROM inquiries LIMIT 1), NULL);

-- ==================== ROW LEVEL SECURITY ====================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (auth.uid() = user_id);

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

-- Inquiries policies
CREATE POLICY "Users can view their own inquiries" ON inquiries
  FOR SELECT USING ((auth.uid() = user_id) OR (user_id IS NULL));

CREATE POLICY "Property owners can view inquiries for their properties" ON inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can create inquiries" ON inquiries
  FOR INSERT WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL));

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- Seller profiles policies
CREATE POLICY "Users can view their own seller profile" ON seller_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile" ON seller_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Agent profiles policies
CREATE POLICY "Users can view their own agent profile" ON agent_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own agent profile" ON agent_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Agent bank details policies
CREATE POLICY "Users can view their own bank details" ON agent_bank_details
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Users can update their own bank details" ON agent_bank_details
  FOR UPDATE USING (auth.uid() = agent_id);

-- Agent inquiry assignments policies
CREATE POLICY "Agents can view their own assignments" ON agent_inquiry_assignments
  FOR SELECT USING (auth.uid() = agent_id);

CREATE POLICY "Agents can update their own assignments" ON agent_inquiry_assignments
  FOR UPDATE USING (auth.uid() = agent_id);

-- Documents policies
CREATE POLICY "Users can view their own documents" ON documents
  FOR SELECT USING (auth.uid() = uploaded_by);

-- Earnings policies
CREATE POLICY "Agents can view their own earnings" ON earnings
  FOR SELECT USING (auth.uid() = agent_id);