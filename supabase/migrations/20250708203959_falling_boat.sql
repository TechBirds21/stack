/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `message` (text, not null)
      - `type` (text, not null)
      - `entity_type` (text, nullable)
      - `entity_id` (uuid, nullable)
      - `read` (boolean, default false)
      - `created_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `notifications` table
    - Add policies for admin access and system insertion

  3. Performance
    - Add index on type and created_at for better query performance
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admin can view all notifications" ON notifications;
DROP POLICY IF EXISTS "Admin can update notifications" ON notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  entity_type text,
  entity_id uuid,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications USING btree (type, created_at);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy for admins to view all notifications
CREATE POLICY "Admin can view all notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Policy for admins to update notifications (mark as read)
CREATE POLICY "Admin can update notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() AND users.user_type = 'admin'
    )
  );

-- Policy for system to insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert sample notifications only if table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM notifications LIMIT 1) THEN
    INSERT INTO notifications (title, message, type, entity_type, read) VALUES
    ('Welcome to Admin Dashboard', 'System initialized successfully', 'system', 'system', false),
    ('New User Registration', 'A new user has registered on the platform', 'user_registration', 'user', false),
    ('Property Inquiry', 'New inquiry received for a property', 'inquiry', 'property', false);
  END IF;
END $$;