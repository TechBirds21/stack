/*
  # Agent Dashboard Improvements

  1. New Tables
    - `agent_profiles` - Stores agent-specific information
    - `agent_performance_metrics` - Tracks agent performance over time
  
  2. Security
    - Enable RLS on new tables
    - Add policies for agents to view their own data
  
  3. Functions
    - Add function to respond to assignments
    - Add function to calculate agent metrics
*/

-- Create agent profiles table
CREATE TABLE IF NOT EXISTS agent_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  license_number text,
  experience_years integer DEFAULT 0,
  specialization text,
  bio text,
  areas_served text[],
  languages text[],
  rating numeric DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_rentals integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on agent_profiles
ALTER TABLE agent_profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own profile
CREATE POLICY "Agents can view their own profile"
  ON agent_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policy for agents to update their own profile
CREATE POLICY "Agents can update their own profile"
  ON agent_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create agent performance metrics table
CREATE TABLE IF NOT EXISTS agent_performance_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  month integer NOT NULL,
  year integer NOT NULL,
  inquiries_assigned integer DEFAULT 0,
  inquiries_accepted integer DEFAULT 0,
  inquiries_declined integer DEFAULT 0,
  inquiries_expired integer DEFAULT 0,
  bookings_handled integer DEFAULT 0,
  response_time_avg_minutes integer DEFAULT 0,
  customer_rating numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(agent_id, month, year)
);

-- Enable RLS on agent_performance_metrics
ALTER TABLE agent_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for agents to view their own metrics
CREATE POLICY "Agents can view their own metrics"
  ON agent_performance_metrics
  FOR SELECT
  TO authenticated
  USING (auth.uid() = agent_id);

-- Create function to respond to assignment
CREATE OR REPLACE FUNCTION respond_to_assignment(
  assignment_id_param uuid,
  response_param text,
  notes_param text DEFAULT NULL
) RETURNS jsonb AS $$
DECLARE
  assignment_record agent_inquiry_assignments;
  inquiry_id_var uuid;
  result jsonb;
BEGIN
  -- Get the assignment
  SELECT * INTO assignment_record
  FROM agent_inquiry_assignments
  WHERE id = assignment_id_param;
  
  -- Check if assignment exists
  IF assignment_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Assignment not found'
    );
  END IF;
  
  -- Check if assignment is already responded to
  IF assignment_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Assignment has already been ' || assignment_record.status
    );
  END IF;
  
  -- Check if assignment is expired
  IF assignment_record.expires_at < now() THEN
    UPDATE agent_inquiry_assignments
    SET status = 'expired'
    WHERE id = assignment_id_param;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Assignment has expired'
    );
  END IF;
  
  -- Update assignment
  UPDATE agent_inquiry_assignments
  SET 
    status = response_param,
    responded_at = now(),
    notes = COALESCE(notes_param, notes)
  WHERE id = assignment_id_param
  RETURNING inquiries.id INTO inquiry_id_var;
  
  -- If accepted, update inquiry status
  IF response_param = 'accepted' THEN
    UPDATE inquiries
    SET status = 'responded'
    WHERE id = inquiry_id_var;
    
    -- Create notification
    INSERT INTO notifications (
      title,
      message,
      type,
      entity_type,
      entity_id
    ) VALUES (
      'Assignment Accepted',
      'An agent has accepted your inquiry',
      'inquiry',
      'inquiry',
      inquiry_id_var
    );
  END IF;
  
  -- Return success
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Assignment ' || response_param || ' successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to calculate agent metrics
CREATE OR REPLACE FUNCTION calculate_agent_metrics(agent_id_param uuid) RETURNS void AS $$
DECLARE
  current_month integer := EXTRACT(MONTH FROM CURRENT_DATE)::integer;
  current_year integer := EXTRACT(YEAR FROM CURRENT_DATE)::integer;
  inquiries_assigned_count integer;
  inquiries_accepted_count integer;
  inquiries_declined_count integer;
  inquiries_expired_count integer;
  bookings_handled_count integer;
  response_time_avg integer;
BEGIN
  -- Count assigned inquiries
  SELECT COUNT(*) INTO inquiries_assigned_count
  FROM agent_inquiry_assignments
  WHERE agent_id = agent_id_param
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Count accepted inquiries
  SELECT COUNT(*) INTO inquiries_accepted_count
  FROM agent_inquiry_assignments
  WHERE agent_id = agent_id_param
  AND status = 'accepted'
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Count declined inquiries
  SELECT COUNT(*) INTO inquiries_declined_count
  FROM agent_inquiry_assignments
  WHERE agent_id = agent_id_param
  AND status = 'declined'
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Count expired inquiries
  SELECT COUNT(*) INTO inquiries_expired_count
  FROM agent_inquiry_assignments
  WHERE agent_id = agent_id_param
  AND status = 'expired'
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Count bookings handled
  SELECT COUNT(*) INTO bookings_handled_count
  FROM bookings
  WHERE agent_id = agent_id_param
  AND EXTRACT(MONTH FROM created_at) = current_month
  AND EXTRACT(YEAR FROM created_at) = current_year;
  
  -- Calculate average response time
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (responded_at - assigned_at)) / 60)::integer, 0) INTO response_time_avg
  FROM agent_inquiry_assignments
  WHERE agent_id = agent_id_param
  AND responded_at IS NOT NULL
  AND EXTRACT(MONTH FROM assigned_at) = current_month
  AND EXTRACT(YEAR FROM assigned_at) = current_year;
  
  -- Insert or update metrics
  INSERT INTO agent_performance_metrics (
    agent_id,
    month,
    year,
    inquiries_assigned,
    inquiries_accepted,
    inquiries_declined,
    inquiries_expired,
    bookings_handled,
    response_time_avg_minutes
  ) VALUES (
    agent_id_param,
    current_month,
    current_year,
    inquiries_assigned_count,
    inquiries_accepted_count,
    inquiries_declined_count,
    inquiries_expired_count,
    bookings_handled_count,
    response_time_avg
  )
  ON CONFLICT (agent_id, month, year) DO UPDATE SET
    inquiries_assigned = EXCLUDED.inquiries_assigned,
    inquiries_accepted = EXCLUDED.inquiries_accepted,
    inquiries_declined = EXCLUDED.inquiries_declined,
    inquiries_expired = EXCLUDED.inquiries_expired,
    bookings_handled = EXCLUDED.bookings_handled,
    response_time_avg_minutes = EXCLUDED.response_time_avg_minutes,
    updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to update metrics when assignments change
CREATE OR REPLACE FUNCTION update_agent_metrics() RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_agent_metrics(NEW.agent_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on agent_inquiry_assignments
DROP TRIGGER IF EXISTS agent_metrics_update_trigger ON agent_inquiry_assignments;
CREATE TRIGGER agent_metrics_update_trigger
AFTER INSERT OR UPDATE ON agent_inquiry_assignments
FOR EACH ROW
EXECUTE FUNCTION update_agent_metrics();

-- Create trigger on bookings
DROP TRIGGER IF EXISTS agent_bookings_update_trigger ON bookings;
CREATE TRIGGER agent_bookings_update_trigger
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
WHEN (NEW.agent_id IS NOT NULL)
EXECUTE FUNCTION update_agent_metrics();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_agent_inquiry_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_inquiry_assignments_status ON agent_inquiry_assignments(status);
CREATE INDEX IF NOT EXISTS idx_bookings_agent_id ON bookings(agent_id);