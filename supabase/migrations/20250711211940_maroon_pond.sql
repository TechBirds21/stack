/*
  # Complete Database Setup

  1. System Tables
    - `system_counters` - For generating sequential IDs
  
  2. User Tables
    - `users` - Core user information
    - `agent_profiles` - Additional agent information
    - `seller_profiles` - Additional seller information
  
  3. Property Tables
    - `properties` - Property listings
    - `property_images` - Property images with room types
  
  4. Transaction Tables
    - `inquiries` - Property inquiries
    - `bookings` - Property tour bookings
    - `agent_inquiry_assignments` - Inquiry assignments to agents
    - `agent_property_assignments` - Property assignments to agents
  
  5. Performance & Metrics
    - `agent_performance_metrics` - Agent performance tracking
    - `earnings` - Agent earnings records
    - `commissions` - Commission records
  
  6. Notifications & Documents
    - `notifications` - System notifications
    - `documents` - Document storage
    - `notification_queue` - Email notification queue
    - `email_verification_tokens` - Email verification
*/

-- ============================================================================
-- 1. SYSTEM TABLES
-- ============================================================================

-- System counters for sequential IDs
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Initialize counters if they don't exist
INSERT INTO system_counters (id, current_value, prefix)
VALUES 
  ('buyer_id', 0, 'BUYER'),
  ('seller_id', 0, 'SELLER'),
  ('agent_id', 0, 'AGENT'),
  ('admin_id', 0, 'ADMIN'),
  ('property_id', 0, 'PROP'),
  ('license_number', 0, 'LICENSE')
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create policy for system_counters
CREATE POLICY "Only authenticated users can access counters"
  ON system_counters
  FOR ALL
  TO authenticated
  USING (true);

-- ============================================================================
-- 2. USER TABLES
-- ============================================================================

-- Core users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone_number text,
  user_type text NOT NULL,
  custom_id text UNIQUE,
  agent_license_number text,
  city text,
  state text,
  status text DEFAULT 'active',
  verification_status text DEFAULT 'pending',
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Agent profiles
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

-- Seller profiles
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

-- ============================================================================
-- 3. PROPERTY TABLES
-- ============================================================================

-- Properties table
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

-- Property images with room types
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

-- ============================================================================
-- 4. TRANSACTION TABLES
-- ============================================================================

-- Inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  status text DEFAULT 'new',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  inquiry_type text DEFAULT 'general',
  location text,
  assigned_agent_id uuid
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL,
  agent_id uuid,
  booking_date date NOT NULL,
  booking_time time NOT NULL,
  notes text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Agent inquiry assignments
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  notes text,
  UNIQUE(inquiry_id, agent_id),
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Agent property assignments
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, property_id),
  CHECK (status IN ('active', 'inactive', 'completed'))
);

-- ============================================================================
-- 5. PERFORMANCE & METRICS
-- ============================================================================

-- Agent performance metrics
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
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

-- Earnings
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
  month integer NOT NULL,
  year integer NOT NULL,
  total_commission numeric NOT NULL DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

-- Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL,
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

-- Enable RLS on commissions
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Create policy for commissions
CREATE POLICY "Agents can view their own commissions"
  ON commissions
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- ============================================================================
-- 6. NOTIFICATIONS & DOCUMENTS
-- ============================================================================

-- Notifications
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

-- Documents
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

-- Email verification tokens
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Notification queue
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  email_to text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  CHECK (status IN ('pending', 'sent', 'failed'))
);

-- ============================================================================
-- 7. TRIGGER FUNCTIONS
-- ============================================================================

