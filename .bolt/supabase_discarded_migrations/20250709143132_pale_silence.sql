/*
  # Fix Missing Database Tables and Relationships

  This migration creates all the missing tables and relationships that are causing the Supabase errors.

  ## New Tables Created
  1. `users` - User accounts with authentication integration
  2. `properties` - Property listings 
  3. `bookings` - Property tour bookings
  4. `inquiries` - Customer inquiries
  5. `notifications` - System notifications
  6. `agent_inquiry_assignments` - Agent assignment tracking
  7. `seller_profiles` - Seller profile information
  8. `commissions` - Agent commission tracking
  9. `earnings` - Agent earnings summary
  10. `documents` - File attachments
  11. `email_verification_tokens` - Email verification
  12. `notification_queue` - Email notification queue
  13. `system_counters` - Auto-incrementing counters

  ## Security
  - Enable RLS on all tables
  - Add appropriate policies for data access
  - Set up proper foreign key relationships

  ## Functions and Triggers
  - Custom ID generation functions
  - Notification triggers
  - User registration triggers
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create system_counters table first (needed for custom ID generation)
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Insert initial counter values
INSERT INTO system_counters (id, current_value, prefix) VALUES 
  ('user_counter', 0, 'USR'),
  ('property_counter', 0, 'PROP')
ON CONFLICT (id) DO NOTHING;

-- Create custom ID generation functions
CREATE OR REPLACE FUNCTION assign_user_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_id IS NULL THEN
    UPDATE system_counters 
    SET current_value = current_value + 1, updated_at = now()
    WHERE id = 'user_counter';
    
    SELECT prefix || LPAD((current_value)::text, 6, '0')
    INTO NEW.custom_id
    FROM system_counters
    WHERE id = 'user_counter';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_property_custom_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.custom_id IS NULL THEN
    UPDATE system_counters 
    SET current_value = current_value + 1, updated_at = now()
    WHERE id = 'property_counter';
    
    SELECT prefix || LPAD((current_value)::text, 6, '0')
    INTO NEW.custom_id
    FROM system_counters
    WHERE id = 'property_counter';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create notification functions
CREATE OR REPLACE FUNCTION create_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Booking Request',
    'A new booking request has been submitted for property: ' || (SELECT title FROM properties WHERE id = NEW.property_id),
    'booking',
    'booking',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enhanced_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (title, message, type, entity_type, entity_id)
    VALUES (
      'New User Registration',
      'New user registered: ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.user_type || ')',
      'user_registration',
      'user',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION enhanced_inquiry_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notifications (title, message, type, entity_type, entity_id)
  VALUES (
    'New Property Inquiry',
    'New inquiry received from: ' || NEW.name || ' for property: ' || (SELECT title FROM properties WHERE id = NEW.property_id),
    'inquiry',
    'inquiry',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone_number text,
  date_of_birth date,
  user_type text DEFAULT 'buyer' NOT NULL,
  status text DEFAULT 'active' NOT NULL,
  verification_status text DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  custom_id text UNIQUE,
  agent_license_number text UNIQUE,
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data"
  ON users FOR UPDATE
  TO public
  USING (auth.uid() = id);

-- Create users triggers
CREATE TRIGGER user_custom_id_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION assign_user_custom_id();

CREATE TRIGGER user_notification_trigger
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION enhanced_user_notification();

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
  custom_id text UNIQUE
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- Create properties policies
CREATE POLICY "Anyone can view active properties"
  ON properties FOR SELECT
  TO public
  USING (status = 'active');

CREATE POLICY "Sellers can view their own properties"
  ON properties FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Sellers can update their own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Sellers can delete their own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can create properties"
  ON properties FOR INSERT
  TO public
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Agents can view all properties"
  ON properties FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'agent'
  ));

-- Create properties trigger
CREATE TRIGGER property_custom_id_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION assign_property_custom_id();

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

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create bookings policies
CREATE POLICY "Users can view their own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view bookings for their properties"
  ON bookings FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = bookings.property_id AND properties.owner_id = auth.uid()
  ));

CREATE POLICY "Authenticated users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create bookings trigger
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_notification();

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
  inquiry_type text DEFAULT 'general' CHECK (inquiry_type IN ('purchase', 'rental', 'general')),
  location text,
  assigned_agent_id uuid REFERENCES users(id)
);

ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create inquiries policies
CREATE POLICY "Public can view inquiries"
  ON inquiries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anonymous users can create inquiries"
  ON inquiries FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can create inquiries"
  ON inquiries FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries"
  ON inquiries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM properties 
    WHERE properties.id = inquiries.property_id AND properties.owner_id = auth.uid()
  ));

-- Create inquiries trigger
CREATE TRIGGER inquiry_notification_trigger
  AFTER INSERT ON inquiries
  FOR EACH ROW EXECUTE FUNCTION enhanced_inquiry_notification();

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

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create notifications policies
CREATE POLICY "Allow system to create notifications"
  ON notifications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can view all notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

CREATE POLICY "Admin can manage all notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

CREATE POLICY "Admin can update notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

CREATE POLICY "Users can view notifications meant for them"
  ON notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    ) OR
    EXISTS (
      SELECT 1 FROM properties 
      WHERE properties.id = notifications.entity_id AND properties.owner_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM inquiries 
      WHERE inquiries.id = notifications.entity_id AND inquiries.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = notifications.entity_id AND bookings.user_id = auth.uid()
    )
  );

-- Create agent_inquiry_assignments table
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  assigned_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  notes text,
  UNIQUE(inquiry_id, agent_id)
);

ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;

-- Create agent_inquiry_assignments policies
CREATE POLICY "System can create agent assignments"
  ON agent_inquiry_assignments FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "agent_assignments_select_policy"
  ON agent_inquiry_assignments FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "agent_assignments_update_policy"
  ON agent_inquiry_assignments FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "admin_assignments_all_policy"
  ON agent_inquiry_assignments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Create seller_profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
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
  documents jsonb DEFAULT '{}',
  verification_status text DEFAULT 'pending',
  verification_reason text,
  verified_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Create seller_profiles policies
CREATE POLICY "Users can view their own seller profile"
  ON seller_profiles FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own seller profile"
  ON seller_profiles FOR INSERT
  TO public
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile"
  ON seller_profiles FOR UPDATE
  TO public
  USING (auth.uid() = user_id);

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  booking_id uuid REFERENCES bookings(id),
  inquiry_id uuid REFERENCES inquiries(id),
  commission_type text NOT NULL CHECK (commission_type IN ('booking', 'sale', 'rental')),
  amount numeric DEFAULT 0 NOT NULL,
  percentage numeric DEFAULT 0 NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'approved', 'paid')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- Create commissions policies
CREATE POLICY "Agents can view their own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  month integer NOT NULL,
  year integer NOT NULL,
  total_commission numeric DEFAULT 0 NOT NULL,
  total_bookings integer DEFAULT 0 NOT NULL,
  total_sales integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Create earnings policies
CREATE POLICY "Agents can view their own earnings"
  ON earnings FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

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

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create documents policies
CREATE POLICY "Users can view their own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

CREATE POLICY "Admin can manage all documents"
  ON documents FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Create email_verification_tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Create email_verification_tokens policies
CREATE POLICY "email_verification_tokens_select_policy"
  ON email_verification_tokens FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own verification tokens"
  ON email_verification_tokens FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create notification_queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  email_to text NOT NULL,
  status text DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'failed')),
  attempts integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  scheduled_for timestamptz DEFAULT now(),
  sent_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;

-- Create notification_queue policies
CREATE POLICY "admin_notification_queue_policy"
  ON notification_queue FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Create system_counters policies
CREATE POLICY "Admin can view system counters"
  ON system_counters FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_properties_custom_id ON properties(custom_id);
CREATE INDEX IF NOT EXISTS idx_users_custom_id ON users(custom_id);
CREATE INDEX IF NOT EXISTS idx_users_agent_license ON users(agent_license_number);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);

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
  'Cozy 1BHK for Rent',
  'Perfect for young professionals, fully furnished apartment.',
  NULL, 15000, 'apartment', 1, 1, 600, 'Siripuram', 'Visakhapatnam', 'Andhra Pradesh', '530013',
  17.7231, 83.3012, ARRAY['https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg'], 
  ARRAY['Furnished', 'Wi-Fi', 'AC'], 'active', false, true, 'RENT'
),
(
  'Spacious 4BHK House',
  'Large family house with garden and parking space.',
  NULL, 35000, 'house', 4, 3, 2000, 'MVP Colony', 'Visakhapatnam', 'Andhra Pradesh', '530017',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Garden', 'Parking', 'Security'], 'active', true, true, 'RENT'
),
(
  'Commercial Office Space',
  'Prime commercial space in business district.',
  12000000, NULL, 'commercial', NULL, NULL, 1500, 'Dwaraka Nagar', 'Visakhapatnam', 'Andhra Pradesh', '530016',
  17.7326, 83.3332, ARRAY['https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg'], 
  ARRAY['Elevator', 'Parking', 'Security'], 'active', false, true, 'SALE'
)
ON CONFLICT DO NOTHING;