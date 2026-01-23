-- ============================================
-- FIX PROFILES PERMISSIONS
-- ============================================

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to update their own profile (including cv_path)
-- This might duplicate existing policies but is safe to run to ensure permission
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify policy
SELECT * FROM pg_policies WHERE tablename = 'profiles';
