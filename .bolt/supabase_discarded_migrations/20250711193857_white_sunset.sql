/*
  # Fix Database Issues

  1. New Tables
    - `property_images` - Stores detailed information about property images
    - `agent_property_assignments` - Tracks which agents are assigned to which properties
    - `agent_bank_details` - Stores agent bank account information

  2. Changes
    - Add `room_images` JSONB column to properties table
    - Add `education_background` to agent_profiles
    - Add proper indexes and constraints

  3. Security
    - Add RLS policies for all tables
    - Create functions for property assignment and bank verification
*/

-- Add room_images column to properties table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'room_images'
  ) THEN
    ALTER TABLE properties ADD COLUMN room_images JSONB DEFAULT '{}'::jsonb;
    CREATE INDEX idx_properties_room_images ON properties USING gin (room_images);
  END IF;
END $$;

-- Create property_images table if it doesn't exist
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

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);

-- Create agent_property_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

-- Add constraint to agent_property_assignments status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_property_assignments_status_check'
  ) THEN
    ALTER TABLE agent_property_assignments 
    ADD CONSTRAINT agent_property_assignments_status_check 
    CHECK (status IN ('active', 'inactive', 'completed'));
  END IF;
END $$;

-- Create agent_bank_details table if it doesn't exist
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

CREATE INDEX IF NOT EXISTS idx_agent_bank_details_agent_id ON agent_bank_details(agent_id);

-- Add education_background to agent_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_profiles' AND column_name = 'education_background'
  ) THEN
    ALTER TABLE agent_profiles ADD COLUMN education_background text;
  END IF;
END $$;

-- Function to verify agent bank account
CREATE OR REPLACE FUNCTION verify_agent_bank_account(agent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean;
BEGIN
  UPDATE agent_bank_details
  SET 
    account_verified = true,
    account_verified_at = now(),
    verification_notes = 'Verified by admin',
    updated_at = now()
  WHERE agent_id = $1;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  
  -- Create notification
  IF success THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'Bank Account Verified',
      'Your bank account has been verified successfully',
      'verification',
      'agent',
      $1
    );
  END IF;
  
  RETURN success;
END;
$$;

-- Function to claim property for agent
CREATE OR REPLACE FUNCTION claim_property_for_agent(
  p_agent_id uuid,
  p_property_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  success boolean;
  property_exists boolean;
  already_assigned boolean;
BEGIN
  -- Check if property exists
  SELECT EXISTS(
    SELECT 1 FROM properties WHERE id = p_property_id
  ) INTO property_exists;
  
  IF NOT property_exists THEN
    RETURN false;
  END IF;
  
  -- Check if property is already assigned
  SELECT EXISTS(
    SELECT 1 FROM agent_property_assignments 
    WHERE property_id = p_property_id AND status = 'active'
  ) INTO already_assigned;
  
  IF already_assigned THEN
    RETURN false;
  END IF;
  
  -- Create assignment
  INSERT INTO agent_property_assignments (
    agent_id,
    property_id,
    status,
    notes,
    assigned_at
  ) VALUES (
    p_agent_id,
    p_property_id,
    'active',
    'Self-assigned by agent',
    now()
  );
  
  -- Update property with agent_id
  UPDATE properties
  SET agent_id = p_agent_id
  WHERE id = p_property_id;
  
  GET DIAGNOSTICS success = ROW_COUNT;
  
  -- Create notification
  IF success THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'Property Claimed',
      'An agent has claimed a property',
      'property',
      'property',
      p_property_id
    );
  END IF;
  
  RETURN success;
END;
$$;

-- Add RLS policies for agent_property_assignments
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Add RLS policies for agent_bank_details
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agents can view their own bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can insert their own bank details"
  ON agent_bank_details
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = auth.uid());

CREATE POLICY "Agents can update their own bank details"
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

-- Add RLS policies for property_images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

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

-- Create trigger to update property room_images when property_images change
CREATE OR REPLACE FUNCTION organize_property_images()
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
    WHERE property_id = COALESCE(NEW.property_id, OLD.property_id)
    GROUP BY room_type, url, sort_order
    ORDER BY sort_order
  ) AS images;

  -- Update the property with the new room_images
  UPDATE properties
  SET room_images = COALESCE(room_images_json, '{}'::jsonb)
  WHERE id = COALESCE(NEW.property_id, OLD.property_id);

  RETURN NEW;
END;
$$;

-- Create trigger on property_images table
DROP TRIGGER IF EXISTS update_property_room_images ON property_images;
CREATE TRIGGER update_property_room_images
AFTER INSERT OR UPDATE OR DELETE ON property_images
FOR EACH ROW
EXECUTE FUNCTION organize_property_images();