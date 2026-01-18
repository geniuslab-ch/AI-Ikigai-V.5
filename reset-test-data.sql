-- ============================================================================
-- SCRIPT DE NETTOYAGE - SUPPRESSION DES DONNÉES DE TEST
-- ============================================================================
-- ⚠️ ATTENTION : Ce script supprime TOUTES les données de test de la base
-- ⚠️ IRREVERSIBLE : Assurez-vous d'avoir une sauvegarde avant d'exécuter
-- ============================================================================

-- Pour exécuter dans Supabase SQL Editor :
-- 1. Allez sur https://supabase.com/dashboard/project/YOUR_PROJECT/sql
-- 2. Collez ce script
-- 3. Vérifiez que vous voulez VRAIMENT tout supprimer
-- 4. Cliquez sur "RUN"

-- ============================================================================
-- ÉTAPE 1 : Désactiver temporairement les politiques RLS
-- (pour éviter les erreurs de permissions pendant la suppression)
-- ============================================================================

ALTER TABLE analyses DISABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- ÉTAPE 2 : Supprimer toutes les analyses
-- ============================================================================

-- Afficher le nombre d'analyses avant suppression
SELECT COUNT(*) as "Nombre d'analyses avant suppression" FROM analyses;

-- Supprimer toutes les analyses
DELETE FROM analyses;

-- Vérification
SELECT COUNT(*) as "Nombre d'analyses après suppression (devrait être 0)" FROM analyses;

-- ============================================================================
-- ÉTAPE 3 : Supprimer toutes les relations coach-client
-- ============================================================================

-- Afficher le nombre de relations avant suppression
SELECT COUNT(*) as "Nombre de relations coach-client avant suppression" FROM coach_clients;

-- Supprimer toutes les relations
DELETE FROM coach_clients;

-- Vérification
SELECT COUNT(*) as "Nombre de relations après suppression (devrait être 0)" FROM coach_clients;

-- ============================================================================
-- ÉTAPE 4 : Supprimer tous les profils (clients et coaches)
-- ============================================================================

-- Afficher le nombre de profils avant suppression
SELECT 
    role,
    COUNT(*) as nombre
FROM profiles
GROUP BY role;

-- Supprimer tous les profils
DELETE FROM profiles;

-- Vérification
SELECT COUNT(*) as "Nombre de profils après suppression (devrait être 0)" FROM profiles;

-- ============================================================================
-- ÉTAPE 5 : Supprimer tous les utilisateurs Auth
-- ============================================================================

-- ⚠️ NOTE IMPORTANTE : La suppression des utilisateurs auth.users nécessite
-- des permissions spéciales et doit être faite via l'API Admin de Supabase.
-- 
-- Option 1 : Via l'interface Supabase Dashboard
-- --------------------------------------------
-- 1. Allez sur : https://supabase.com/dashboard/project/YOUR_PROJECT/auth/users
-- 2. Sélectionnez tous les utilisateurs
-- 3. Cliquez sur "Delete Users"
--
-- Option 2 : Via SQL avec fonction admin (si vous avez les droits)
-- -----------------------------------------------------------------
-- Cette fonction nécessite les permissions de service role :

-- Créer une fonction pour supprimer tous les utilisateurs
CREATE OR REPLACE FUNCTION delete_all_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
BEGIN
  -- Boucle sur tous les utilisateurs
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Supprimer chaque utilisateur via la fonction admin
    PERFORM auth.uid() IS NULL; -- Force le contexte admin
    DELETE FROM auth.users WHERE id = user_record.id;
  END LOOP;
END;
$$;

-- Exécuter la fonction (ATTENTION : IRREVERSIBLE!)
-- SELECT delete_all_users();

-- Afficher le compte final
SELECT COUNT(*) as "Nombre d'utilisateurs restants" FROM auth.users;

-- ============================================================================
-- ÉTAPE 6 : Réactiver les politiques RLS
-- ============================================================================

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VÉRIFICATION FINALE
-- ============================================================================

SELECT 
    'analyses' as table_name,
    COUNT(*) as nombre_enregistrements
FROM analyses
UNION ALL
SELECT 
    'coach_clients' as table_name,
    COUNT(*) as nombre_enregistrements
FROM coach_clients
UNION ALL
SELECT 
    'profiles' as table_name,
    COUNT(*) as nombre_enregistrements
FROM profiles
UNION ALL
SELECT 
    'auth.users' as table_name,
    COUNT(*) as nombre_enregistrements
FROM auth.users;

-- ============================================================================
-- NOTES ADDITIONNELLES
-- ============================================================================

-- Pour réinitialiser les séquences auto-increment (si vous avez des ID séquentiels) :
-- ALTER SEQUENCE analyses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE profiles_id_seq RESTART WITH 1;
-- ALTER SEQUENCE coach_clients_id_seq RESTART WITH 1;

-- ============================================================================
-- FIN DU SCRIPT
-- ============================================================================