-- Function to generate custom IDs for users
CREATE OR REPLACE FUNCTION generate_custom_id(user_type text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  counter_id text;
  new_value bigint;
  prefix text;
BEGIN
  -- Determine counter ID based on user type
  CASE user_type
    WHEN 'buyer' THEN counter_id := 'buyer_id';
    WHEN 'seller' THEN counter_id := 'seller_id';
    WHEN 'agent' THEN counter_id := 'agent_id';
    WHEN 'admin' THEN counter_id := 'admin_id';
    ELSE counter_id := 'buyer_id'; -- Default
  END CASE;

  -- Get prefix and increment counter
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = counter_id
  RETURNING current_value, prefix INTO new_value, prefix;

  -- Format and return custom ID
  RETURN prefix || LPAD(new_value::text, 3, '0');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in generate_custom_id: %', SQLERRM;
    RETURN user_type || '_' || gen_random_uuid();
END;
$$;

-- Function to generate license numbers for agents
CREATE OR REPLACE FUNCTION generate_license_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_value bigint;
  prefix text;
BEGIN
  -- Increment counter and get new value
  UPDATE system_counters
  SET current_value = current_value + 1,
      updated_at = now()
  WHERE id = 'license_number'
  RETURNING current_value, prefix INTO new_value, prefix;

  -- Format and return license number
  RETURN prefix || LPAD(new_value::text, 3, '0');
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in generate_license_number: %', SQLERRM;
    RETURN 'LICENSE_' || gen_random_uuid();
END;
$$;

-- Function to assign custom ID to users
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only assign if custom_id is NULL
  IF NEW.custom_id IS NULL THEN
    NEW.custom_id := generate_custom_id(NEW.user_type);
  END IF;
  
  -- Assign license number for agents if not already set
  IF NEW.user_type = 'agent' AND NEW.agent_license_number IS NULL THEN
    NEW.agent_license_number := generate_license_number();
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in assign_user_custom_id: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to assign custom ID to properties
CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  new_value bigint;
  prefix text;
BEGIN
  -- Only assign if custom_id is NULL
  IF NEW.custom_id IS NULL THEN
    -- Increment counter and get new value
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'property_id'
    RETURNING current_value, prefix INTO new_value, prefix;
    
    -- Assign custom ID
    NEW.custom_id := prefix || LPAD(new_value::text, 3, '0');
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in assign_property_custom_id: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to create inquiry notifications
CREATE OR REPLACE FUNCTION create_inquiry_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  property_title text;
  owner_id uuid;
BEGIN
  -- Get property information
  SELECT title, owner_id INTO property_title, owner_id
  FROM properties
  WHERE id = NEW.property_id;
  
  -- Create notification for property owner
  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'New Property Inquiry',
      'You have a new inquiry for ' || property_title,
      'inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  -- If status changed to 'responded', create notification for inquirer
  IF TG_OP = 'UPDATE' AND OLD.status != 'responded' AND NEW.status = 'responded' THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'Inquiry Response',
      'Your inquiry about ' || property_title || ' has been responded to',
      'inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in create_inquiry_notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to create booking notifications
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  property_title text;
  owner_id uuid;
  user_name text;
BEGIN
  -- Get property information
  SELECT p.title, p.owner_id, u.first_name || ' ' || u.last_name
  INTO property_title, owner_id, user_name
  FROM properties p
  LEFT JOIN users u ON u.id = NEW.user_id
  WHERE p.id = NEW.property_id;
  
  -- Create notification for property owner
  IF owner_id IS NOT NULL THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'New Tour Request',
      user_name || ' has requested a tour for ' || property_title,
      'booking',
      'booking',
      NEW.id
    );
  END IF;
  
  -- If status changed, create notification for user
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'Tour Request ' || INITCAP(NEW.status),
      'Your tour request for ' || property_title || ' has been ' || NEW.status,
      'booking',
      'booking',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in create_booking_notification: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Function to organize property images
CREATE OR REPLACE FUNCTION organize_property_images()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  room_images jsonb;
  property_record record;
BEGIN
  -- Get current room_images
  SELECT * INTO property_record FROM properties WHERE id = NEW.property_id;
  room_images := COALESCE(property_record.room_images, '{}'::jsonb);
  
  -- Handle INSERT or UPDATE
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    -- Add or update image in room_images
    IF room_images ? NEW.room_type THEN
      -- Room type exists, append to array
      room_images := jsonb_set(
        room_images,
        ARRAY[NEW.room_type],
        (room_images->NEW.room_type) || to_jsonb(NEW.url)
      );
    ELSE
      -- Room type doesn't exist, create new array
      room_images := jsonb_set(
        room_images,
        ARRAY[NEW.room_type],
        jsonb_build_array(NEW.url)
      );
    END IF;
  END IF;
  
  -- Handle DELETE
  IF (TG_OP = 'DELETE') THEN
    -- Remove image from room_images
    IF room_images ? OLD.room_type THEN
      -- Create a new array without the deleted URL
      room_images := jsonb_set(
        room_images,
        ARRAY[OLD.room_type],
        (SELECT jsonb_agg(x) FROM jsonb_array_elements(room_images->OLD.room_type) AS x WHERE x::text != to_jsonb(OLD.url)::text)
      );
      
      -- If array is empty or null, remove the room type
      IF room_images->OLD.room_type IS NULL OR jsonb_array_length(room_images->OLD.room_type) = 0 THEN
        room_images := room_images - OLD.room_type;
      END IF;
    END IF;
  END IF;
  
  -- Update the properties table
  UPDATE properties
  SET room_images = room_images
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN NULL;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in organize_property_images: %', SQLERRM;
    RETURN NULL;
