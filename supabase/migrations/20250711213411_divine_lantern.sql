/*
  # Complete Database Setup

  1. New Tables
    - `users` - Stores user information
    - `properties` - Stores property listings
    - `bookings` - Stores property tour bookings
    - `inquiries` - Stores property inquiries
    - `notifications` - Stores system notifications
    - `agent_profiles` - Stores agent-specific information
    - `agent_inquiry_assignments` - Tracks inquiry assignments to agents
    - `agent_property_assignments` - Tracks property assignments to agents
    - `agent_performance_metrics` - Tracks agent performance
    - `seller_profiles` - Stores seller-specific information
    - `property_images` - Stores property images
    - `documents` - Stores user documents
    - `system_counters` - Manages custom ID generation

  2. Functions
    - Custom ID generation for users and properties
    - Notification creation for inquiries and bookings
    - Property image organization

  3. Security
    - Row Level Security policies for all tables
*/

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- SYSTEM COUNTERS TABLE (for custom IDs)
-- =============================================
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert initial counter values
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('user_counter', 0, 'USER'),
  ('property_counter', 0, 'PROP'),
  ('booking_counter', 0, 'BOOK'),
  ('inquiry_counter', 0, 'INQ')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  created_at timestamptz DEFAULT now()
);

-- Function to generate custom user ID
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val bigint;
  prefix text;
  user_prefix text;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Set prefix based on user_type
  CASE NEW.user_type
    WHEN 'buyer' THEN user_prefix := 'BUY';
    WHEN 'seller' THEN user_prefix := 'SEL';
    WHEN 'agent' THEN user_prefix := 'AGT';
    WHEN 'admin' THEN user_prefix := 'ADM';
    ELSE user_prefix := 'USR';
  END CASE;
  
  -- Update counter and get new value
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'user_counter'
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- Assign custom ID with format: USR-00001
  NEW.custom_id := user_prefix || '-' || LPAD(counter_val::text, 5, '0');
  
  -- For agents, also generate a license number if not provided
  IF NEW.user_type = 'agent' AND NEW.agent_license_number IS NULL THEN
    NEW.agent_license_number := 'REA-' || LPAD(counter_val::text, 6, '0');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for custom user ID
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- =============================================
-- PROPERTIES TABLE
-- =============================================
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
  owner_id uuid,
  status text DEFAULT 'active',
  featured boolean DEFAULT false,
  verified boolean DEFAULT false,
  listing_type text NOT NULL,
  available_from date,
  furnishing_status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  custom_id text UNIQUE,
  agent_id uuid,
  room_images jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for properties
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_custom_id ON properties(custom_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_room_images ON properties USING gin(room_images);

-- Function to generate custom property ID
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
DECLARE
  counter_val bigint;
  prefix text;
  prop_prefix text;
BEGIN
  -- Skip if custom_id is already set
  IF NEW.custom_id IS NOT NULL THEN
    RETURN NEW;
  END IF;
  
  -- Set prefix based on property_type
  CASE NEW.property_type
    WHEN 'apartment' THEN prop_prefix := 'APT';
    WHEN 'house' THEN prop_prefix := 'HSE';
    WHEN 'villa' THEN prop_prefix := 'VIL';
    WHEN 'studio' THEN prop_prefix := 'STD';
    WHEN 'penthouse' THEN prop_prefix := 'PNT';
    WHEN 'townhouse' THEN prop_prefix := 'TWN';
    ELSE prop_prefix := 'PRP';
  END CASE;
  
  -- Update counter and get new value
  UPDATE system_counters 
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'property_counter'
  RETURNING current_value, prefix INTO counter_val, prefix;
  
  -- Assign custom ID with format: PRP-00001
  NEW.custom_id := prop_prefix || '-' || LPAD(counter_val::text, 5, '0');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for custom property ID
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

-- =============================================
-- PROPERTY IMAGES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url text NOT NULL,
  room_type text NOT NULL,
  original_filename text,
  file_size bigint,
  file_type text,
  upload_date timestamptz DEFAULT now(),
  uploaded_by uuid,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);

-- Function to organize property images
CREATE OR REPLACE FUNCTION organize_property_images()
RETURNS TRIGGER AS $$
DECLARE
  room_images_json jsonb := '{}'::jsonb;
  room_type_rec RECORD;
