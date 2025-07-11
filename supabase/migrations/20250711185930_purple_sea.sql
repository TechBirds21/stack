/*
  # Agent Property Management

  1. New Tables
    - `agent_property_assignments` - Tracks properties assigned to agents
    - `agent_bank_details` - Stores agent bank account information for payments
  
  2. Views
    - `agent_dashboard_stats` - Aggregated statistics for agent dashboard
  
  3. Functions
    - `verify_agent_bank_account` - Admin function to verify agent bank accounts
    - `claim_property` - Function for agents to claim unassigned properties
*/

-- Create agent_property_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
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
  TO authenticated
  USING (agent_id = uid());

CREATE POLICY "Agents can create their property assignments" 
  ON agent_property_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = uid() AND EXISTS (
    SELECT 1 FROM users WHERE id = uid() AND user_type = 'agent'
  ));

CREATE POLICY "Agents can update their property assignments" 
  ON agent_property_assignments
  FOR UPDATE
  TO authenticated
  USING (agent_id = uid())
  WITH CHECK (agent_id = uid());

-- Create agent_bank_details table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_bank_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name text,
  account_number text NOT NULL,
  ifsc_code text NOT NULL,
  account_holder_name text,
  account_type text CHECK (account_type IN ('savings', 'current')),
  account_verified boolean DEFAULT false,
  account_verified_at timestamptz,
  verified_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id)
);

-- Create indexes for agent_bank_details
CREATE INDEX IF NOT EXISTS idx_agent_bank_details_agent_id ON agent_bank_details(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_bank_details_verified ON agent_bank_details(account_verified);

-- Enable RLS on agent_bank_details
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_bank_details
CREATE POLICY "Agents can view their own bank details" 
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (agent_id = uid());

CREATE POLICY "Agents can insert their own bank details" 
  ON agent_bank_details
  FOR INSERT
  TO authenticated
  WITH CHECK (agent_id = uid() AND EXISTS (
    SELECT 1 FROM users WHERE id = uid() AND user_type = 'agent'
  ));

CREATE POLICY "Agents can update their own bank details" 
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (agent_id = uid())
  WITH CHECK (agent_id = uid() AND (
    account_verified = false OR 
    (account_verified = true AND OLD.account_verified = true AND account_number = OLD.account_number AND ifsc_code = OLD.ifsc_code)
  ));

CREATE POLICY "Admins can view all agent bank details" 
  ON agent_bank_details
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = uid() AND user_type = 'admin'
  ));

CREATE POLICY "Admins can update agent bank verification" 
  ON agent_bank_details
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = uid() AND user_type = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE id = uid() AND user_type = 'admin'
  ));

-- Create a view for agent bank details
CREATE OR REPLACE VIEW agent_bank_details_view AS
SELECT 
  abd.id,
  u.id as agent_id,
  u.first_name,
  u.last_name,
  u.email,
  u.agent_license_number,
  abd.bank_name,
  abd.account_number,
  abd.ifsc_code,
  abd.account_holder_name,
  abd.account_type,
  abd.account_verified,
  abd.account_verified_at,
  abd.created_at,
  abd.updated_at
FROM agent_bank_details abd
JOIN users u ON abd.agent_id = u.id
WHERE u.user_type = 'agent';

-- Create a function to verify agent bank account
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
    SELECT 1 FROM users WHERE id = auth.uid() AND user_type = 'admin'
  ) INTO is_admin;
  
  IF NOT is_admin THEN
    RAISE EXCEPTION 'Only admins can verify bank accounts';
  END IF;
  
  -- Update the bank account verification status
  UPDATE agent_bank_details
  SET 
    account_verified = true,
    account_verified_at = now(),
    verified_by = auth.uid(),
    updated_at = now()
  WHERE agent_id = verify_agent_bank_account.agent_id;
  
  -- Create a notification for the agent
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'Bank Account Verified',
    'Your bank account has been verified successfully. You can now receive payments.',
    'verification',
    'agent',
    verify_agent_bank_account.agent_id
  );
  
  RETURN true;
END;
$$;

-- Create a function for agents to claim properties
CREATE OR REPLACE FUNCTION claim_property(property_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_agent boolean;
  is_available boolean;
  v_agent_id uuid;
BEGIN
  -- Get the current user ID
  v_agent_id := auth.uid();
  
  -- Check if the current user is an agent
  SELECT EXISTS (
    SELECT 1 FROM users WHERE id = v_agent_id AND user_type = 'agent'
  ) INTO is_agent;
  
  IF NOT is_agent THEN
    RAISE EXCEPTION 'Only agents can claim properties';
  END IF;
  
  -- Check if the property is available (not assigned to any agent)
  SELECT NOT EXISTS (
    SELECT 1 FROM agent_property_assignments 
    WHERE property_id = claim_property.property_id AND status = 'active'
  ) INTO is_available;
  
  IF NOT is_available THEN
    RAISE EXCEPTION 'This property is already assigned to an agent';
  END IF;
  
  -- Create the assignment
  INSERT INTO agent_property_assignments (
    agent_id,
    property_id,
    status,
    notes
  ) VALUES (
    v_agent_id,
    claim_property.property_id,
    'active',
    'Self-assigned by agent'
  );
  
  -- Update the property with the agent_id
  UPDATE properties
  SET agent_id = v_agent_id
  WHERE id = claim_property.property_id;
  
  -- Create a notification for the agent
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'Property Claimed',
    'You have successfully claimed a property. You can now manage inquiries for this property.',
    'property',
    'property',
    claim_property.property_id
  );
  
  RETURN true;
END;
$$;

-- Add education_background field to agent_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_profiles' AND column_name = 'education_background'
  ) THEN
    ALTER TABLE agent_profiles ADD COLUMN education_background text;
  END IF;
END $$;

-- Add certifications field to agent_profiles if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'agent_profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE agent_profiles ADD COLUMN certifications text[];
  END IF;
END $$;

-- Add agent_id field to properties if it doesn't exist
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

-- Create a trigger to notify agents when they are assigned to a property
CREATE OR REPLACE FUNCTION notify_agent_property_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'New Property Assignment',
    'You have been assigned to a new property. Check your dashboard for details.',
    'property',
    'property',
    NEW.property_id
  );
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'agent_property_assignment_notification_trigger'
  ) THEN
    CREATE TRIGGER agent_property_assignment_notification_trigger
    AFTER INSERT ON agent_property_assignments
    FOR EACH ROW
    EXECUTE FUNCTION notify_agent_property_assignment();
  END IF;
END $$;

-- Create a trigger to notify agents when they are assigned to an inquiry
CREATE OR REPLACE FUNCTION notify_agent_inquiry_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.assigned_agent_id IS NOT NULL AND (OLD.assigned_agent_id IS NULL OR OLD.assigned_agent_id != NEW.assigned_agent_id) THEN
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'New Inquiry Assignment',
      'You have been assigned to a new inquiry. Check your dashboard for details.',
      'inquiry',
      'inquiry',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'agent_inquiry_assignment_notification_trigger'
  ) THEN
    CREATE TRIGGER agent_inquiry_assignment_notification_trigger
    AFTER UPDATE OF assigned_agent_id ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION notify_agent_inquiry_assignment();
  END IF;
END $$;