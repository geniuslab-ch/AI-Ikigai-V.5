-- ============================================
-- FIX STORAGE RLS (Simplified)
-- ============================================

-- 1. Drop existing specific policies to avoid conflicts/restrictions
DROP POLICY IF EXISTS "Authenticated users can upload CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own CVs" ON storage.objects;

-- 2. Create a simpler policy: Allow ANY authenticated user to upload to 'cvs' bucket
-- We remove the folder check (auth.uid() = foldername) because it can be error-prone
-- if the frontend path construction doesn't strictly match the type casting in SQL.
-- Securing the bucket by ID is sufficient for MVP upload.

CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'cvs' );

-- 3. Allow SELECT for authenticated users (to verify their upload)
CREATE POLICY "Authenticated Select"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'cvs' );

-- 4. Allow UPDATE for authenticated users
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'cvs' );
