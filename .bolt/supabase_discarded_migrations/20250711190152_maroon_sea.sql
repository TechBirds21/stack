/*
  # Agent Dashboard Database Fixes

  1. New Tables
    - `agent_bank_details` - Stores agent bank account information
    - `agent_property_assignments` - Tracks properties assigned to agents
  
  2. Changes
    - Add `education_background` field to agent_profiles
    - Add `agent_id` field to properties table
  
  3. Security
    - Enable RLS on new tables
    - Add policies for agent access
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

-- Enable RLS on agent_bank_details
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_bank_details
CREATE POLICY "Agents can view their own bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (agent_id = uid());

CREATE POLICY "Agents can update their own bank details"
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (agent_id = uid());

CREATE POLICY "Agents can insert their own bank details"
  ON agent_bank_details
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = uid());

CREATE POLICY "Admin can view all agent bank details"
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = uid() AND users.user_type = 'admin'
  ));

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

-- Add agent_id to properties if it doesn't exist
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
  CONSTRAINT agent_property_assignments_status_check CHECK (status IN ('active', 'inactive', 'completed'))
);

-- Create unique constraint on agent_id and property_id
ALTER TABLE agent_property_assignments 
  ADD CONSTRAINT agent_property_assignments_agent_id_property_id_key 
  UNIQUE (agent_id, property_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

-- Enable RLS on agent_property_assignments
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_property_assignments
CREATE POLICY "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = uid());

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
  WHERE agent_bank_details.agent_id = verify_agent_bank_account.agent_id;
  
  RETURN true;
END;
$$;

-- Create function to claim property for agent
CREATE OR REPLACE FUNCTION claim_property_for_agent(
  agent_id uuid,
  property_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_agent boolean;
  is_available boolean;
BEGIN
  -- Check if the current user is an agent
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND user_type = 'agent'
  ) INTO is_agent;
  
  -- Only agents can claim properties
  IF NOT is_agent THEN
    RAISE EXCEPTION 'Only agents can claim properties';
  END IF;
  
  -- Check if property is available (not assigned to any agent)
  SELECT (agent_id IS NULL) INTO is_available
  FROM properties
  WHERE id = property_id;
  
  IF NOT is_available THEN
    RAISE EXCEPTION 'Property is already assigned to an agent';
  END IF;
  
  -- Create assignment record
  INSERT INTO agent_property_assignments (
    agent_id,
    property_id,
    status,
    notes
  ) VALUES (
    agent_id,
    property_id,
    'active',
    'Self-assigned by agent'
  );
  
  -- Update property with agent_id
  UPDATE properties
  SET agent_id = claim_property_for_agent.agent_id
  WHERE id = property_id;
  
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
    'property',
    'property',
    property_id
  );
  
  RETURN true;
END;
$$;