/*
  # Agent Dashboard Fixes

  1. New Tables
    - `agent_profiles` - Stores agent-specific information
    - `agent_performance_metrics` - Tracks agent performance metrics
  
  2. Security
    - Enable RLS on new tables
    - Add policies for agents to view their own data
*/

-- Create agent_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  working_hours jsonb DEFAULT '{"start": "09:00", "end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]}',
  notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "in_app": true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);

-- Enable RLS on agent_profiles
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own profiles
CREATE POLICY "Agents can view their own profiles"
  ON agent_profiles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy for agents to update their own profiles
CREATE POLICY "Agents can update their own profiles"
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

-- Create indexes for agent_performance_metrics
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_month_year ON agent_performance_metrics(month, year);

-- Enable RLS on agent_performance_metrics
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own metrics
CREATE POLICY "Agents can view their own metrics"
  ON agent_performance_metrics
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Function to update agent metrics when assignment status changes
CREATE OR REPLACE FUNCTION update_agent_metrics_on_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  current_month integer;
  current_year integer;
  total_count integer;
  accepted_count integer;
  declined_count integer;
  expired_count integer;
  conversion numeric;
BEGIN
  -- Get current month and year
  current_month := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Count assignments by status
  SELECT COUNT(*) INTO total_count
  FROM agent_inquiry_assignments
  WHERE agent_id = NEW.agent_id
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  SELECT COUNT(*) INTO accepted_count
  FROM agent_inquiry_assignments
  WHERE agent_id = NEW.agent_id
  AND status = 'accepted'
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  SELECT COUNT(*) INTO declined_count
  FROM agent_inquiry_assignments
  WHERE agent_id = NEW.agent_id
  AND status = 'declined'
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  SELECT COUNT(*) INTO expired_count
  FROM agent_inquiry_assignments
  WHERE agent_id = NEW.agent_id
  AND status = 'expired'
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Calculate conversion rate
  IF total_count > 0 THEN
    conversion := (accepted_count::numeric / total_count::numeric) * 100;
  ELSE
    conversion := 0;
  END IF;
  
  -- Update or insert metrics
  INSERT INTO agent_performance_metrics (
    agent_id, 
    month, 
    year, 
    total_assignments, 
    accepted_assignments, 
    declined_assignments, 
    expired_assignments,
    conversion_rate,
    updated_at
  )
  VALUES (
    NEW.agent_id,
    current_month,
    current_year,
    total_count,
    accepted_count,
    declined_count,
    expired_count,
    conversion,
    now()
  )
  ON CONFLICT (agent_id, month, year) 
  DO UPDATE SET
    total_assignments = EXCLUDED.total_assignments,
    accepted_assignments = EXCLUDED.accepted_assignments,
    declined_assignments = EXCLUDED.declined_assignments,
    expired_assignments = EXCLUDED.expired_assignments,
    conversion_rate = EXCLUDED.conversion_rate,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agent_inquiry_assignments
DROP TRIGGER IF EXISTS agent_metrics_update_trigger ON agent_inquiry_assignments;
CREATE TRIGGER agent_metrics_update_trigger
AFTER INSERT OR UPDATE OF status ON agent_inquiry_assignments
FOR EACH ROW
EXECUTE FUNCTION update_agent_metrics_on_assignment_change();

-- Create agent_property_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_property_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  assigned_at timestamptz DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, property_id)
);

-- Create indexes for agent_property_assignments
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);

-- Enable RLS on agent_property_assignments
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their property assignments
CREATE POLICY "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Insert sample data for testing
DO $$
DECLARE
  agent_user_id uuid;
BEGIN
  -- Get an agent user ID
  SELECT id INTO agent_user_id FROM users WHERE user_type = 'agent' LIMIT 1;
  
  -- If we found an agent, create a profile
  IF agent_user_id IS NOT NULL THEN
    -- Create agent profile if it doesn't exist
    INSERT INTO agent_profiles (
      user_id,
      license_number,
      experience_years,
      specialization,
      bio
    )
    VALUES (
      agent_user_id,
      'AG-' || floor(random() * 100000)::text,
      floor(random() * 10 + 1)::integer,
      (ARRAY['Residential', 'Commercial', 'Luxury', 'Investment'])[floor(random() * 4 + 1)],
      'Experienced real estate agent with a passion for helping clients find their dream homes.'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Create performance metrics for current month
    INSERT INTO agent_performance_metrics (
      agent_id,
      month,
      year,
      total_assignments,
      accepted_assignments,
      declined_assignments,
      conversion_rate,
      response_time_minutes,
      customer_rating
    )
    VALUES (
      agent_user_id,
      EXTRACT(MONTH FROM CURRENT_DATE),
      EXTRACT(YEAR FROM CURRENT_DATE),
      floor(random() * 20)::integer,
      floor(random() * 15)::integer,
      floor(random() * 5)::integer,
      random() * 100,
      random() * 60,
      3.5 + random() * 1.5
    )
    ON CONFLICT (agent_id, month, year) DO NOTHING;
  END IF;
END $$;