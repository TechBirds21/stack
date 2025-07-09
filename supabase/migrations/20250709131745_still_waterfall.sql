/*
  # Fix email verification token INSERT policy

  1. Security Changes
    - Add INSERT policy for `email_verification_tokens` table
    - Allow authenticated users to create verification tokens for themselves
    - Ensure RLS is properly configured for the verification flow

  This migration fixes the RLS policy violation that prevents the `send_email_verification` 
  RPC function from creating new verification tokens.
*/

-- Add INSERT policy for email_verification_tokens table
CREATE POLICY "Users can create their own verification tokens"
  ON email_verification_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());