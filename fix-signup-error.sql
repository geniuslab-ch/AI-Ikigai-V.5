-- ============================================
-- FIX SUPABASE SIGNUP ERROR 500
-- ============================================
-- PROBLÈME IDENTIFIÉ:
-- Le trigger handle_new_user() essaie d'insérer 'decouverte_coach' dans la colonne 'plan'
-- mais la contrainte CHECK ne permet que: 'decouverte', 'essentiel', 'premium'
-- 
-- SOLUTION:
-- Modifier la contrainte CHECK pour inclure les plans coach
-- ============================================

-- 1. Supprimer l'ancienne contrainte CHECK sur la colonne plan
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_plan_check;

-- 2. Ajouter la nouvelle contrainte avec tous les plans (client + coach)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_plan_check 
CHECK (plan IN (
    'decouverte',           -- Client gratuit
    'essentiel',            -- Client payant
    'premium',              -- Client premium
    'decouverte_coach',     -- Coach gratuit (nouveau)
    'explorer',             -- Coach Explorer (nouveau)
    'pathfinder',           -- Coach Pathfinder (nouveau)
    'guide'                 -- Coach Guide (nouveau)
));

-- 3. Vérifier que la contrainte est bien mise à jour
SELECT
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
AND rel.relname = 'profiles'
AND con.contype = 'c';

-- 4. Afficher un message de succès
SELECT '✅ Contrainte plan mise à jour avec succès!' AS status;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Allez sur Supabase Dashboard → SQL Editor
-- 2. Copiez-collez ce script complet
-- 3. Cliquez sur "Run" pour l'exécuter
-- 4. Vérifiez qu'il n'y a pas d'erreurs
-- 5. Testez la création d'un nouveau compte coach via auth.html?role=coach
-- 6. Le signup devrait maintenant fonctionner sans erreur 500!
