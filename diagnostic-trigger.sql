-- ============================================
-- DIAGNOSTIC - VÉRIFIER L'ÉTAT DU TRIGGER
-- ============================================
-- Exécutez ces requêtes dans Supabase SQL Editor pour diagnostiquer le problème

-- 1. Vérifier si le trigger existe
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement 
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users';

-- 2. Vérifier si la fonction handle_new_user existe
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'handle_new_user';

-- 3. Vérifier les colonnes de la table profiles
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Vérifier les contraintes sur la table profiles
SELECT
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    CASE con.contype
        WHEN 'p' THEN 'Primary Key'
        WHEN 'f' THEN 'Foreign Key'
        WHEN 'u' THEN 'Unique'
        WHEN 'c' THEN 'Check'
        ELSE con.contype::text
    END AS constraint_type_desc
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'profiles';

--============================================
-- RÉSULTATS ATTENDUS
-- ============================================
-- Requête 1: Devrait montrer 'on_auth_user_created' trigger
-- Requête 2: Devrait montrer la fonction avec le code COALESCE pour le rôle
-- Requête 3: Devrait lister toutes les colonnes de profiles
-- Requête 4: Devrait montrer les contraintes (PRIMARY KEY sur id, etc.)

-- Si aucune de ces requêtes ne retourne de résultats,
-- cela confirme que le trigger n'a pas été créé correctement.
