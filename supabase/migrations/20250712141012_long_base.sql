/*
  # Fix notifications foreign key constraint

  1. Changes
    - Drop existing foreign key constraint on notifications table
    - Add new foreign key constraint with CASCADE delete
    - This allows users to be deleted without foreign key violations

  2. Security
    - Maintains existing RLS policies
    - No changes to data access permissions
*/

-- Drop the existing foreign key constraint
ALTER TABLE notifications
DROP CONSTRAINT IF EXISTS notifications_user_id_fkey;

-- Add the new foreign key constraint with CASCADE delete
ALTER TABLE notifications
ADD CONSTRAINT notifications_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;