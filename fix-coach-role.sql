-- ============================================
-- FIX COACH ROLE - AI-IKIGAI
-- ============================================
-- Ce script corrige le problème où les coachs sont créés avec le rôle 'client'
-- Exécutez ce script dans Supabase SQL Editor (Dashboard > SQL Editor > New query)

-- 1. Supprimer l'ancien trigger qui force le rôle à 'client'
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Créer la fonction corrigée qui lit le rôle depuis user_metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role, plan)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    -- ✅ Lire le rôle depuis user_metadata, 'client' par défaut
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    -- ✅ Si rôle = coach, plan = decouverte_coach, sinon decouverte
    CASE 
      WHEN COALESCE(NEW.raw_user_meta_data->>'role', 'client') = 'coach' 
      THEN 'decouverte_coach'
      ELSE 'decouverte'
    END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Recréer le trigger avec la fonction corrigée
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- 4. OPTIONNEL: Corriger les comptes coach existants qui ont été créés avec le mauvais rôle
-- Décommentez les lignes ci-dessous si vous voulez corriger les comptes existants

/*
-- Mettre à jour les profils où user_metadata dit 'coach' mais le profil dit 'client'
UPDATE public.profiles
SET 
  role = 'coach',
  plan = 'decouverte_coach'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE raw_user_meta_data->>'role' = 'coach'
)
AND role = 'client';

-- Afficher les profils corrigés
SELECT 
  p.email,
  p.role,
  p.plan,
  u.raw_user_meta_data->>'role' as metadata_role
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.raw_user_meta_data->>'role' = 'coach';
*/

-- 5. Vérification
SELECT 'Coach role trigger fixed!' AS status;

-- Afficher un exemple de profil pour vérifier
SELECT 
  p.email,
  p.role,
  p.plan,
  p.created_at
FROM public.profiles p
ORDER BY p.created_at DESC
LIMIT 5;

-- ============================================
-- INSTRUCTIONS
-- ============================================
-- 1. Allez sur Supabase Dashboard > SQL Editor
-- 2. Copiez-collez ce script complet
-- 3. Cliquez sur "Run" pour l'exécuter
-- 4. Vérifiez qu'il n'y a pas d'erreurs
-- 5. Testez la création d'un nouveau compte coach via auth.html?role=coach
-- 6. Pour corriger les comptes existants, décommentez la section OPTIONNEL ci-dessus