BEGIN
  -- Group images by room type
  FOR room_type_rec IN 
    SELECT 
      pi.room_type, 
      json_agg(json_build_object(
        'id', pi.id,
        'url', pi.url,
        'is_primary', pi.is_primary,
        'sort_order', pi.sort_order
      )) AS images
    FROM property_images pi
    WHERE pi.property_id = COALESCE(NEW.property_id, OLD.property_id)
    GROUP BY pi.room_type
  LOOP
    room_images_json := room_images_json || jsonb_build_object(room_type_rec.room_type, room_type_rec.images);
  END LOOP;
  
  -- Update the property with the organized images
  UPDATE properties
  SET room_images = room_images_json,
      updated_at = now()
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update property room_images
CREATE TRIGGER update_property_room_images
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW
EXECUTE FUNCTION organize_property_images();

-- =============================================
-- BOOKINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL,
  agent_id uuid,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  notes text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- INQUIRIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'responded', 'closed')),
  inquiry_type text DEFAULT 'general' CHECK (inquiry_type IN ('purchase', 'rental', 'general')),
  location text,
  assigned_agent_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- =============================================
-- AGENT PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);

-- =============================================
-- SELLER PROFILES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
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

-- =============================================
-- AGENT INQUIRY ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  notes text
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_inquiry_assignments_inquiry_id_agent_id_key ON agent_inquiry_assignments(inquiry_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);

-- =============================================
-- AGENT PROPERTY ASSIGNMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_property_assignments_agent_id_property_id_key ON agent_property_assignments(agent_id, property_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

-- =============================================
-- AGENT PERFORMANCE METRICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
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
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS agent_performance_metrics_agent_id_month_year_key ON agent_performance_metrics(agent_id, month, year);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_month_year ON agent_performance_metrics(month, year);

-- =============================================
-- COMMISSIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id),
  booking_id uuid REFERENCES bookings(id),
  inquiry_id uuid REFERENCES inquiries(id),
  commission_type text NOT NULL CHECK (commission_type IN ('booking', 'sale', 'rental')),
  amount numeric NOT NULL DEFAULT 0,
  percentage numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- EARNINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  total_commission numeric NOT NULL DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS earnings_agent_id_month_year_key ON earnings(agent_id, month, year);

-- =============================================
-- DOCUMENTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint,
  uploaded_by uuid,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  document_category text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- =============================================
-- NOTIFICATIONS TABLE
-- =============================================
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

CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at);

-- =============================================
-- EMAIL VERIFICATION TOKENS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);

-- =============================================
-- NOTIFICATION QUEUE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  email_to text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);

-- =============================================
-- FUNCTIONS
-- =============================================

-- Function to create inquiry notification
CREATE OR REPLACE FUNCTION create_inquiry_notification()
RETURNS TRIGGER AS $$
BEGIN
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
  
  -- If status changed to responded, create notification for inquirer
  IF TG_OP = 'UPDATE' AND NEW.status = 'responded' AND OLD.status != 'responded' THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    )
    VALUES (
      'Inquiry Response',
      'Your inquiry has been responded to',
      'inquiry_response',
      'inquiry',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create booking notification
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for property owner
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  )
  SELECT
    'New Tour Request',
    'You have received a new tour request for ' || p.title,
    'booking',
    'booking',
    NEW.id
  FROM properties p
  WHERE p.id = NEW.property_id;
  
  -- If status changed, create notification for booker
  IF TG_OP = 'UPDATE' AND NEW.status != OLD.status THEN
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
      'booking_update',
      'booking',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update agent metrics on assignment change
CREATE OR REPLACE FUNCTION update_agent_metrics_on_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  current_month integer := EXTRACT(MONTH FROM CURRENT_DATE)::integer;
  current_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  metrics_id uuid;
  total_assignments integer;
  accepted_count integer;
  declined_count integer;
  expired_count integer;
  conversion numeric;
