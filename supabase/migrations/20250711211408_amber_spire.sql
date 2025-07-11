/*
  # Complete Database Setup

  1. System Tables
    - `system_counters` - For generating sequential IDs
  
  2. User Tables
    - `users` - Main users table
    - `agent_profiles` - Additional info for agent users
    - `seller_profiles` - Additional info for seller users
  
  3. Property Tables
    - `properties` - Main properties table
    - `property_images` - Images for properties
  
  4. Transaction Tables
    - `inquiries` - Property inquiries
    - `bookings` - Property tour bookings
    - `agent_inquiry_assignments` - Assignments of inquiries to agents
  
  5. Support Tables
    - `notifications` - System notifications
    - `documents` - Document storage
    - `commissions` - Agent commissions
    - `earnings` - Agent earnings
*/

-- ============================================================================
-- 1. SYSTEM TABLES
-- ============================================================================

-- Create system_counters table for sequential IDs
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Initialize counters for different entity types
INSERT INTO system_counters (id, current_value, prefix)
VALUES
  ('buyer_id', 0, 'BUYER'),
  ('seller_id', 0, 'SELLER'),
  ('agent_id', 0, 'AGENT'),
  ('admin_id', 0, 'ADMIN'),
  ('property_id', 0, 'PROP'),
  ('license_number', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on system_counters
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read counters
CREATE POLICY "Anyone can read counters"
  ON system_counters
  FOR SELECT
  TO public
  USING (true);

-- Create policy to allow service role to update counters
CREATE POLICY "Service role can update counters"
  ON system_counters
  FOR UPDATE
  TO service_role
  USING (true);

-- ============================================================================
-- 2. USER TABLES
-- ============================================================================

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  user_type text NOT NULL,
  status text DEFAULT 'active',
  verification_status text DEFAULT 'pending',
  custom_id text UNIQUE,
  agent_license_number text,
  city text,
  state text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  working_hours jsonb DEFAULT '{"start": "09:00", "end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]}'::jsonb,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "in_app": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  education_background text
);

-- Create seller_profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name text NOT NULL,
  business_type text NOT NULL,
  experience_years integer NOT NULL,
  license_number text,
  pan_number text NOT NULL,
  gst_number text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  bank_account text NOT NULL,
  ifsc_code text NOT NULL,
  documents jsonb DEFAULT '{}'::jsonb,
  verification_status text DEFAULT 'pending',
  verification_reason text,
  verified_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- 3. PROPERTY TABLES
-- ============================================================================

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
  updated_at timestamptz DEFAULT now(),
  custom_id text UNIQUE,
  agent_id uuid REFERENCES users(id),
  room_images jsonb DEFAULT '{}'::jsonb
);

-- Create property_images table
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  room_type text NOT NULL,
  original_filename text,
  file_size bigint,
  file_type text,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid REFERENCES users(id),
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

-- ============================================================================
-- 4. TRANSACTION TABLES
-- ============================================================================

-- Create inquiries table
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  inquiry_type text DEFAULT 'general',
  location text,
  assigned_agent_id uuid REFERENCES users(id)
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL REFERENCES users(id),
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES users(id)
);

-- Create agent_inquiry_assignments table
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  notes text
);

-- Create agent_property_assignments table
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, property_id)
);

-- ============================================================================
-- 5. SUPPORT TABLES
-- ============================================================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES users(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  booking_id uuid REFERENCES bookings(id),
  inquiry_id uuid REFERENCES inquiries(id),
  commission_type text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (commission_type IN ('booking', 'sale', 'rental')),
  CHECK (status IN ('pending', 'approved', 'paid'))
);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  month integer NOT NULL,
  year integer NOT NULL,
  total_commission numeric NOT NULL DEFAULT 0,
  total_bookings integer NOT NULL DEFAULT 0,
  total_sales integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

-- Create agent_performance_metrics table
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  month integer NOT NULL,
  year integer NOT NULL,
  total_assignments integer DEFAULT 0,
  accepted_assignments integer DEFAULT 0,
  declined_assignments integer DEFAULT 0,
  expired_assignments integer DEFAULT 0,
  conversion_rate numeric DEFAULT 0,
  response_time_minutes numeric DEFAULT 0,
  customer_rating numeric DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

-- ============================================================================
-- 6. TRIGGER FUNCTIONS
-- ============================================================================

