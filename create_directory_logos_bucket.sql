-- Create a public storage bucket for directory listing logos/images
-- Run in Supabase SQL Editor

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'directory-logos',
  'directory-logos',
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
);

-- Allow anyone to upload (submissions come from anonymous users)
CREATE POLICY "Anyone can upload directory logos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'directory-logos');

-- Allow public read access
CREATE POLICY "Public can view directory logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'directory-logos');

-- Allow service role to delete
CREATE POLICY "Service role can delete directory logos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'directory-logos' AND auth.role() = 'service_role');
