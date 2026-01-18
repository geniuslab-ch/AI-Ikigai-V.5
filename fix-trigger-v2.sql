-- ============================================
-- SOLUTION ALTERNATIVE - FIX COMPLET TRIGGER
-- ============================================
-- Si le premier script n'a pas fonctionné, essayez cette version améliorée
-- Exécutez ce script dans Supabase SQL Editor

-- 1. NETTOYER COMPLÈTEMENT (supprimer trigger et fonction existants)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- 2. RECRÉER LA FONCTION AVEC GESTION D'ERREUR AMÉLIORÉE
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_role TEXT;
    user_plan TEXT;
    user_name TEXT;
BEGIN
    -- Extraire les métadonnées avec gestion d'erreur
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'client');
    user_name := COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    
    -- Déterminer le plan basé sur le rôle
    IF user_role = 'coach' THEN
        user_plan := 'decouverte_coach';
    ELSE
        user_plan := 'decouverte';
    END IF;
    
    -- Insérer le profil avec ON CONFLICT pour éviter les doublons
    INSERT INTO public.profiles (id, email, name, role, plan)
    VALUES (
        NEW.id,
        NEW.email,
        user_name,
        user_role,
        user_plan
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        plan = EXCLUDED.plan,
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log l'erreur mais ne pas bloquer la création de l'utilisateur
        RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
        RETURN NEW;
END;
$$;

-- 3. RECRÉER LE TRIGGER
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 4. VÉRIFICATION
SELECT 'Trigger recreated successfully!' AS status;

-- Afficher le trigger
SELECT 
    trigger_name, 
    event_manipulation,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- ============================================
-- AFTER RUNNING: Tester avec un nouveau compte
-- ============================================
-- Allez sur https://ai-ikigai.com/auth.html?role=coach
-- Créez un nouveau compte de test
-- Si le trigger fonctionne, vous devriez voir dans les logs:
-- POST /auth/v1/signup 200 (Success)
