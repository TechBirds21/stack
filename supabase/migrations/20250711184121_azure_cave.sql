/*
  # Agent Bank Account Verification

  1. New Tables
    - `agent_bank_details` - Stores agent bank account information
  
  2. Changes
    - Add education_background field to agent_profiles
    - Add bank account verification fields
  
  3. Security
    - Enable RLS on agent_bank_details
    - Add policies for agents to view and update their own bank details
    - Add policies for admins to view all bank details
*/

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_agent_bank_details_agent_id ON agent_bank_details(agent_id);

-- Enable RLS
ALTER TABLE agent_bank_details ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to verify bank account
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
  
  -- Only admins can verify accounts
  IF NOT is_admin THEN
    RETURN false;
  END IF;
  
  -- Update the bank details
  UPDATE agent_bank_details
  SET 
    account_verified = true,
    account_verified_at = now(),
    verification_notes = 'Verified by admin'
  WHERE agent_id = verify_agent_bank_account.agent_id;
  
  -- Return success
  RETURN true;
END;
$$;

-- Insert sample data
INSERT INTO agent_bank_details (agent_id, bank_account_number, ifsc_code)
SELECT 
  id, 
  '123456789012', 
  'SBIN0001234'
FROM users
WHERE user_type = 'agent' AND status = 'active'
ON CONFLICT (id) DO NOTHING;