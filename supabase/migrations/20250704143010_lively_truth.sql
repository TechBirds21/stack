/*
  # Create seller profiles table for seller verification

  1. New Tables
    - `seller_profiles` - Seller verification and business information
  
  2. Security
    - Enable RLS on seller_profiles table
    - Add policies for sellers and admins
*/

-- Create seller_profiles table
CREATE TABLE IF NOT EXISTS seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) NOT NULL,
  business_name text NOT NULL,
  business_type text NOT NULL,
  experience_years integer NOT NULL,
  license_number text,
  pan_number text NOT NULL,
  gst_number text,
  address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  bank_account text NOT NULL,
  ifsc_code text NOT NULL,
  documents jsonb DEFAULT '{}',
  verification_status text DEFAULT 'pending',
  verification_reason text,
  verified_at timestamptz,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE seller_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for seller_profiles table
CREATE POLICY "Users can view their own seller profile"
  ON seller_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own seller profile"
  ON seller_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own seller profile"
  ON seller_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create storage bucket for seller documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Users can upload their own documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);