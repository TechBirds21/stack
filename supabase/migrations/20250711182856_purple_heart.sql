/*
  # Complete Agent Dashboard Fixes

  1. New Tables
    - Add education_background and certifications to agent_profiles
    - Create agent_property_assignments table for tracking property assignments
    
  2. Security
    - Enable RLS on all tables
    - Add policies for agents to view and update their own data
    
  3. Functions
    - Create functions to update agent metrics
*/

-- Add education_background to agent_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_profiles' AND column_name = 'education_background'
  ) THEN
    ALTER TABLE IF EXISTS agent_profiles 
    ADD COLUMN education_background text;
  END IF;
END $$;

-- Add certifications to agent_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_profiles' AND column_name = 'certifications'
  ) THEN
    ALTER TABLE IF EXISTS agent_profiles 
    ADD COLUMN certifications text[];
  END IF;
END $$;

-- Add specializations to agent_profiles if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agent_profiles' AND column_name = 'specializations'
  ) THEN
    ALTER TABLE IF EXISTS agent_profiles 
    ADD COLUMN specializations text[];
  END IF;
END $$;

-- Create agent_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  specializations text[],
  bio text,
  education_background text,
  certifications text[],
  notification_preferences jsonb DEFAULT '{"sms": true, "email": true, "in_app": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index on user_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);

-- Enable RLS on agent_profiles
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own profiles
CREATE POLICY IF NOT EXISTS "Agents can view their own profiles"
  ON agent_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for agents to update their own profiles
CREATE POLICY IF NOT EXISTS "Agents can update their own profiles"
  ON agent_profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Create agent_performance_metrics table if it doesn't exist
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

-- Create index on agent_id
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_performance_metrics(agent_id);

-- Create index on month and year
CREATE INDEX IF NOT EXISTS idx_agent_metrics_month_year ON agent_performance_metrics(month, year);

-- Enable RLS on agent_performance_metrics
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own metrics
CREATE POLICY IF NOT EXISTS "Agents can view their own metrics"
  ON agent_performance_metrics
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

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

-- Create index on agent_id
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);

-- Create index on property_id
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

-- Enable RLS on agent_property_assignments
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their property assignments
CREATE POLICY IF NOT EXISTS "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Create earnings table if it doesn't exist
CREATE TABLE IF NOT EXISTS earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  total_commission numeric DEFAULT 0,
  total_bookings integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

-- Create index on agent_id
CREATE INDEX IF NOT EXISTS idx_earnings_agent_id ON earnings(agent_id);

-- Enable RLS on earnings
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own earnings
CREATE POLICY IF NOT EXISTS "Agents can view their own earnings"
  ON earnings
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Function to update agent metrics when assignment status changes
CREATE OR REPLACE FUNCTION update_agent_metrics_on_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  current_month integer;
  current_year integer;
  conversion_rate numeric;
BEGIN
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Insert or update metrics for the current month
  INSERT INTO agent_performance_metrics (
    agent_id, month, year, 
    total_assignments, accepted_assignments, declined_assignments, expired_assignments
  )
  VALUES (
    NEW.agent_id, current_month, current_year,
    1, CASE WHEN NEW.status = 'accepted' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'declined' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'expired' THEN 1 ELSE 0 END
  )
  ON CONFLICT (agent_id, month, year) DO UPDATE SET
    total_assignments = agent_performance_metrics.total_assignments + 
      CASE WHEN OLD.status IS NULL THEN 1 ELSE 0 END,
    accepted_assignments = agent_performance_metrics.accepted_assignments + 
      CASE WHEN NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN 1
           WHEN OLD.status = 'accepted' AND NEW.status != 'accepted' THEN -1
           ELSE 0 END,
    declined_assignments = agent_performance_metrics.declined_assignments + 
      CASE WHEN NEW.status = 'declined' AND (OLD.status IS NULL OR OLD.status != 'declined') THEN 1
           WHEN OLD.status = 'declined' AND NEW.status != 'declined' THEN -1
           ELSE 0 END,
    expired_assignments = agent_performance_metrics.expired_assignments + 
      CASE WHEN NEW.status = 'expired' AND (OLD.status IS NULL OR OLD.status != 'expired') THEN 1
           WHEN OLD.status = 'expired' AND NEW.status != 'expired' THEN -1
           ELSE 0 END,
    updated_at = now();
    
  -- Calculate and update conversion rate
  UPDATE agent_performance_metrics
  SET 
    conversion_rate = 
      CASE 
        WHEN total_assignments > 0 THEN 
          (accepted_assignments::numeric / total_assignments::numeric) * 100
        ELSE 0
      END,
    updated_at = now()
  WHERE agent_id = NEW.agent_id AND month = current_month AND year = current_year;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agent_inquiry_assignments if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'agent_metrics_update_trigger'
  ) THEN
    CREATE TRIGGER agent_metrics_update_trigger
    AFTER INSERT OR UPDATE OF status ON agent_inquiry_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_agent_metrics_on_assignment_change();
  END IF;
END $$;

-- Insert sample data for testing
INSERT INTO agent_profiles (user_id, license_number, experience_years, specialization, bio, education_background)
SELECT 
  id, 
  'AG-' || floor(random() * 100000)::text, 
  floor(random() * 10 + 1)::integer, 
  CASE floor(random() * 4)::integer
    WHEN 0 THEN 'Residential'
    WHEN 1 THEN 'Commercial'
    WHEN 2 THEN 'Luxury'
    WHEN 3 THEN 'Investment'
  END,
  'Experienced real estate agent specializing in helping clients find their dream homes.',
  CASE floor(random() * 3)::integer
    WHEN 0 THEN 'Bachelor of Commerce, University of Delhi'
    WHEN 1 THEN 'MBA in Real Estate, Symbiosis Institute'
    WHEN 2 THEN 'Bachelor of Arts, Andhra University'
  END
FROM users
WHERE user_type = 'agent'
AND NOT EXISTS (
  SELECT 1 FROM agent_profiles WHERE agent_profiles.user_id = users.id
)
LIMIT 10;