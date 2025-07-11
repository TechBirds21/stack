/*
  # Fix Agent Dashboard and Property Images

  1. New Tables
    - `property_images` - Stores detailed information about property images
    - `agent_property_assignments` - Tracks which agents are assigned to which properties
    - `agent_bank_details` - Stores agent bank account information for payments

  2. Modifications
    - Add `room_images` JSONB column to properties table
    - Add `agent_id` column to properties table
    - Add `education_background` to agent_profiles

  3. Security
    - Add RLS policies for all new tables
    - Create functions for agent operations
*/

-- Check if agent_profiles table exists, create if not
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_profiles') THEN
    CREATE TABLE agent_profiles (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
      license_number text,
      experience_years integer DEFAULT 0,
      specialization text,
      bio text,
      education_background text,
      working_hours jsonb DEFAULT '{"end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "start": "09:00"}'::jsonb,
      notification_preferences jsonb DEFAULT '{"sms": true, "email": true, "in_app": true}'::jsonb,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    CREATE INDEX idx_agent_profiles_user_id ON agent_profiles(user_id);
    
    ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
    
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
  ELSE
    -- Add education_background if it doesn't exist
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'agent_profiles' AND column_name = 'education_background'
    ) THEN
      ALTER TABLE agent_profiles ADD COLUMN education_background text;
    END IF;
  END IF;
END $$;

-- Create agent_bank_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  bank_name text NOT NULL,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  account_holder_name text NOT NULL,
  account_type text NOT NULL,
  branch_name text,
  account_verified boolean DEFAULT false,
  account_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_bank_details_agent_id ON agent_bank_details(agent_id);

ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());
  
CREATE POLICY "Agents can update their own bank details"
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());
  
CREATE POLICY "Agents can insert their own bank details"
  ON agent_bank_details
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());
  
CREATE POLICY "Admins can view all bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Add agent_id to properties table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN agent_id uuid REFERENCES auth.users(id);
    CREATE INDEX idx_properties_agent_id ON properties(agent_id);
  END IF;
  
  -- Add room_images to properties table if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'properties' AND column_name = 'room_images'
  ) THEN
    ALTER TABLE properties ADD COLUMN room_images jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create property_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  url text NOT NULL,
  room_type text NOT NULL,
  storage_path text,
  metadata jsonb DEFAULT '{}'::jsonb,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property images"
  ON property_images
  FOR SELECT
  TO public
  USING (true);
  
CREATE POLICY "Property owners can manage their property images"
  ON property_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_id AND properties.owner_id = auth.uid()
    )
  );
  
CREATE POLICY "Agents can manage their assigned property images"
  ON property_images
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_id AND properties.agent_id = auth.uid()
    )
  );

-- Create agent_property_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());
  
CREATE POLICY "Agents can insert their own property assignments"
  ON agent_property_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());
  
CREATE POLICY "Agents can update their own property assignments"
  ON agent_property_assignments
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());
  
CREATE POLICY "Admins can manage all property assignments"
  ON agent_property_assignments
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Create function to verify agent bank account
CREATE OR REPLACE FUNCTION verify_agent_bank_account(agent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_admin boolean;
BEGIN
  -- Check if the current user is an admin
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ) INTO is_admin;
  
  -- Only admins can verify bank accounts
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can verify bank accounts';
  END IF;
  
  -- Update the bank account verification status
  UPDATE agent_bank_details
  SET 
    account_verified = true,
    account_verified_at = now(),
    updated_at = now()
  WHERE agent_bank_details.agent_id = verify_agent_bank_account.agent_id;
  
  RETURN FOUND;
END;
$$;

-- Create function to claim property for agent
CREATE OR REPLACE FUNCTION claim_property_for_agent(property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_user_id uuid;
  is_agent boolean;
  is_property_available boolean;
BEGIN
  -- Get the current user ID
  agent_user_id := auth.uid();
  
  -- Check if the current user is an agent
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE users.id = agent_user_id AND users.user_type = 'agent'
  ) INTO is_agent;
  
  IF NOT is_agent THEN
    RAISE EXCEPTION 'Only agents can claim properties';
  END IF;
  
  -- Check if the property is available (not assigned to any agent)
  SELECT (agent_id IS NULL) INTO is_property_available
  FROM properties
  WHERE properties.id = property_id;
  
  IF NOT is_property_available THEN
    RAISE EXCEPTION 'This property is already assigned to an agent';
  END IF;
  
  -- Create agent property assignment
  INSERT INTO agent_property_assignments (
    agent_id,
    property_id,
    status,
    notes
  ) VALUES (
    agent_user_id,
    property_id,
    'active',
    'Self-assigned by agent'
  );
  
  -- Update property with agent_id
  UPDATE properties
  SET 
    agent_id = agent_user_id,
    updated_at = now()
  WHERE properties.id = property_id;
  
  -- Create notification
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'Property Claimed',
    'An agent has claimed a property',
    'property_assignment',
    'property',
    property_id
  );
  
  RETURN true;
END;
$$;

-- Create trigger to update room_images when property_images change
CREATE OR REPLACE FUNCTION update_property_room_images()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  room_images_json jsonb;
BEGIN
  -- Get all images for this property grouped by room_type
  SELECT jsonb_object_agg(
    room_type,
    jsonb_agg(url)
  )
  INTO room_images_json
  FROM (
    SELECT room_type, url
    FROM property_images
    WHERE property_id = NEW.property_id
    GROUP BY room_type, url
    ORDER BY created_at
  ) AS images;
  
  -- Update the property's room_images column
  UPDATE properties
  SET room_images = COALESCE(room_images_json, '{}'::jsonb)
  WHERE id = NEW.property_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on property_images table
DROP TRIGGER IF EXISTS update_property_room_images_trigger ON property_images;
CREATE TRIGGER update_property_room_images_trigger
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW
EXECUTE FUNCTION update_property_room_images();