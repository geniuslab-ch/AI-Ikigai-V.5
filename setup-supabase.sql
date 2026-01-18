-- ============================================
-- SUPABASE SETUP SCRIPT FOR AI-IKIGAI
-- ============================================
-- Exécutez ce script dans Supabase SQL Editor
-- Dashboard > SQL Editor > New query

-- 1. Vérifier que la table profiles existe
-- Si elle n'existe pas, la créer
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT,
    role TEXT NOT NULL DEFAULT 'client',
    plan TEXT DEFAULT 'decouverte',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Activer RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes policies si elles existent
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 4. Créer les policies pour permettre aux utilisateurs de gérer leur propre profil
-- Policy: Les utilisateurs peuvent voir leur propre profil
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy: Les utilisateurs peuvent insérer leur propre profil
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy: Les utilisateurs peuvent mettre à jour leur propre profil
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. Créer une fonction trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Créer le trigger
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 7. Vérifier la table analyses
CREATE TABLE IF NOT EXISTS public.analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    questionnaire_data JSONB,
    cv_data JSONB,
    analysis_result JSONB,
    plan TEXT DEFAULT 'decouverte',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Activer RLS sur analyses
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;

-- 9. Policies pour analyses
DROP POLICY IF EXISTS "Users can view their own analyses" ON public.analyses;
DROP POLICY IF EXISTS "Users can insert their own analyses" ON public.analyses;

CREATE POLICY "Users can view their own analyses"
ON public.analyses
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
ON public.analyses
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 10. Table coach_clients pour la relation coach-client
CREATE TABLE IF NOT EXISTS public.coach_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(coach_id, client_id)
);

-- 11. Activer RLS sur coach_clients
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;

-- 12. Policies pour coach_clients
DROP POLICY IF EXISTS "Coaches can view their clients" ON public.coach_clients;
DROP POLICY IF EXISTS "Coaches can add clients" ON public.coach_clients;

CREATE POLICY "Coaches can view their clients"
ON public.coach_clients
FOR SELECT
TO authenticated
USING (
    auth.uid() = coach_id OR 
    auth.uid() = client_id
);

CREATE POLICY "Coaches can add clients"
ON public.coach_clients
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = coach_id);

-- 13. Policy pour que les coaches puissent voir les profils de leurs clients
DROP POLICY IF EXISTS "Coaches can view client profiles" ON public.profiles;
CREATE POLICY "Coaches can view client profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id OR
    EXISTS (
        SELECT 1 FROM public.coach_clients
        WHERE coach_id = auth.uid() AND client_id = id
    )
);

-- 14. Afficher un résumé des tables et policies
SELECT 'Profiles table configured' AS status;
SELECT COUNT(*) AS profile_count FROM public.profiles;
SELECT 'Analyses table configured' AS status;
SELECT COUNT(*) AS analyses_count FROM public.analyses;
SELECT 'Coach-clients table configured' AS status;
SELECT COUNT(*) AS coach_clients_count FROM public.coach_clients;

-- ============================================
-- NOTES IMPORTANTES
-- ============================================
-- 1. Allez sur Supabase Dashboard > SQL Editor
-- 2. Copiez-collez ce script complet
-- 3. Cliquez sur "Run" pour l'exécuter
-- 4. Vérifiez qu'il n'y a pas d'erreurs
-- 5. Testez la création d'un nouveau compte coach