BEGIN
  -- Get counts for the agent
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'declined'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO 
    total_assignments,
    accepted_count,
    declined_count,
    expired_count
  FROM agent_inquiry_assignments
  WHERE agent_id = NEW.agent_id;
  
  -- Calculate conversion rate
  IF total_assignments > 0 THEN
    conversion := (accepted_count::numeric / total_assignments::numeric) * 100;
  ELSE
    conversion := 0;
  END IF;
  
  -- Update or insert metrics
  INSERT INTO agent_performance_metrics (
    agent_id,
    month,
    year,
    total_assignments,
    accepted_assignments,
    declined_assignments,
    expired_assignments,
    conversion_rate
  ) VALUES (
    NEW.agent_id,
    current_month,
    current_year,
    total_assignments,
    accepted_count,
    declined_count,
    expired_count,
    conversion
  )
  ON CONFLICT (agent_id, month, year) 
  DO UPDATE SET
    total_assignments = EXCLUDED.total_assignments,
    accepted_assignments = EXCLUDED.accepted_assignments,
    declined_assignments = EXCLUDED.declined_assignments,
    expired_assignments = EXCLUDED.expired_assignments,
    conversion_rate = EXCLUDED.conversion_rate,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TRIGGERS
-- =============================================

-- Trigger for inquiry notifications
CREATE TRIGGER inquiry_notification_trigger
AFTER INSERT OR UPDATE OF status ON inquiries
FOR EACH ROW
EXECUTE FUNCTION create_inquiry_notification();

-- =============================================
-- SAMPLE DATA
-- =============================================

-- Insert sample users
INSERT INTO users (first_name, last_name, email, phone_number, user_type, status, verification_status)
VALUES 
  ('Admin', 'User', 'admin@homeandown.com', '+91 9876543210', 'admin', 'active', 'verified'),
  ('John', 'Buyer', 'john@example.com', '+91 9876543211', 'buyer', 'active', 'verified'),
  ('Sarah', 'Seller', 'sarah@example.com', '+91 9876543212', 'seller', 'active', 'verified'),
  ('Raj', 'Agent', 'raj@example.com', '+91 9876543213', 'agent', 'active', 'verified'),
  ('Priya', 'Agent', 'priya@example.com', '+91 9876543214', 'agent', 'active', 'verified')
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for reference
DO $$
DECLARE
  admin_id uuid;
  buyer_id uuid;
  seller_id uuid;
  agent1_id uuid;
  agent2_id uuid;
BEGIN
  SELECT id INTO admin_id FROM users WHERE email = 'admin@homeandown.com';
  SELECT id INTO buyer_id FROM users WHERE email = 'john@example.com';
  SELECT id INTO seller_id FROM users WHERE email = 'sarah@example.com';
  SELECT id INTO agent1_id FROM users WHERE email = 'raj@example.com';
  SELECT id INTO agent2_id FROM users WHERE email = 'priya@example.com';

  -- Insert sample properties
  INSERT INTO properties (
    title, description, price, monthly_rent, property_type, 
    bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
    latitude, longitude, images, amenities, status, featured, verified, listing_type,
    owner_id, agent_id
  ) 
  VALUES 
    (
      'Luxury Villa with Garden',
      'Beautiful villa with spacious garden and modern amenities.',
      8500000, NULL, 'villa', 4, 3, 2500, 'Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530002',
      17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
      ARRAY['Garden', 'Swimming Pool', 'Gym'], 'active', true, true, 'SALE',
      seller_id, agent1_id
    ),
    (
      'Modern 2BHK Apartment',
      'Contemporary flat with all modern amenities in a great location.',
      3500000, NULL, 'apartment', 2, 2, 950, 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', '530016',
      17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
      ARRAY['Power Backup', 'Lift', 'Parking'], 'active', true, true, 'SALE',
      seller_id, agent2_id
    ),
    (
      'Fully Furnished 2BHK Apartment',
      'Fully furnished apartment with modern amenities in a prime location.',
      NULL, 25000, 'apartment', 2, 2, 1100, 'MVP Colony', 'Visakhapatnam', 'Andhra Pradesh', '530017',
      17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
      ARRAY['Power Backup', 'Lift', 'Parking', 'Furnished'], 'active', true, true, 'RENT',
      seller_id, agent1_id
    );

  -- Insert sample inquiries
  INSERT INTO inquiries (
    property_id, user_id, name, email, phone, message, status, inquiry_type
  )
  SELECT
    p.id, buyer_id, 'John Buyer', 'john@example.com', '+91 9876543211',
    'I am interested in this property. Please contact me for more details.',
    'new', 'purchase'
  FROM properties p
  WHERE p.title = 'Luxury Villa with Garden'
  LIMIT 1;

  -- Insert sample bookings
  INSERT INTO bookings (
    property_id, user_id, agent_id, booking_date, booking_time, status, notes
  )
  SELECT
    p.id, buyer_id, agent1_id,
    (CURRENT_DATE + interval '2 days')::date,
    '10:00:00'::time,
    'pending',
    'I would like to see the property in the morning.'
  FROM properties p
  WHERE p.title = 'Modern 2BHK Apartment'
  LIMIT 1;

  -- Insert sample agent profiles
  INSERT INTO agent_profiles (
    user_id, license_number, experience_years, specialization, bio
  )
  VALUES
    (
      agent1_id,
      (SELECT agent_license_number FROM users WHERE id = agent1_id),
      5,
      'Residential',
      'Experienced agent specializing in residential properties.'
    ),
    (
      agent2_id,
      (SELECT agent_license_number FROM users WHERE id = agent2_id),
      3,
      'Commercial',
      'Specializing in commercial properties with excellent customer service.'
    )
  ON CONFLICT (user_id) DO NOTHING;

  -- Insert sample notifications
  INSERT INTO notifications (
    title, message, type, entity_type, entity_id, read, created_at
  )
  VALUES
    (
      'New User Registration',
      'A new user has registered on the platform',
      'user_registration',
      'user',
      buyer_id,
      false,
      now() - interval '2 days'
    ),
    (
      'New Property Inquiry',
      'You have received a new inquiry for Luxury Villa with Garden',
      'inquiry',
      'inquiry',
      (SELECT id FROM inquiries LIMIT 1),
      false,
      now() - interval '1 day'
    ),
    (
      'New Tour Request',
      'You have received a new tour request for Modern 2BHK Apartment',
      'booking',
      'booking',
      (SELECT id FROM bookings LIMIT 1),
      false,
      now() - interval '12 hours'
    );

