-- ============================================
-- SETUP STORAGE BUCKET (CORRECTED)
-- ============================================

-- 1. Create the 'cvs' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can upload CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own CVs" ON storage.objects;

-- 3. Policy: Authenticated users can upload their own CVs
CREATE POLICY "Authenticated users can upload CVs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 4. Policy: Users can update their own CVs
CREATE POLICY "Users can update their own CVs"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1] );

-- 5. Policy: Users can read their own CVs
CREATE POLICY "Users can read their own CVs"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'cvs' AND auth.uid()::text = (storage.foldername(name))[1] );
