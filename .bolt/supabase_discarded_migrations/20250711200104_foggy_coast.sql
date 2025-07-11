/*
  # Fix Storage Policies

  1. New Storage Buckets
    - Create 'images' bucket if it doesn't exist
    - Create 'property-images' bucket if it doesn't exist
    - Create 'documents' bucket if it doesn't exist
  
  2. Security
    - Enable public access for images
    - Set proper RLS policies for all buckets
    - Allow authenticated users to upload files
    - Allow public to view images
*/

-- Create buckets if they don't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('images', 'images', true)
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO storage.buckets (id, name, public)
  VALUES ('property-images', 'property-images', true)
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('documents', 'documents', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies to avoid conflicts
DO $$
BEGIN
  -- Drop policies for images bucket
  BEGIN
    DELETE FROM storage.policies WHERE bucket_id = 'images';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies for images bucket: %', SQLERRM;
  END;
  
  -- Drop policies for property-images bucket
  BEGIN
    DELETE FROM storage.policies WHERE bucket_id = 'property-images';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies for property-images bucket: %', SQLERRM;
  END;
  
  -- Drop policies for documents bucket
  BEGIN
    DELETE FROM storage.policies WHERE bucket_id = 'documents';
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error dropping policies for documents bucket: %', SQLERRM;
  END;
END $$;

-- Create policies for images bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Public Read', 'images', '{"name":"Public Read","definition":{"allow_download":true,"allow_upload":false,"allow_delete":false},"resources":["*"],"operations":["read"],"role":"public"}'),
  ('Auth Upload', 'images', '{"name":"Auth Upload","definition":{"allow_download":true,"allow_upload":true,"allow_delete":true},"resources":["*"],"operations":["read","write","delete"],"role":"authenticated"}'),
  ('Admin All', 'images', '{"name":"Admin All","definition":{"allow_download":true,"allow_upload":true,"allow_delete":true},"resources":["*"],"operations":["read","write","delete"],"role":"service_role"}');

-- Create policies for property-images bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Public Read', 'property-images', '{"name":"Public Read","definition":{"allow_download":true,"allow_upload":false,"allow_delete":false},"resources":["*"],"operations":["read"],"role":"public"}'),
  ('Auth Upload', 'property-images', '{"name":"Auth Upload","definition":{"allow_download":true,"allow_upload":true,"allow_delete":true},"resources":["*"],"operations":["read","write","delete"],"role":"authenticated"}'),
  ('Admin All', 'property-images', '{"name":"Admin All","definition":{"allow_download":true,"allow_upload":true,"allow_delete":true},"resources":["*"],"operations":["read","write","delete"],"role":"service_role"}');

-- Create policies for documents bucket
INSERT INTO storage.policies (name, bucket_id, definition)
VALUES 
  ('Auth Only', 'documents', '{"name":"Auth Only","definition":{"allow_download":true,"allow_upload":true,"allow_delete":true},"resources":["*"],"operations":["read","write","delete"],"role":"authenticated"}'),
  ('Admin All', 'documents', '{"name":"Admin All","definition":{"allow_download":true,"allow_upload":true,"allow_delete":true},"resources":["*"],"operations":["read","write","delete"],"role":"service_role"}');