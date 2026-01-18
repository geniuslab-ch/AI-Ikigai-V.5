-- =============================================
-- ENSURE ALL REQUIRED TABLES EXIST
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Create coach_clients table (relationship between coaches and clients)
CREATE TABLE IF NOT EXISTS coach_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    added_at timestamptz DEFAULT now(),
    UNIQUE(coach_id, client_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_coach_clients_coach_id ON coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client_id ON coach_clients(client_id);

-- 2. Ensure analyses table has user_id column
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- Index for faster user queries
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_coach_id ON analyses(coach_id);

-- 3. Ensure client_invitations table exists
CREATE TABLE IF NOT EXISTS client_invitations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    client_email text NOT NULL,
    client_name text,
    personal_message text,
    invitation_token text UNIQUE NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
    created_at timestamptz DEFAULT now(),
    accepted_at timestamptz,
    expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_coach_id ON client_invitations(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_status ON client_invitations(status);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

-- Coach can see their own clients
CREATE POLICY "Coaches can view their clients" ON coach_clients
    FOR SELECT
    USING (auth.uid() = coach_id);

-- Coach can add clients
CREATE POLICY "Coaches can add clients" ON coach_clients
    FOR INSERT
    WITH CHECK (auth.uid() = coach_id);

-- Client can see their coach relationship
CREATE POLICY "Clients can view their coach" ON coach_clients
    FOR SELECT
    USING (auth.uid() = client_id);

-- Coach can manage their invitations
CREATE POLICY "Coaches can manage invitations" ON client_invitations
    FOR ALL
    USING (auth.uid() = coach_id);

-- Anyone can read pending invitations (for signup flow)
CREATE POLICY "Anyone can read pending invitations" ON client_invitations
    FOR SELECT
    USING (status = 'pending');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Check table structure
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('coach_clients', 'analyses', 'client_invitations')
ORDER BY table_name, ordinal_position;

-- Count existing data
SELECT 
    'coach_clients' as table_name, 
    COUNT(*) as row_count 
FROM coach_clients
UNION ALL
SELECT 
    'client_invitations', 
    COUNT(*) 
FROM client_invitations
UNION ALL
SELECT 
    'analyses', 
    COUNT(*) 
FROM analyses;
