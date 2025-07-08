/*
  # Fix RLS policy for agent inquiry assignments

  1. Security Changes
    - Add INSERT policy for agent_inquiry_assignments table to allow system/triggers to create assignments
    - This enables automatic agent assignment when inquiries are created

  2. Changes Made
    - Create policy to allow authenticated users (system) to insert agent assignments
    - This supports the inquiry notification system that assigns agents to new inquiries
*/

-- Allow system to insert agent assignments when inquiries are created
CREATE POLICY "system_can_insert_agent_assignments"
  ON agent_inquiry_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);