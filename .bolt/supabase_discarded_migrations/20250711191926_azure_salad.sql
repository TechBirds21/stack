/*
  # Property Room Images Schema

  1. New Tables
    - `property_images` - Stores detailed information about property images
  
  2. Schema Updates
    - Add `room_images` JSONB column to properties table
    - Add `education_background` to agent_profiles
  
  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

-- Add room_images column to properties table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'room_images'
  ) THEN
    ALTER TABLE properties ADD COLUMN room_images JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create property_images table if it doesn't exist
CREATE TABLE IF NOT EXISTS property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  room_type TEXT NOT NULL,
  original_filename TEXT,
  file_size BIGINT,
  file_type TEXT,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on property_id and room_type
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_room_type ON property_images(room_type);

-- Enable RLS on property_images
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;

-- Create policies for property_images
CREATE POLICY "Anyone can view property images"
  ON property_images
  FOR SELECT
  USING (true);

CREATE POLICY "Property owners can manage their property images"
  ON property_images
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_images.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Add education_background to agent_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_profiles' AND column_name = 'education_background'
  ) THEN
    ALTER TABLE agent_profiles ADD COLUMN education_background TEXT;
  END IF;
END $$;

-- Create agent_property_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  assigned_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, property_id)
);

-- Create indexes for agent_property_assignments
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_status ON agent_property_assignments(status);

-- Enable RLS on agent_property_assignments
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_property_assignments
CREATE POLICY "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can update their property assignments"
  ON agent_property_assignments
  FOR UPDATE
  USING (agent_id = auth.uid());

-- Create function to claim property for agent
CREATE OR REPLACE FUNCTION claim_property_for_agent(
  p_property_id UUID,
  p_agent_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_already_assigned BOOLEAN;
BEGIN
  -- Check if property is already assigned
  SELECT EXISTS (
    SELECT 1 FROM agent_property_assignments
    WHERE property_id = p_property_id
    AND status = 'active'
  ) INTO v_already_assigned;
  
  IF v_already_assigned THEN
    RETURN false;
  END IF;
  
  -- Create assignment
  INSERT INTO agent_property_assignments (
    agent_id,
    property_id,
    status,
    assigned_at,
    notes
  ) VALUES (
    p_agent_id,
    p_property_id,
    'active',
    now(),
    'Self-assigned by agent'
  );
  
  -- Update property with agent_id
  UPDATE properties
  SET agent_id = p_agent_id,
      updated_at = now()
  WHERE id = p_property_id;
  
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
    p_property_id
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to verify agent bank account
CREATE OR REPLACE FUNCTION verify_agent_bank_account(
  agent_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update agent_profiles
  UPDATE agent_profiles
  SET account_verified = true,
      account_verified_at = now(),
      updated_at = now()
  WHERE user_id = agent_id;
  
  -- Create notification
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'Bank Account Verified',
    'Your bank account has been verified',
    'account_verification',
    'user',
    agent_id
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;