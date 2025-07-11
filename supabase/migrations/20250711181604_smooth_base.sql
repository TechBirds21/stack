/*
  # Cleanup Database

  1. Removes unused tables and columns
  2. Adds indexes for better performance
  3. Adds constraints for data integrity
  4. Updates triggers for better notifications
*/

-- Remove unused columns from agent_profiles
ALTER TABLE IF EXISTS agent_profiles 
DROP COLUMN IF EXISTS unused_column1,
DROP COLUMN IF EXISTS unused_column2;

-- Add index for agent_id on agent_inquiry_assignments for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_inquiry_assignments_agent_id 
ON agent_inquiry_assignments(agent_id);

-- Add index for property_id on agent_property_assignments for faster lookups
CREATE INDEX IF NOT EXISTS idx_agent_property_assignments_property_id 
ON agent_property_assignments(property_id);

-- Add constraint for agent_inquiry_assignments status
ALTER TABLE IF EXISTS agent_inquiry_assignments
DROP CONSTRAINT IF EXISTS agent_inquiry_assignments_status_check;

ALTER TABLE IF EXISTS agent_inquiry_assignments
ADD CONSTRAINT agent_inquiry_assignments_status_check
CHECK (status IN ('pending', 'accepted', 'declined', 'expired'));

-- Add constraint for agent_property_assignments status
ALTER TABLE IF EXISTS agent_property_assignments
DROP CONSTRAINT IF EXISTS agent_property_assignments_status_check;

ALTER TABLE IF EXISTS agent_property_assignments
ADD CONSTRAINT agent_property_assignments_status_check
CHECK (status IN ('active', 'inactive', 'completed'));

-- Create or replace function to update agent metrics when assignment status changes
CREATE OR REPLACE FUNCTION update_agent_metrics_on_assignment_change()
RETURNS TRIGGER AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM CURRENT_DATE);
  current_year INTEGER := EXTRACT(YEAR FROM CURRENT_DATE);
  response_time_minutes NUMERIC := 0;
BEGIN
  -- Calculate response time if responded_at is set
  IF NEW.responded_at IS NOT NULL AND NEW.assigned_at IS NOT NULL THEN
    response_time_minutes := EXTRACT(EPOCH FROM (NEW.responded_at - NEW.assigned_at)) / 60;
  END IF;

  -- Insert or update agent metrics
  INSERT INTO agent_performance_metrics (
    agent_id, 
    month, 
    year, 
    total_assignments,
    accepted_assignments,
    declined_assignments,
    expired_assignments,
    response_time_minutes
  )
  VALUES (
    NEW.agent_id,
    current_month,
    current_year,
    1,
    CASE WHEN NEW.status = 'accepted' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'declined' THEN 1 ELSE 0 END,
    CASE WHEN NEW.status = 'expired' THEN 1 ELSE 0 END,
    response_time_minutes
  )
  ON CONFLICT (agent_id, month, year) 
  DO UPDATE SET
    total_assignments = agent_performance_metrics.total_assignments + 1,
    accepted_assignments = agent_performance_metrics.accepted_assignments + 
      CASE WHEN NEW.status = 'accepted' THEN 1 ELSE 0 END,
    declined_assignments = agent_performance_metrics.declined_assignments + 
      CASE WHEN NEW.status = 'declined' THEN 1 ELSE 0 END,
    expired_assignments = agent_performance_metrics.expired_assignments + 
      CASE WHEN NEW.status = 'expired' THEN 1 ELSE 0 END,
    response_time_minutes = 
      CASE 
        WHEN agent_performance_metrics.total_assignments = 0 THEN response_time_minutes
        ELSE (agent_performance_metrics.response_time_minutes * agent_performance_metrics.total_assignments + response_time_minutes) / 
             (agent_performance_metrics.total_assignments + 1)
      END,
    updated_at = CURRENT_TIMESTAMP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a function to expire pending assignments
CREATE OR REPLACE FUNCTION expire_pending_assignments()
RETURNS void AS $$
BEGIN
  UPDATE agent_inquiry_assignments
  SET status = 'expired'
  WHERE status = 'pending'
  AND expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to run the expire_pending_assignments function every hour
SELECT cron.schedule(
  'expire-pending-assignments',
  '0 * * * *', -- Run every hour
  $$SELECT expire_pending_assignments()$$
);