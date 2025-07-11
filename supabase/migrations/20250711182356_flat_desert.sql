/*
  # Add education and certifications to agent profiles

  1. New Fields
    - `education` - Text field for agent's educational background
    - `certifications` - Array of text for agent's professional certifications
  
  2. Sample Data
    - Add sample education and certification data for testing
*/

-- Add education and certifications fields to agent_profiles if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_profiles' AND column_name = 'education'
  ) THEN
    ALTER TABLE agent_profiles ADD COLUMN education text;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE agent_profiles ADD COLUMN certifications text[];
  END IF;
END $$;

-- Create agent_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  working_hours jsonb DEFAULT '{"end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"], "start": "09:00"}'::jsonb,
  notification_preferences jsonb DEFAULT '{"sms": true, "email": true, "in_app": true}'::jsonb,
  education text,
  certifications text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);

-- Enable RLS on agent_profiles
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_profiles
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

-- Insert sample data for testing
INSERT INTO agent_profiles (user_id, license_number, experience_years, specialization, education, certifications)
SELECT 
  id, 
  'AG-' || floor(random() * 90000 + 10000)::text, 
  floor(random() * 10 + 1)::integer,
  (ARRAY['Residential', 'Commercial', 'Luxury', 'Investment'])[floor(random() * 4 + 1)],
  (ARRAY[
    'Bachelor of Commerce, University of Delhi',
    'MBA in Real Estate, Symbiosis Institute',
    'B.Tech in Civil Engineering, IIT Bombay',
    'Bachelor of Arts in Economics, University of Mumbai'
  ])[floor(random() * 4 + 1)],
  ARRAY[
    'Certified Real Estate Agent',
    'Property Management Specialist',
    'Commercial Real Estate Certification'
  ]
FROM users
WHERE user_type = 'agent'
  AND NOT EXISTS (SELECT 1 FROM agent_profiles WHERE agent_profiles.user_id = users.id)
ON CONFLICT (user_id) DO NOTHING;