END;
$$;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger for user custom ID
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
CREATE TRIGGER user_custom_id_trigger
BEFORE INSERT ON users
FOR EACH ROW
EXECUTE FUNCTION assign_user_custom_id();

-- Trigger for property custom ID
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;
CREATE TRIGGER property_custom_id_trigger
BEFORE INSERT ON properties
FOR EACH ROW
EXECUTE FUNCTION assign_property_custom_id();

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

-- Trigger for property images organization
DROP TRIGGER IF EXISTS update_property_room_images ON property_images;
CREATE TRIGGER update_property_room_images
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW
EXECUTE FUNCTION organize_property_images();

-- ============================================================================
-- 9. SAMPLE DATA
-- ============================================================================

-- Sample users
INSERT INTO users (first_name, last_name, email, phone_number, user_type, status, verification_status)
VALUES 
  ('Admin', 'User', 'admin@example.com', '+91 9876543210', 'admin', 'active', 'verified'),
  ('John', 'Buyer', 'john@example.com', '+91 9876543211', 'buyer', 'active', 'verified'),
  ('Jane', 'Seller', 'jane@example.com', '+91 9876543212', 'seller', 'active', 'verified'),
  ('Alex', 'Agent', 'alex@example.com', '+91 9876543213', 'agent', 'active', 'verified')
ON CONFLICT (email) DO NOTHING;

-- Sample properties
INSERT INTO properties (
  title, description, price, monthly_rent, property_type, 
  bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
  latitude, longitude, images, amenities, status, featured, verified, listing_type
) 
VALUES 
(
  'Luxury Villa with Garden',
  'Beautiful villa with spacious garden and modern amenities.',
  8500000, NULL, 'villa', 4, 3, 2500, 'Beach Road', 'Visakhapatnam', 'Andhra Pradesh', '530002',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
  ARRAY['Garden', 'Swimming Pool', 'Gym'], 'active', true, true, 'SALE'
),
(
  'Modern 2BHK Apartment',
  'Contemporary flat with all modern amenities in a great location.',
  3500000, NULL, 'apartment', 2, 2, 950, 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', '530016',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Parking'], 'active', true, true, 'SALE'
),
(
  'Fully Furnished 2BHK Apartment',
  'Fully furnished apartment with modern amenities in a prime location.',
  NULL, 25000, 'apartment', 2, 2, 1100, 'MVP Colony', 'Visakhapatnam', 'Andhra Pradesh', '530017',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Parking', 'Furnished'], 'active', true, true, 'RENT'
)
ON CONFLICT DO NOTHING;

-- Sample inquiries
INSERT INTO inquiries (
  property_id, name, email, phone, message, status, inquiry_type
)
SELECT 
  p.id, 'John Doe', 'john@example.com', '+91 9876543210', 
  'I am interested in this property. Please contact me.', 'new', 'general'
FROM properties p
WHERE p.title = 'Luxury Villa with Garden'
ON CONFLICT DO NOTHING;

-- Sample bookings
INSERT INTO bookings (
  property_id, user_id, booking_date, booking_time, notes, status
)
SELECT 
  p.id, u.id, 
  (CURRENT_DATE + interval '1 day')::date, 
  '10:00:00'::time, 
  'I would like to see the property in the morning.', 
  'pending'
FROM properties p, users u
WHERE p.title = 'Modern 2BHK Apartment' AND u.email = 'john@example.com'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 10. INDEXES
-- ============================================================================

-- Property indexes
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_custom_id ON properties(custom_id);
CREATE INDEX IF NOT EXISTS idx_properties_room_images ON properties USING gin(room_images);

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_verification_status ON users(verification_status);

-- Inquiry indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);

-- Booking indexes
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Agent assignment indexes
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);

-- Property image indexes
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);

-- Document indexes
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);

-- ============================================================================
-- 11. RLS POLICIES
-- ============================================================================

-- Enable RLS on tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Property policies
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

-- Inquiry policies
CREATE POLICY "Anyone can create inquiries"
  ON inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = inquiries.property_id
    AND properties.owner_id = auth.uid()
  ));

-- Agent assignment policies
CREATE POLICY "System can create agent assignments"
  ON agent_inquiry_assignments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "agent_assignments_select_policy"
  ON agent_inquiry_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "agent_assignments_update_policy"
  ON agent_inquiry_assignments
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "admin_assignments_all_policy"
  ON agent_inquiry_assignments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.user_type = 'admin'
  ));

