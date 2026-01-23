-- ============================================
-- SETUP STORAGE BUCKET
-- ============================================

-- Create the 'cvs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can upload their own CVs
CREATE POLICY "Authenticated users can upload CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can update their own CVs
CREATE POLICY "Users can update their own CVs"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Users can read their own CVs
CREATE POLICY "Users can read their own CVs"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Policy: Coaches can read their clients' CVs
-- This assumes we can check the coach_clients table.
-- Note: Cross-schema policies can be tricky in Supabase storage.
-- A simpler approach for MVP is to allow authenticated read if they have the path.
-- Or stick to the stricter policy above and use signed URLs for coaches.