END $$;

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Properties policies
CREATE POLICY "Authenticated users can view properties" 
  ON properties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Property owners can manage their properties" 
  ON properties FOR ALL TO authenticated 
  USING (owner_id = auth.uid()) 
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Public can view active properties" 
  ON properties FOR SELECT TO public 
  USING (status = 'active');

-- Inquiries policies
CREATE POLICY "Anyone can create inquiries" 
  ON inquiries FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries" 
  ON inquiries FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Property owners can view inquiries for their properties" 
  ON inquiries FOR SELECT TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = inquiries.property_id 
    AND properties.owner_id = auth.uid()
  ));

-- Agent assignment policies
CREATE POLICY "System can create agent assignments" 
  ON agent_inquiry_assignments FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "Agents can view their assignments" 
  ON agent_inquiry_assignments FOR SELECT TO authenticated 
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can update their assignments" 
  ON agent_inquiry_assignments FOR UPDATE TO authenticated 
  USING (agent_id = auth.uid());

CREATE POLICY "Admin can manage all assignments" 
  ON agent_inquiry_assignments FOR ALL TO authenticated 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.user_type = 'admin'
  ));

-- Agent profiles policies
CREATE POLICY "Agents can view their own profiles" 
  ON agent_profiles FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Agents can update their own profiles" 
  ON agent_profiles FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

-- Seller profiles policies
CREATE POLICY "Users can create their own seller profile" 
  ON seller_profiles FOR INSERT TO public 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile" 
  ON seller_profiles FOR UPDATE TO public 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own seller profile" 
  ON seller_profiles FOR SELECT TO public 
  USING (auth.uid() = user_id);

-- Commissions policies
CREATE POLICY "Agents can view their own commissions" 
  ON commissions FOR SELECT TO authenticated 
  USING (agent_id = auth.uid());

-- Documents policies
CREATE POLICY "Users can view their own documents" 
  ON documents FOR SELECT TO authenticated 
  USING (uploaded_by = auth.uid());

-- Email verification tokens policies
CREATE POLICY "Users can create their own verification tokens" 
  ON email_verification_tokens FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "email_verification_tokens_select_policy" 
  ON email_verification_tokens FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Notifications policies
CREATE POLICY "Allow system to create notifications" 
  ON notifications FOR INSERT TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "System can insert notifications" 
  ON notifications FOR INSERT TO authenticated 
  WITH CHECK (true);