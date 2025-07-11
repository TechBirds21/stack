/*
  # Agent Dashboard Improvements

  1. New Tables
    - `agent_profiles` - Stores agent-specific information
    - `agent_performance_metrics` - Tracks agent performance metrics
  
  2. Changes
    - Added education_background field to agent_profiles
    - Added specialization field to agent_profiles
    - Added bio field to agent_profiles
    - Added notification_preferences to agent_profiles
  
  3. Security
    - Added RLS policies for agent_profiles
    - Added RLS policies for agent_performance_metrics
*/

-- Create agent_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  education_background text,
  bio text,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "in_app": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index on user_id for faster lookups
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

-- Create indexes for faster lookups
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
  
  -- Count assignments for this agent in current month
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'declined'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO 
    total_count,
    accepted_count,
    declined_count,
    expired_count
  FROM agent_inquiry_assignments
  WHERE 
    agent_id = NEW.agent_id AND
    EXTRACT(MONTH FROM assigned_at) = current_month AND
    EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Calculate conversion rate
  IF total_count > 0 THEN
    conversion := (accepted_count::numeric / total_count) * 100;
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
  ) VALUES (
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
    total_assignments = total_count,
    accepted_assignments = accepted_count,
    declined_assignments = declined_count,
    expired_assignments = expired_count,
    conversion_rate = conversion,
    updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for agent_inquiry_assignments
DROP TRIGGER IF EXISTS agent_metrics_update_trigger ON agent_inquiry_assignments;
CREATE TRIGGER agent_metrics_update_trigger
AFTER INSERT OR UPDATE OF status ON agent_inquiry_assignments
FOR EACH ROW
EXECUTE FUNCTION update_agent_metrics_on_assignment_change();

-- Insert sample data for testing
INSERT INTO agent_profiles (
  user_id,
  license_number,
  experience_years,
  specialization,
  education_background,
  bio
)
SELECT 
  id,
  agent_license_number,
  FLOOR(RANDOM() * 10 + 1)::integer,
  CASE FLOOR(RANDOM() * 4)::integer
    WHEN 0 THEN 'Residential'
    WHEN 1 THEN 'Commercial'
    WHEN 2 THEN 'Luxury'
    WHEN 3 THEN 'Investment'
  END,
  CASE FLOOR(RANDOM() * 3)::integer
    WHEN 0 THEN 'B.Com in Real Estate'
    WHEN 1 THEN 'MBA in Property Management'
    WHEN 2 THEN 'Diploma in Real Estate'
  END,
  'Experienced real estate professional dedicated to helping clients find their perfect property.'
FROM users
WHERE 
  user_type = 'agent' AND
  NOT EXISTS (SELECT 1 FROM agent_profiles WHERE agent_profiles.user_id = users.id)
LIMIT 10;