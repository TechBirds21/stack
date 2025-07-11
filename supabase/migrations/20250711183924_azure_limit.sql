/*
  # Add bank account details to agent profiles

  1. New Fields
    - `bank_account_number` (text) - Agent's bank account number
    - `ifsc_code` (text) - Bank IFSC code
    - `account_verified` (boolean) - Whether the account has been verified
    - `account_verified_at` (timestamp) - When the account was verified
  
  2. Admin View
    - Added view for admins to see agent bank details
    - Added function to verify agent bank accounts
*/

-- Add bank account fields to agent_profiles table
ALTER TABLE IF EXISTS agent_profiles 
ADD COLUMN IF NOT EXISTS bank_account_number text,
ADD COLUMN IF NOT EXISTS ifsc_code text,
ADD COLUMN IF NOT EXISTS account_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS account_verified_at timestamptz;

-- Create a view for admins to see agent bank details
CREATE OR REPLACE VIEW agent_bank_details AS
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.agent_license_number,
  ap.bank_account_number,
  ap.ifsc_code,
  ap.account_verified,
  ap.account_verified_at
FROM 
  users u
JOIN 
  agent_profiles ap ON u.id = ap.user_id
WHERE 
  u.user_type = 'agent';

-- Create a function to verify agent bank accounts
CREATE OR REPLACE FUNCTION verify_agent_bank_account(agent_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE agent_profiles
  SET 
    account_verified = true,
    account_verified_at = now()
  WHERE 
    user_id = agent_id;
    
  RETURN FOUND;
END;
$$;

-- Add policy for admins to view agent bank details
CREATE POLICY "Admins can view agent bank details" 
ON agent_profiles
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  )
);

-- Add sample data for testing
DO $$
BEGIN
  -- Only add sample data if no verified accounts exist
  IF NOT EXISTS (SELECT 1 FROM agent_profiles WHERE account_verified = true) THEN
    -- Update existing agent profiles with bank details
    UPDATE agent_profiles
    SET 
      bank_account_number = '1234567890',
      ifsc_code = 'SBIN0001234',
      account_verified = true,
      account_verified_at = now()
    WHERE 
      user_id IN (
        SELECT id FROM users WHERE user_type = 'agent' LIMIT 3
      );
  END IF;
END $$;