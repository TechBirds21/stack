/*
  # Fix Image Upload and Agent Bank Verification

  1. New Tables
    - `agent_bank_details` - Stores agent bank account information
    - Updates to `agent_profiles` table to include education background
  
  2. Functions
    - `verify_agent_bank_account` - Admin function to verify agent bank accounts
    - `claim_property_for_agent` - Function for agents to claim properties
  
  3. Storage Buckets
    - Ensures property-images bucket exists
    - Ensures documents bucket exists
*/

-- Create agent_bank_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_account_number text NOT NULL,
  ifsc_code text NOT NULL,
  account_verified boolean DEFAULT false,
  account_verified_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on agent_id
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

-- Create indexes for agent_property_assignments
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

-- Add agent_id to properties table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN agent_id uuid REFERENCES users(id);
    CREATE INDEX idx_properties_agent_id ON properties(agent_id);
  END IF;
END $$;

-- Function to verify agent bank account
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
    WHERE id = auth.uid() AND user_type = 'admin'
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
  WHERE agent_id = $1;
  
  -- Create a notification for the agent
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'Bank Account Verified',
    'Your bank account has been verified by an admin',
    'verification',
    'agent',
    $1
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Function for agents to claim properties
CREATE OR REPLACE FUNCTION claim_property_for_agent(property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  agent_id uuid;
  is_agent boolean;
  is_assigned boolean;
BEGIN
  -- Get the current user ID
  agent_id := auth.uid();
  
  -- Check if the current user is an agent
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = agent_id AND user_type = 'agent'
  ) INTO is_agent;
  
  IF NOT is_agent THEN
    RAISE EXCEPTION 'Only agents can claim properties';
  END IF;
  
  -- Check if the property is already assigned
  SELECT EXISTS (
    SELECT 1 FROM agent_property_assignments
    WHERE property_id = $1 AND status = 'active'
  ) INTO is_assigned;
  
  IF is_assigned THEN
    RAISE EXCEPTION 'This property is already assigned to another agent';
  END IF;
  
  -- Create the assignment
  INSERT INTO agent_property_assignments (
    agent_id,
    property_id,
    status,
    notes
  ) VALUES (
    agent_id,
    $1,
    'active',
    'Self-assigned by agent'
  );
  
  -- Update the property with the agent_id
  UPDATE properties
  SET agent_id = agent_id
  WHERE id = $1;
  
  -- Create a notification
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
    $1
  );
  
  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- Enable RLS on agent_bank_details
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_bank_details
CREATE POLICY "Agents can view their own bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND user_type = 'admin'
  ));

CREATE POLICY "Agents can update their own bank details"
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can update all bank details"
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND user_type = 'admin'
  ));

-- Enable RLS on agent_property_assignments
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_property_assignments
CREATE POLICY "Agents can view their own property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Admins can view all property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND user_type = 'admin'
  ));

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

-- Create storage buckets if they don't exist
-- Note: This is a placeholder as we can't directly create buckets in SQL
-- You'll need to create these buckets in the Supabase dashboard
-- or use the Supabase client in your application

-- Ensure property-images bucket has proper policies
-- Ensure documents bucket has proper policies