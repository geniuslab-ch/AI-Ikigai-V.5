-- ============================================================================
-- VERSION SIMPLE - NETTOYAGE RAPIDE DES DONNÉES DE TEST
-- ============================================================================
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données
-- ⚠️ À exécuter dans Supabase SQL Editor
-- ============================================================================

-- Désactiver RLS temporairement
ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Supprimer toutes les données
DELETE FROM analyses;
DELETE FROM coach_clients;
DELETE FROM profiles;

-- Réactiver RLS
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Vérification
SELECT 
    'analyses' as table,
    COUNT(*) as count
FROM analyses
UNION ALL
SELECT 'coach_clients', COUNT(*) FROM coach_clients
UNION ALL
SELECT 'profiles', COUNT(*) FROM profiles
UNION ALL
SELECT 'auth.users', COUNT(*) FROM auth.users;

-- ============================================================================
-- POUR SUPPRIMER LES UTILISATEURS AUTH :
-- Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
-- et supprimez-les manuellement depuis l'interface
-- ============================================================================
