-- =============================================
-- FIX ANALYSES TABLE PERMISSIONS
-- =============================================

-- 1. Enable RLS on analyses table
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies (if any)
DROP POLICY IF EXISTS "Users can insert their own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can view their own analyses" ON analyses;
DROP POLICY IF EXISTS "Coaches can view client analyses" ON analyses;

-- 3. Allow users to INSERT their own analyses
CREATE POLICY "Users can insert their own analyses" 
ON analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Allow users to SELECT their own analyses
CREATE POLICY "Users can view their own analyses" 
ON analyses FOR SELECT 
USING (auth.uid() = user_id);

-- 5. Allow coaches to SELECT analyses of their clients
CREATE POLICY "Coaches can view client analyses" 
ON analyses FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM coach_clients 
        WHERE coach_clients.coach_id = auth.uid() 
        AND coach_clients.client_id = analyses.user_id
    )
);

-- 6. Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'analyses';

-- 7. Test insertion (optional - remove if not needed)
-- This will show if you can insert
SELECT auth.uid() as current_user_id;
