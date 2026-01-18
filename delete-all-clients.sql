-- Delete All Client Users (Keep Coaches)
-- Run this in Supabase SQL Editor

-- 1. First, delete from profiles table
DELETE FROM profiles 
WHERE role = 'client';

-- 2. Then, delete from auth.users
-- This will cascade and delete all related data
DELETE FROM auth.users
WHERE raw_user_meta_data->>'role' = 'client';

-- Verify what's left (should only be coaches)
SELECT 
    id, 
    email, 
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users
ORDER BY created_at DESC;
