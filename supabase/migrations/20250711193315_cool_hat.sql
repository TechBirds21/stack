/*
  # Complete Database Setup for Real Estate Platform

  1. New Tables
    - `users` - User management with authentication
    - `properties` - Property listings with all details
    - `bookings` - Property viewing appointments
    - `inquiries` - Customer inquiries about properties
    - `seller_profiles` - Seller verification and business details
    - `agent_profiles` - Agent profiles and settings
    - `agent_bank_details` - Agent banking information
    - `agent_property_assignments` - Property assignments to agents
    - `agent_performance_metrics` - Agent performance tracking
    - `commissions` - Commission tracking
    - `earnings` - Agent earnings
    - `documents` - Document management
    - `notifications` - System notifications
    - `notification_queue` - Email notification queue
    - `email_verification_tokens` - Email verification
    - `system_counters` - Auto-incrementing counters
    - `property_images` - Property image management
    - `agent_inquiry_assignments` - Inquiry assignments to agents

  2. Storage
    - Create property-images bucket
    - Set up storage policies

  3. Security
    - Enable RLS on all tables
    - Add comprehensive policies for data access
    - Create secure functions for business logic

  4. Functions
    - Auto-generate custom IDs
    - Handle notifications
    - Manage property images
    - Agent assignment logic
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table (extends Supabase auth.users)
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
  updated_at timestamptz DEFAULT now(),
  custom_id text UNIQUE,
  agent_license_number text UNIQUE,
  email_verified boolean DEFAULT false,
  email_verified_at timestamptz,
  city text,
  state text,
  address text,
  bio text,
  profile_image_url text,
  password_hash text
);

-- Create system counters for auto-incrementing IDs
CREATE TABLE IF NOT EXISTS system_counters (
  id text PRIMARY KEY,
  current_value bigint DEFAULT 0,
  prefix text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Insert initial counter values
INSERT INTO system_counters (id, current_value, prefix) VALUES 
('user_counter', 0, 'USR'),
('property_counter', 0, 'PROP')
ON CONFLICT (id) DO NOTHING;

-- Function to assign custom IDs to users
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
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to assign custom IDs to properties
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
  
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for custom IDs
DROP TRIGGER IF EXISTS user_custom_id_trigger ON users;
CREATE TRIGGER user_custom_id_trigger
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION assign_user_custom_id();

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

-- Create trigger for property custom IDs
DROP TRIGGER IF EXISTS property_custom_id_trigger ON properties;
CREATE TRIGGER property_custom_id_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION assign_property_custom_id();

-- Create property images table
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

-- Function to organize property images
CREATE OR REPLACE FUNCTION organize_property_images()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the room_images JSONB column in properties table
  UPDATE properties 
  SET room_images = (
    SELECT jsonb_object_agg(room_type, urls)
    FROM (
      SELECT room_type, jsonb_agg(url ORDER BY sort_order, upload_date) as urls
      FROM property_images 
      WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
      GROUP BY room_type
    ) grouped
  )
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organizing property images
DROP TRIGGER IF EXISTS update_property_room_images ON property_images;
CREATE TRIGGER update_property_room_images
  AFTER INSERT OR UPDATE OR DELETE ON property_images
  FOR EACH ROW EXECUTE FUNCTION organize_property_images();

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id),
  user_id uuid NOT NULL REFERENCES users(id),
  booking_date date NOT NULL,
  booking_time time DEFAULT '10:00:00',
  status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  agent_id uuid REFERENCES users(id),
  CONSTRAINT bookings_status_check CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed'))
);

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
  assigned_agent_id uuid REFERENCES users(id),
  CONSTRAINT inquiries_status_check CHECK (status IN ('new', 'responded', 'closed')),
  CONSTRAINT inquiries_inquiry_type_check CHECK (inquiry_type IN ('purchase', 'rental', 'general'))
);

-- Create seller profiles table
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

-- Create agent profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  working_hours jsonb DEFAULT '{"start": "09:00", "end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]}',
  notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "in_app": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  education_background text
);

-- Create agent bank details table
CREATE TABLE IF NOT EXISTS agent_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_number text NOT NULL,
  ifsc_code text NOT NULL,
  account_verified boolean DEFAULT false,
  account_verified_at timestamptz,
  verification_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent property assignments table
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, property_id),
  CONSTRAINT agent_property_assignments_status_check CHECK (status IN ('active', 'inactive', 'completed'))
);

-- Create agent inquiry assignments table
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  assigned_at timestamptz DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '24 hours'),
  notes text,
  UNIQUE(inquiry_id, agent_id),
  CONSTRAINT agent_inquiry_assignments_status_check CHECK (status IN ('pending', 'accepted', 'declined', 'expired'))
);

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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

-- Create commissions table
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  property_id uuid NOT NULL REFERENCES properties(id),
  booking_id uuid REFERENCES bookings(id),
  inquiry_id uuid REFERENCES inquiries(id),
  commission_type text NOT NULL,
  amount numeric DEFAULT 0,
  percentage numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT commissions_commission_type_check CHECK (commission_type IN ('booking', 'sale', 'rental')),
  CONSTRAINT commissions_status_check CHECK (status IN ('pending', 'approved', 'paid'))
);

-- Create earnings table
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id),
  month integer NOT NULL,
  year integer NOT NULL,
  total_commission numeric DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
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

-- Create notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
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
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  CONSTRAINT notification_queue_status_check CHECK (status IN ('pending', 'sent', 'failed'))
);

-- Create email verification tokens table
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_custom_id ON users(custom_id);
CREATE INDEX IF NOT EXISTS idx_users_agent_license ON users(agent_license_number);
CREATE INDEX IF NOT EXISTS idx_properties_custom_id ON properties(custom_id);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_owner_id ON properties(owner_id);
CREATE INDEX IF NOT EXISTS idx_properties_agent_id ON properties(agent_id);
CREATE INDEX IF NOT EXISTS idx_properties_room_images ON properties USING gin(room_images);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);
CREATE INDEX IF NOT EXISTS idx_bookings_property_id ON bookings(property_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_bank_details_agent_id ON agent_bank_details(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_month_year ON agent_performance_metrics(month, year);
CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type, created_at);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_counters ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users
CREATE POLICY "Users can view their own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON users FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for properties
CREATE POLICY "Anyone can view active properties" ON properties FOR SELECT USING (status = 'active');
CREATE POLICY "Sellers can view their own properties" ON properties FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Sellers can update their own properties" ON properties FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Sellers can delete their own properties" ON properties FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Users can create properties" ON properties FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Agents can view all properties" ON properties FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'agent')
);

-- Create RLS policies for property images
CREATE POLICY "Users can view property images" ON property_images FOR SELECT USING (true);
CREATE POLICY "Property owners can manage their property images" ON property_images FOR ALL USING (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "Agents can manage assigned property images" ON property_images FOR ALL USING (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.agent_id = auth.uid())
);

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Property owners can view bookings for their properties" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = bookings.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "Authenticated users can create bookings" ON bookings FOR INSERT WITH CHECK (true);

-- Create RLS policies for inquiries
CREATE POLICY "Users can view their own inquiries" ON inquiries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Property owners can view inquiries for their properties" ON inquiries FOR SELECT USING (
  EXISTS (SELECT 1 FROM properties WHERE properties.id = inquiries.property_id AND properties.owner_id = auth.uid())
);
CREATE POLICY "Anonymous users can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can create inquiries" ON inquiries FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can view inquiries" ON inquiries FOR SELECT USING (true);

-- Create RLS policies for seller profiles
CREATE POLICY "Users can view their own seller profile" ON seller_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own seller profile" ON seller_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own seller profile" ON seller_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for agent profiles
CREATE POLICY "Agents can view their own profiles" ON agent_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Agents can update their own profiles" ON agent_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for agent bank details
CREATE POLICY "Agents can view their own bank details" ON agent_bank_details FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "Agents can insert their own bank details" ON agent_bank_details FOR INSERT WITH CHECK (auth.uid() = agent_id);
CREATE POLICY "Agents can update their own bank details" ON agent_bank_details FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "Admins can view all bank details" ON agent_bank_details FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

-- Create RLS policies for agent property assignments
CREATE POLICY "Agents can view their property assignments" ON agent_property_assignments FOR SELECT USING (auth.uid() = agent_id);

-- Create RLS policies for agent inquiry assignments
CREATE POLICY "agent_assignments_select_policy" ON agent_inquiry_assignments FOR SELECT USING (auth.uid() = agent_id);
CREATE POLICY "agent_assignments_update_policy" ON agent_inquiry_assignments FOR UPDATE USING (auth.uid() = agent_id);
CREATE POLICY "admin_assignments_all_policy" ON agent_inquiry_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);
CREATE POLICY "System can create agent assignments" ON agent_inquiry_assignments FOR INSERT WITH CHECK (true);

-- Create RLS policies for agent performance metrics
CREATE POLICY "Agents can view their own metrics" ON agent_performance_metrics FOR SELECT USING (auth.uid() = agent_id);

-- Create RLS policies for commissions
CREATE POLICY "Agents can view their own commissions" ON commissions FOR SELECT USING (auth.uid() = agent_id);

-- Create RLS policies for earnings
CREATE POLICY "Agents can view their own earnings" ON earnings FOR SELECT USING (auth.uid() = agent_id);

-- Create RLS policies for documents
CREATE POLICY "Users can view their own documents" ON documents FOR SELECT USING (auth.uid() = uploaded_by);
CREATE POLICY "Admin can manage all documents" ON documents FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

-- Create RLS policies for notifications
CREATE POLICY "Users can view notifications meant for them" ON notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin') OR
  EXISTS (SELECT 1 FROM properties WHERE properties.id = notifications.entity_id AND properties.owner_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM inquiries WHERE inquiries.id = notifications.entity_id AND inquiries.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = notifications.entity_id AND bookings.user_id = auth.uid())
);
CREATE POLICY "Admin can view all notifications" ON notifications FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);
CREATE POLICY "Admin can update notifications" ON notifications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);
CREATE POLICY "Admin can manage all notifications" ON notifications FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);
CREATE POLICY "Allow system to create notifications" ON notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "System can insert notifications" ON notifications FOR INSERT WITH CHECK (true);

-- Create RLS policies for notification queue
CREATE POLICY "admin_notification_queue_policy" ON notification_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

-- Create RLS policies for email verification tokens
CREATE POLICY "email_verification_tokens_select_policy" ON email_verification_tokens FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own verification tokens" ON email_verification_tokens FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for system counters
CREATE POLICY "Admin can view system counters" ON system_counters FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

-- Create notification functions
CREATE OR REPLACE FUNCTION create_notification(
  p_title text,
  p_message text,
  p_type text,
  p_entity_type text DEFAULT NULL,
  p_entity_id uuid DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO notifications (title, message, type, entity_type, entity_id)
  VALUES (p_title, p_message, p_type, p_entity_type, p_entity_id)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enhanced user notification function
CREATE OR REPLACE FUNCTION enhanced_user_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify on new user registration
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      'New User Registration',
      'New user ' || NEW.first_name || ' ' || NEW.last_name || ' (' || NEW.email || ') has registered as ' || NEW.user_type,
      'user_registration',
      'user',
      NEW.id
    );
  END IF;
  
  -- Notify on user type change
  IF TG_OP = 'UPDATE' AND OLD.user_type != NEW.user_type THEN
    PERFORM create_notification(
      'User Type Changed',
      'User ' || NEW.first_name || ' ' || NEW.last_name || ' changed from ' || OLD.user_type || ' to ' || NEW.user_type,
      'user_type_change',
      'user',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enhanced inquiry notification function
CREATE OR REPLACE FUNCTION enhanced_inquiry_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_title text;
  property_owner_id uuid;
BEGIN
  -- Get property details
  SELECT title, owner_id INTO property_title, property_owner_id
  FROM properties WHERE id = NEW.property_id;
  
  IF TG_OP = 'INSERT' THEN
    -- Notify property owner about new inquiry
    PERFORM create_notification(
      'New Property Inquiry',
      'New inquiry from ' || NEW.name || ' (' || NEW.email || ') for property: ' || property_title,
      'new_inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    -- Notify about status change
    PERFORM create_notification(
      'Inquiry Status Updated',
      'Inquiry from ' || NEW.name || ' for ' || property_title || ' status changed to: ' || NEW.status,
      'inquiry_status_change',
      'inquiry',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create inquiry notification function
CREATE OR REPLACE FUNCTION create_inquiry_notification()
RETURNS TRIGGER AS $$
BEGIN
  RETURN enhanced_inquiry_notification();
END;
$$ LANGUAGE plpgsql;

-- Create booking notification function
CREATE OR REPLACE FUNCTION create_booking_notification()
RETURNS TRIGGER AS $$
DECLARE
  property_title text;
  user_name text;
BEGIN
  -- Get property and user details
  SELECT p.title, u.first_name || ' ' || u.last_name
  INTO property_title, user_name
  FROM properties p, users u
  WHERE p.id = NEW.property_id AND u.id = NEW.user_id;
  
  IF TG_OP = 'INSERT' THEN
    PERFORM create_notification(
      'New Property Booking',
      'New booking by ' || user_name || ' for property: ' || property_title || ' on ' || NEW.booking_date,
      'new_booking',
      'booking',
      NEW.id
    );
  END IF;
  
  IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    PERFORM create_notification(
      'Booking Status Updated',
      'Booking by ' || user_name || ' for ' || property_title || ' status changed to: ' || NEW.status,
      'booking_status_change',
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
BEGIN
  -- Update agent performance metrics when assignment status changes
  INSERT INTO agent_performance_metrics (
    agent_id, month, year, total_assignments, accepted_assignments, declined_assignments, expired_assignments
  )
  SELECT 
    NEW.agent_id,
    EXTRACT(MONTH FROM NEW.assigned_at)::integer,
    EXTRACT(YEAR FROM NEW.assigned_at)::integer,
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'declined'),
    COUNT(*) FILTER (WHERE status = 'expired')
  FROM agent_inquiry_assignments
  WHERE agent_id = NEW.agent_id
    AND EXTRACT(MONTH FROM assigned_at) = EXTRACT(MONTH FROM NEW.assigned_at)
    AND EXTRACT(YEAR FROM assigned_at) = EXTRACT(YEAR FROM NEW.assigned_at)
  GROUP BY agent_id
  ON CONFLICT (agent_id, month, year) DO UPDATE SET
    total_assignments = EXCLUDED.total_assignments,
    accepted_assignments = EXCLUDED.accepted_assignments,
    declined_assignments = EXCLUDED.declined_assignments,
    expired_assignments = EXCLUDED.expired_assignments,
    updated_at = now();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS user_notification_trigger ON users;
CREATE TRIGGER user_notification_trigger
  AFTER INSERT OR UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION enhanced_user_notification();

DROP TRIGGER IF EXISTS inquiry_notification_trigger ON inquiries;
CREATE TRIGGER inquiry_notification_trigger
  AFTER INSERT OR UPDATE OF status ON inquiries
  FOR EACH ROW EXECUTE FUNCTION create_inquiry_notification();

DROP TRIGGER IF EXISTS booking_notification_trigger ON bookings;
CREATE TRIGGER booking_notification_trigger
  AFTER INSERT OR UPDATE OF status ON bookings
  FOR EACH ROW EXECUTE FUNCTION create_booking_notification();

DROP TRIGGER IF EXISTS agent_metrics_update_trigger ON agent_inquiry_assignments;
CREATE TRIGGER agent_metrics_update_trigger
  AFTER INSERT OR UPDATE OF status ON agent_inquiry_assignments
  FOR EACH ROW EXECUTE FUNCTION update_agent_metrics_on_assignment_change();

-- Business logic functions
CREATE OR REPLACE FUNCTION verify_agent_bank_account(
  p_agent_id uuid,
  p_verified boolean DEFAULT true,
  p_notes text DEFAULT NULL
) RETURNS boolean AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if current user is admin
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can verify bank accounts';
  END IF;
  
  -- Update bank account verification
  UPDATE agent_bank_details 
  SET 
    account_verified = p_verified,
    account_verified_at = CASE WHEN p_verified THEN now() ELSE NULL END,
    verification_notes = p_notes,
    updated_at = now()
  WHERE agent_id = p_agent_id;
  
  -- Create notification
  PERFORM create_notification(
    'Bank Account Verification',
    'Bank account verification status updated for agent',
    'bank_verification',
    'agent',
    p_agent_id
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION claim_property_for_agent(
  p_property_id uuid,
  p_agent_id uuid DEFAULT auth.uid()
) RETURNS boolean AS $$
DECLARE
  is_agent boolean;
  property_exists boolean;
  already_assigned boolean;
BEGIN
  -- Check if user is an agent
  SELECT EXISTS (
    SELECT 1 FROM users 
    WHERE id = p_agent_id AND user_type = 'agent'
  ) INTO is_agent;
  
  IF NOT is_agent THEN
    RAISE EXCEPTION 'Only agents can claim properties';
  END IF;
  
  -- Check if property exists and is available
  SELECT EXISTS (
    SELECT 1 FROM properties 
    WHERE id = p_property_id AND (agent_id IS NULL OR agent_id = p_agent_id)
  ) INTO property_exists;
  
  IF NOT property_exists THEN
    RAISE EXCEPTION 'Property not found or already assigned to another agent';
  END IF;
  
  -- Check if already assigned to this agent
  SELECT EXISTS (
    SELECT 1 FROM agent_property_assignments 
    WHERE agent_id = p_agent_id AND property_id = p_property_id AND status = 'active'
  ) INTO already_assigned;
  
  IF already_assigned THEN
    RAISE EXCEPTION 'Property already assigned to this agent';
  END IF;
  
  -- Assign property to agent
  UPDATE properties 
  SET agent_id = p_agent_id, updated_at = now()
  WHERE id = p_property_id;
  
  -- Create assignment record
  INSERT INTO agent_property_assignments (agent_id, property_id, status)
  VALUES (p_agent_id, p_property_id, 'active')
  ON CONFLICT (agent_id, property_id) DO UPDATE SET
    status = 'active',
    updated_at = now();
  
  -- Create notification
  PERFORM create_notification(
    'Property Claimed',
    'Property has been claimed by agent',
    'property_claimed',
    'property',
    p_property_id
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample data
INSERT INTO users (
  id, email, first_name, last_name, phone_number, user_type, status, verification_status
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'admin@homeown.com',
  'Admin',
  'User',
  '+91-9999999999',
  'admin',
  'active',
  'verified'
),
(
  '22222222-2222-2222-2222-222222222222',
  'agent@homeown.com',
  'John',
  'Agent',
  '+91-8888888888',
  'agent',
  'active',
  'verified'
),
(
  '33333333-3333-3333-3333-333333333333',
  'seller@homeown.com',
  'Jane',
  'Seller',
  '+91-7777777777',
  'seller',
  'active',
  'verified'
)
ON CONFLICT (id) DO NOTHING;

-- Insert sample properties
INSERT INTO properties (
  title, description, price, monthly_rent, property_type, 
  bedrooms, bathrooms, area_sqft, address, city, state, zip_code,
  latitude, longitude, images, amenities, status, featured, verified, listing_type,
  owner_id
) VALUES 
(
  'Beautiful 3BHK Apartment in Prime Location',
  'Spacious apartment with modern amenities in a prime location. Perfect for families looking for comfort and convenience.',
  5000000, NULL, 'apartment', 3, 2, 1200, 'MG Road, Near City Center', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.6868, 83.2185, 
  ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Power Backup', 'Security', 'Parking', 'Gym', 'Swimming Pool'], 
  'active', true, true, 'SALE',
  '33333333-3333-3333-3333-333333333333'
),
(
  'Luxury Villa with Garden',
  'Beautiful villa with spacious garden and modern amenities. Ideal for those who love space and luxury.',
  8500000, NULL, 'villa', 4, 3, 2500, 'Beach Road, Rushikonda', 'Visakhapatnam', 'Andhra Pradesh', '530002',
  17.7231, 83.3012, 
  ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg', 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Garden', 'Swimming Pool', 'Gym', 'Security', 'Power Backup'], 
  'active', true, true, 'SALE',
  '33333333-3333-3333-3333-333333333333'
),
(
  'Modern 2BHK Flat for Rent',
  'Contemporary flat with all modern amenities in a great location. Perfect for young professionals.',
  NULL, 25000, 'apartment', 2, 2, 950, 'Dwaraka Nagar, IT Hub', 'Visakhapatnam', 'Andhra Pradesh', '530016',
  17.7326, 83.3332, 
  ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg', 'https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Power Backup', 'Lift', 'Parking', 'Security'], 
  'active', true, true, 'RENT',
  '33333333-3333-3333-3333-333333333333'
),
(
  'Spacious 4BHK House',
  'Large family house with garden and parking. Great for big families.',
  7500000, NULL, 'house', 4, 3, 2000, 'Madhurawada, Residential Area', 'Visakhapatnam', 'Andhra Pradesh', '530041',
  17.7804, 83.3782, 
  ARRAY['https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg'], 
  ARRAY['Garden', 'Parking', 'Security'], 
  'active', false, true, 'SALE',
  '33333333-3333-3333-3333-333333333333'
),
(
  'Cozy 1BHK Studio Apartment',
  'Perfect for singles or couples. Fully furnished with modern amenities.',
  NULL, 15000, 'studio', 1, 1, 500, 'MVP Colony, Near Beach', 'Visakhapatnam', 'Andhra Pradesh', '530017',
  17.7231, 83.3012, 
  ARRAY['https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg'], 
  ARRAY['Furnished', 'Power Backup', 'Security'], 
  'active', false, true, 'RENT',
  '33333333-3333-3333-3333-333333333333'
),
(
  'Premium Penthouse with Sea View',
  'Luxury penthouse with stunning sea views and premium amenities.',
  12000000, NULL, 'penthouse', 3, 3, 1800, 'RK Beach Road, Premium Location', 'Visakhapatnam', 'Andhra Pradesh', '530003',
  17.6868, 83.2185, 
  ARRAY['https://images.pexels.com/photos/2404843/pexels-photo-2404843.jpeg'], 
  ARRAY['Sea View', 'Swimming Pool', 'Gym', 'Concierge', 'Parking'], 
  'active', true, true, 'SALE',
  '33333333-3333-3333-3333-333333333333'
)
ON CONFLICT DO NOTHING;

-- Insert sample agent profile
INSERT INTO agent_profiles (user_id, license_number, experience_years, specialization, bio)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'AP-RE-2024-001',
  5,
  'Residential Properties',
  'Experienced real estate agent specializing in residential properties in Visakhapatnam.'
)
ON CONFLICT DO NOTHING;

-- Insert sample bookings
INSERT INTO bookings (property_id, user_id, booking_date, booking_time, status, agent_id)
SELECT 
  p.id,
  '33333333-3333-3333-3333-333333333333',
  CURRENT_DATE + 1,
  '10:00:00',
  'pending',
  '22222222-2222-2222-2222-222222222222'
FROM properties p
WHERE p.title = 'Beautiful 3BHK Apartment in Prime Location'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Insert sample inquiries
INSERT INTO inquiries (property_id, name, email, phone, message, status, inquiry_type)
SELECT 
  p.id,
  'Interested Buyer',
  'buyer@example.com',
  '+91-9876543210',
  'I am interested in this property. Please provide more details.',
  'new',
  'purchase'
FROM properties p
WHERE p.title = 'Beautiful 3BHK Apartment in Prime Location'
LIMIT 1
ON CONFLICT DO NOTHING;