-- Agent profile policies
CREATE POLICY "Agents can view their own profiles"
  ON agent_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Agents can update their own profiles"
  ON agent_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Seller profile policies
CREATE POLICY "Users can create their own seller profile"
  ON seller_profiles
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile"
  ON seller_profiles
  FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own seller profile"
  ON seller_profiles
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

-- Property image policies
CREATE POLICY "Users can view property images"
  ON property_images
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Property owners can manage their property images"
  ON property_images
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Agents can manage assigned property images"
  ON property_images
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties
    WHERE properties.id = property_images.property_id
    AND properties.agent_id = auth.uid()
  ));

-- Document policies
CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Email verification policies
CREATE POLICY "email_verification_tokens_select_policy"
  ON email_verification_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own verification tokens"
  ON email_verification_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Earnings policies
CREATE POLICY "Agents can view their own earnings"
  ON earnings
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Agent metrics policies
CREATE POLICY "Agents can view their own metrics"
  ON agent_performance_metrics
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- ============================================================================
-- 12. FUNCTIONS FOR VERIFICATION
-- ============================================================================

-- Function to send email verification
CREATE OR REPLACE FUNCTION send_email_verification(user_id_param uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_email text;
  user_record record;
  token_value text;
  result json;
BEGIN
  -- Get user email
  SELECT * INTO user_record FROM users WHERE id = user_id_param;
  
  IF user_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'User not found');
  END IF;
  
  user_email := user_record.email;
  
  -- Generate token
  token_value := encode(gen_random_bytes(32), 'hex');
  
  -- Store token
  INSERT INTO email_verification_tokens (
    user_id, token, expires_at
  ) VALUES (
    user_id_param,
    token_value,
    now() + interval '24 hours'
  );
  
  -- In a real implementation, this would send an email
  -- For now, we'll just return the token
  result := json_build_object(
    'success', true,
    'message', 'Verification email sent',
    'token', token_value,
    'verify_url', 'https://example.com/verify-email?token=' || token_value
  );
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Function to verify email token
CREATE OR REPLACE FUNCTION verify_email_token(token_param text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  token_record record;
  result json;
BEGIN
  -- Get token
  SELECT * INTO token_record FROM email_verification_tokens
  WHERE token = token_param AND verified_at IS NULL;
  
  IF token_record IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid or expired token');
  END IF;
  
  IF token_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'message', 'Token has expired');
  END IF;
  
  -- Mark token as verified
  UPDATE email_verification_tokens
  SET verified_at = now()
  WHERE id = token_record.id;
  
  -- Update user
  UPDATE users
  SET email_verified = true,
      email_verified_at = now()
  WHERE id = token_record.user_id;
  
  RETURN json_build_object('success', true, 'message', 'Email verified successfully');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'message', SQLERRM);
END;
$$;

-- Function to verify agent bank account
CREATE OR REPLACE FUNCTION verify_agent_bank_account(agent_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- In a real implementation, this would verify with a bank API
  -- For now, we'll just mark it as verified
  
  UPDATE agent_bank_details
  SET account_verified = true,
      account_verified_at = now()
  WHERE agent_id = agent_id::uuid;
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- ============================================================================
-- 13. ASSIGN CUSTOM IDs TO EXISTING RECORDS
-- ============================================================================

-- Assign custom IDs to users without them
DO $$
DECLARE
  user_record record;
BEGIN
  FOR user_record IN 
    SELECT id, user_type FROM users WHERE custom_id IS NULL
  LOOP
    UPDATE users
    SET custom_id = generate_custom_id(user_record.user_type)
    WHERE id = user_record.id;
  END LOOP;
END $$;

-- Assign license numbers to agents without them
DO $$
DECLARE
  agent_record record;
BEGIN
  FOR agent_record IN 
    SELECT id FROM users WHERE user_type = 'agent' AND agent_license_number IS NULL
  LOOP
    UPDATE users
    SET agent_license_number = generate_license_number()
    WHERE id = agent_record.id;
  END LOOP;
END $$;

-- Assign custom IDs to properties without them
DO $$
DECLARE
  property_record record;
  new_value bigint;
  prefix text;
BEGIN
  FOR property_record IN 
    SELECT id FROM properties WHERE custom_id IS NULL
  LOOP
    -- Get next value
    UPDATE system_counters
    SET current_value = current_value + 1,
        updated_at = now()
    WHERE id = 'property_id'
    RETURNING current_value, prefix INTO new_value, prefix;
    
    -- Assign custom ID
    UPDATE properties
    SET custom_id = prefix || LPAD(new_value::text, 3, '0')
    WHERE id = property_record.id;
  END LOOP;
END $$;