-- Function to generate custom_id for users
CREATE OR REPLACE FUNCTION generate_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_id TEXT;
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Determine which counter to use based on user_type
  IF NEW.user_type = 'buyer' THEN
    counter_id := 'buyer_id';
  ELSIF NEW.user_type = 'seller' THEN
    counter_id := 'seller_id';
  ELSIF NEW.user_type = 'agent' THEN
    counter_id := 'agent_id';
  ELSIF NEW.user_type = 'admin' THEN
    counter_id := 'admin_id';
  ELSE
    counter_id := 'buyer_id'; -- Default
  END IF;
  
  -- Get and increment the counter
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- Format the custom_id
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  -- For agents, also generate a license number if not provided
  IF NEW.user_type = 'agent' AND (NEW.agent_license_number IS NULL OR NEW.agent_license_number = '') THEN
    -- Get and increment the license counter
    UPDATE system_counters 
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'license_number'
    RETURNING current_value INTO counter_val;
    
    -- Format the license number
    NEW.agent_license_number := 'LICENSE' || LPAD(counter_val::TEXT, 3, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to generate custom_id for properties
CREATE OR REPLACE FUNCTION generate_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val BIGINT;
  prefix TEXT;
BEGIN
  -- Get and increment the counter
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'property_id'
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- Format the custom_id
  NEW.custom_id := prefix || LPAD(counter_val::TEXT, 3, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to organize property images
CREATE OR REPLACE FUNCTION organize_property_images()
RETURNS TRIGGER AS $$
DECLARE
  property_id uuid;
  room_images jsonb;
BEGIN
  -- Determine the property_id based on the operation
  IF TG_OP = 'DELETE' THEN
    property_id := OLD.property_id;
  ELSE
    property_id := NEW.property_id;
  END IF;
  
  -- Get all images for this property grouped by room_type
  WITH room_type_images AS (
    SELECT 
      room_type,
      jsonb_agg(
        jsonb_build_object(
          'id', id,
          'url', url,
          'is_primary', is_primary,
          'sort_order', sort_order
        ) ORDER BY sort_order, upload_date
      ) AS images
    FROM property_images
    WHERE property_id = property_id
    GROUP BY room_type
  )
  SELECT 
    jsonb_object_agg(room_type, images) INTO room_images
  FROM room_type_images;
  
  -- Update the property with the organized images
  UPDATE properties
  SET room_images = COALESCE(room_images, '{}'::jsonb),
      updated_at = now()
  WHERE id = property_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for inquiries
CREATE OR REPLACE FUNCTION create_inquiry_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For new inquiries
  IF (TG_OP = 'INSERT') THEN
    -- Create notification for property owner
    INSERT INTO notifications (
      title, 
      message, 
      type, 
      entity_type, 
      entity_id
    )
    SELECT 
      'New Property Inquiry',
      'You have received a new inquiry for ' || p.title,
      'inquiry',
      'inquiry',
      NEW.id
    FROM properties p
    WHERE p.id = NEW.property_id;
    
  -- For status updates
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    -- Create notification for the inquirer
    INSERT INTO notifications (
      title, 
      message, 
      type, 
      entity_type, 
      entity_id
    )
    VALUES (
      'Inquiry Status Updated',
      'Your inquiry status has been updated to ' || NEW.status,
      'inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create notifications for bookings
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- For new bookings
  IF (TG_OP = 'INSERT') THEN
    -- Create notification for property owner
    INSERT INTO notifications (
      title, 
      message, 
      type, 
      entity_type, 
      entity_id
    )
    SELECT 
      'New Property Tour Request',
      'You have received a new tour request for ' || p.title,
      'booking',
      'booking',
      NEW.id
    FROM properties p
    WHERE p.id = NEW.property_id;
    
  -- For status updates
  ELSIF (TG_OP = 'UPDATE' AND OLD.status != NEW.status) THEN
    -- Create notification for the booker
    INSERT INTO notifications (
      title, 
      message, 
      type, 
      entity_type, 
      entity_id
    )
    VALUES (
      'Booking Status Updated',
      'Your booking status has been updated to ' || NEW.status,
      'booking',
      'booking',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Trigger for user custom_id generation
DROP TRIGGER IF EXISTS generate_user_custom_id ON users;
CREATE TRIGGER generate_user_custom_id
BEFORE INSERT ON users
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION generate_custom_id();

-- Trigger for property custom_id generation
DROP TRIGGER IF EXISTS generate_property_custom_id ON properties;
CREATE TRIGGER generate_property_custom_id
BEFORE INSERT ON properties
FOR EACH ROW
WHEN (NEW.custom_id IS NULL)
EXECUTE FUNCTION generate_property_custom_id();

-- Trigger for property image organization
DROP TRIGGER IF EXISTS update_property_room_images ON property_images;
CREATE TRIGGER update_property_room_images
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW
EXECUTE FUNCTION organize_property_images();

-- Trigger for inquiry notifications
DROP TRIGGER IF EXISTS inquiry_notification_trigger ON inquiries;
CREATE TRIGGER inquiry_notification_trigger
AFTER INSERT OR UPDATE OF status ON inquiries
FOR EACH ROW
EXECUTE FUNCTION create_inquiry_notification();

-- Trigger for booking notifications
DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
CREATE TRIGGER booking_notification_trigger
AFTER INSERT OR UPDATE OF status ON bookings
FOR EACH ROW
EXECUTE FUNCTION create_booking_notification();

-- ============================================================================
-- 8. SAMPLE DATA
-- ============================================================================

-- Insert sample users
INSERT INTO users (first_name, last_name, email, phone_number, user_type, status, verification_status)
VALUES
  ('Admin', 'User', 'admin@homeandown.com', '+91 9876543210', 'admin', 'active', 'verified'),
  ('John', 'Buyer', 'john@example.com', '+91 9876543211', 'buyer', 'active', 'verified'),
  ('Jane', 'Seller', 'jane@example.com', '+91 9876543212', 'seller', 'active', 'verified'),
  ('Vikram', 'Singh', 'vikram@example.com', '+91 9876543213', 'agent', 'active', 'verified'),
  ('Meera', 'Reddy', 'meera@example.com', '+91 9876543214', 'agent', 'active', 'verified')
ON CONFLICT (email) DO NOTHING;

-- Insert sample properties
INSERT INTO properties (
  title, description, price, monthly_rent, property_type, 
  bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
  latitude, longitude, images, amenities, status, featured, verified, listing_type
)
VALUES 
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
  ARRAY['Garden', 'Parking', 'Security'], 'active', true, true, 'RENT'
),
(
  'Modern Studio Apartment',
  'Compact and stylish studio apartment in the heart of the city.',
  NULL, 18000, 'studio', 1, 1, 600, 'Siripuram', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Security'], 'active', true, true, 'RENT'
)
ON CONFLICT DO NOTHING;

-- Insert sample inquiries
INSERT INTO inquiries (property_id, user_id, name, email, phone, message, status, inquiry_type)
SELECT 
  p.id, 
  u.id, 
  u.first_name || ' ' || u.last_name, 
  u.email, 
  u.phone_number, 
  'I am interested in this property. Please contact me for more details.',
  'new',
  CASE WHEN p.listing_type = 'SALE' THEN 'purchase' ELSE 'rental' END
FROM properties p
CROSS JOIN users u
WHERE u.user_type = 'buyer'
LIMIT 5
ON CONFLICT DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (property_id, user_id, booking_date, booking_time, status, notes)
SELECT 
  p.id, 
  u.id, 
  (CURRENT_DATE + (RANDOM() * 10)::INTEGER),
  '10:00:00'::TIME,
  'pending',
  'I would like to visit this property. Please confirm the appointment.'
FROM properties p
CROSS JOIN users u
WHERE u.user_type = 'buyer'
LIMIT 3
ON CONFLICT DO NOTHING;

-- Insert sample agent assignments
INSERT INTO agent_inquiry_assignments (inquiry_id, agent_id, status, assigned_at, expires_at)
SELECT 
  i.id,
  u.id,
  'pending',
  now(),
  now() + interval '24 hours'
FROM inquiries i
CROSS JOIN users u
WHERE u.user_type = 'agent'
LIMIT 2
ON CONFLICT DO NOTHING;

-- Insert sample notifications
INSERT INTO notifications (title, message, type, entity_type, entity_id, read)
VALUES
  ('New User Registration', 'A new user has registered on the platform', 'user_registration', 'user', NULL, false),
  ('New Property Inquiry', 'Someone inquired about a property', 'inquiry', 'inquiry', NULL, false),
  ('New Tour Request', 'A user has requested a property tour', 'booking', 'booking', NULL, false)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 9. ENABLE RLS
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies
CREATE POLICY "Authenticated users can view properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Property owners can manage their properties"
  ON properties
  FOR ALL
  TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Public can view active properties"
  ON properties
  FOR SELECT
  TO public
  USING (status = 'active');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_custom_id ON properties(custom_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_room_images ON properties USING gin (room_images);

CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);

CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_month_year ON agent_performance_metrics(month, year);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at);