/*
  # Storage Bucket and Policies for Profile Images
  
  1. Changes
    - Creates a storage bucket for profile images if it doesn't exist
    - Adds storage policies for authenticated users to manage their profile images
    - Enables public access to view profile images
  
  2. Security
    - Users can only upload/update/delete their own profile images
    - Public read access for all profile images
    - Enforces folder structure based on user ID
*/

-- Create storage bucket for profile images if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile_images', 'profile_images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can upload own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own profile image" ON storage.objects;
  DROP POLICY IF EXISTS "Public can view profile images" ON storage.objects;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

-- Create storage policy to allow authenticated users to upload their own profile images
CREATE POLICY "Users can upload own profile image"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own profile images
CREATE POLICY "Users can update own profile image"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to delete their own profile images
CREATE POLICY "Users can delete own profile image"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile_images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public access to profile images
CREATE POLICY "Public can view profile images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile_images');