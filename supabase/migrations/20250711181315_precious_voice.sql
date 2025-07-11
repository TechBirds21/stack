/*
  # Agent Dashboard Improvements

  1. New Tables
    - `agent_profiles` - Stores agent-specific information
    - `agent_performance_metrics` - Tracks agent performance over time
    
  2. Security
    - Enable RLS on all tables
    - Add policies for agents to view their own data
    
  3. Functions
    - `calculate_agent_metrics` - Calculates agent performance metrics
    - `update_agent_assignment_status` - Updates assignment status
*/

-- Create agent_profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  working_hours jsonb DEFAULT '{"start": "09:00", "end": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri"]}'::jsonb,
  notification_preferences jsonb DEFAULT '{"email": true, "sms": true, "in_app": true}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agent_performance_metrics table
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

-- Create agent_property_assignments table
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

-- Add agent_id column to properties table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'properties' AND column_name = 'agent_id'
  ) THEN
    ALTER TABLE properties ADD COLUMN agent_id uuid REFERENCES users(id);
    CREATE INDEX idx_properties_agent_id ON properties(agent_id);
  END IF;
END $$;

-- Function to calculate agent metrics
CREATE OR REPLACE FUNCTION calculate_agent_metrics(agent_id_param uuid, month_param integer, year_param integer)
RETURNS void AS $$
DECLARE
  total_assignments_count integer;
  accepted_assignments_count integer;
  declined_assignments_count integer;
  expired_assignments_count integer;
  conversion_rate_value numeric;
  response_time_avg numeric;
  customer_rating_avg numeric;
  total_earnings_value numeric;
BEGIN
  -- Count assignments
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'declined'),
    COUNT(*) FILTER (WHERE status = 'expired')
  INTO 
    total_assignments_count,
    accepted_assignments_count,
    declined_assignments_count,
    expired_assignments_count
  FROM agent_inquiry_assignments
  WHERE 
    agent_id = agent_id_param AND
    EXTRACT(MONTH FROM assigned_at) = month_param AND
    EXTRACT(YEAR FROM assigned_at) = year_param;
  
  -- Calculate conversion rate
  IF total_assignments_count > 0 THEN
    conversion_rate_value := (accepted_assignments_count::numeric / total_assignments_count) * 100;
  ELSE
    conversion_rate_value := 0;
  END IF;
  
  -- Calculate response time (in minutes)
  SELECT 
    AVG(EXTRACT(EPOCH FROM (responded_at - assigned_at)) / 60)
  INTO 
    response_time_avg
  FROM agent_inquiry_assignments
  WHERE 
    agent_id = agent_id_param AND
    responded_at IS NOT NULL AND
    EXTRACT(MONTH FROM assigned_at) = month_param AND
    EXTRACT(YEAR FROM assigned_at) = year_param;
  
  -- Calculate customer rating (mock data for now)
  customer_rating_avg := 4.5;
  
  -- Calculate total earnings (mock calculation)
  total_earnings_value := accepted_assignments_count * 15000;
  
  -- Insert or update metrics
  INSERT INTO agent_performance_metrics (
    agent_id, month, year, 
    total_assignments, accepted_assignments, declined_assignments, expired_assignments,
    conversion_rate, response_time_minutes, customer_rating, total_earnings
  ) VALUES (
    agent_id_param, month_param, year_param,
    total_assignments_count, accepted_assignments_count, declined_assignments_count, expired_assignments_count,
    conversion_rate_value, COALESCE(response_time_avg, 0), customer_rating_avg, total_earnings_value
  )
  ON CONFLICT (agent_id, month, year) DO UPDATE SET
    total_assignments = EXCLUDED.total_assignments,
    accepted_assignments = EXCLUDED.accepted_assignments,
    declined_assignments = EXCLUDED.declined_assignments,
    expired_assignments = EXCLUDED.expired_assignments,
    conversion_rate = EXCLUDED.conversion_rate,
    response_time_minutes = EXCLUDED.response_time_minutes,
    customer_rating = EXCLUDED.customer_rating,
    total_earnings = EXCLUDED.total_earnings,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Function to update assignment status
CREATE OR REPLACE FUNCTION update_agent_assignment_status(assignment_id_param uuid, new_status text, notes_param text DEFAULT NULL)
RETURNS boolean AS $$
DECLARE
  inquiry_id_value uuid;
BEGIN
  -- Update assignment status
  UPDATE agent_inquiry_assignments
  SET 
    status = new_status,
    responded_at = now(),
    notes = COALESCE(notes_param, notes)
  WHERE id = assignment_id_param
  RETURNING inquiry_id INTO inquiry_id_value;
  
  -- Update inquiry if assignment was accepted
  IF new_status = 'accepted' AND inquiry_id_value IS NOT NULL THEN
    UPDATE inquiries
    SET status = 'responded'
    WHERE id = inquiry_id_value;
    
    -- Create notification
    INSERT INTO notifications (
      title, 
      message, 
      type, 
      entity_type, 
      entity_id
    ) VALUES (
      'Assignment Accepted',
      'An agent has accepted the inquiry assignment',
      'inquiry',
      'inquiry',
      inquiry_id_value
    );
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update metrics when assignment status changes
CREATE OR REPLACE FUNCTION update_agent_metrics_on_assignment_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_agent_metrics(
    NEW.agent_id,
    EXTRACT(MONTH FROM NEW.assigned_at)::integer,
    EXTRACT(YEAR FROM NEW.assigned_at)::integer
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS agent_metrics_update_trigger ON agent_inquiry_assignments;
CREATE TRIGGER agent_metrics_update_trigger
AFTER INSERT OR UPDATE OF status ON agent_inquiry_assignments
FOR EACH ROW
EXECUTE FUNCTION update_agent_metrics_on_assignment_change();

-- Enable RLS on agent tables
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_property_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies
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

CREATE POLICY "Agents can view their own metrics"
  ON agent_performance_metrics
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "Agents can view their property assignments"
  ON agent_property_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_profiles_user_id ON agent_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_agent_id ON agent_performance_metrics(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_metrics_month_year ON agent_performance_metrics(month, year);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_agent_id ON agent_property_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id ON agent_property_assignments(property_id);