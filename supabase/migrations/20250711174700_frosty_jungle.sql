/*
  # Add agent assignment tables and functions

  1. New Tables
    - `agent_inquiry_assignments` - Tracks agent assignments to inquiries
  
  2. Functions
    - `respond_to_assignment` - Function for agents to accept or decline assignments
  
  3. Security
    - Enable RLS on all tables
    - Add policies for proper access control
*/

-- Create agent_inquiry_assignments table if it doesn't exist
CREATE TABLE IF NOT EXISTS agent_inquiry_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id uuid REFERENCES inquiries(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  responded_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  notes text,
  UNIQUE(inquiry_id, agent_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_assignments_agent_id ON agent_inquiry_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_inquiry_id ON agent_inquiry_assignments(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_agent_assignments_status ON agent_inquiry_assignments(status);

-- Enable RLS
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for agent_inquiry_assignments
CREATE POLICY "System can create agent assignments" 
  ON agent_inquiry_assignments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "admin_assignments_all_policy" 
  ON agent_inquiry_assignments
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid() AND users.user_type = 'admin'
  ));

CREATE POLICY "agent_assignments_select_policy" 
  ON agent_inquiry_assignments
  FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());

CREATE POLICY "agent_assignments_update_policy" 
  ON agent_inquiry_assignments
  FOR UPDATE
  TO authenticated
  USING (agent_id = auth.uid());

-- Create function for agents to respond to assignments
CREATE OR REPLACE FUNCTION respond_to_assignment(
  assignment_id_param UUID,
  response_param TEXT,
  notes_param TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  assignment_record agent_inquiry_assignments;
  inquiry_record inquiries;
  result JSONB;
BEGIN
  -- Check if assignment exists and belongs to the current user
  SELECT * INTO assignment_record
  FROM agent_inquiry_assignments
  WHERE id = assignment_id_param AND agent_id = auth.uid();
  
  IF assignment_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Assignment not found or you are not authorized to respond to it'
    );
  END IF;
  
  -- Check if assignment is still pending
  IF assignment_record.status != 'pending' THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'This assignment has already been ' || assignment_record.status
    );
  END IF;
  
  -- Check if assignment has expired
  IF assignment_record.expires_at < now() THEN
    UPDATE agent_inquiry_assignments
    SET status = 'expired'
    WHERE id = assignment_id_param;
    
    RETURN jsonb_build_object(
      'success', false,
      'message', 'This assignment has expired'
    );
  END IF;
  
  -- Update assignment status
  UPDATE agent_inquiry_assignments
  SET 
    status = response_param,
    responded_at = now(),
    notes = COALESCE(notes_param, notes)
  WHERE id = assignment_id_param;
  
  -- If accepted, update the inquiry with the agent ID
  IF response_param = 'accepted' THEN
    SELECT * INTO inquiry_record
    FROM inquiries
    WHERE id = assignment_record.inquiry_id;
    
    UPDATE inquiries
    SET assigned_agent_id = assignment_record.agent_id
    WHERE id = assignment_record.inquiry_id;
    
    -- Create notification for the property owner
    IF inquiry_record.property_id IS NOT NULL THEN
      INSERT INTO notifications (
        title,
        message,
        type,
        entity_type,
        entity_id
      )
      VALUES (
        'Agent Accepted Inquiry',
        'An agent has accepted the inquiry for your property',
        'inquiry_accepted',
        'inquiry',
        inquiry_record.id
      );
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Assignment ' || response_param || ' successfully'
  );
END;
$$;