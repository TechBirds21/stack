/*
  # Fix inquiry policies and agent assignments

  1. Security Updates
    - Update inquiry policies to allow public access for creating inquiries
    - Fix agent assignment policies
    - Ensure proper RLS configuration

  2. Policy Changes
    - Allow anonymous users to create inquiries
    - Allow authenticated users to view their own inquiries
    - Allow property owners to view inquiries for their properties
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can create inquiries" ON inquiries;
DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
DROP POLICY IF EXISTS "Property owners can view inquiries for their properties" ON inquiries;
DROP POLICY IF EXISTS "Authenticated users can create inquiries" ON inquiries;

-- Create new policies for inquiries
CREATE POLICY "Anyone can create inquiries"
  ON inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can view their own inquiries"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view inquiries for their properties"
  ON inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = inquiries.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Fix agent inquiry assignments policies
DROP POLICY IF EXISTS "system_can_insert_agent_assignments" ON agent_inquiry_assignments;
DROP POLICY IF EXISTS "System can insert agent assignments" ON agent_inquiry_assignments;

CREATE POLICY "System can create agent assignments"
  ON agent_inquiry_assignments
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Ensure RLS is enabled
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_inquiry_assignments ENABLE ROW LEVEL SECURITY;

-- Update inquiry trigger function to handle anonymous users
CREATE OR REPLACE FUNCTION enhanced_inquiry_notification()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for property owner
  INSERT INTO notifications (
    title,
    message,
    type,
    entity_type,
    entity_id
  ) VALUES (
    'New Property Inquiry',
    'You have received a new inquiry for your property: ' || 
    COALESCE((SELECT title FROM properties WHERE id = NEW.property_id), 'Unknown Property'),
    'inquiry',
    'inquiry',
    NEW.id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;