-- ============================================
-- COACH DASHBOARD - SCHÉMA BASE DE DONNÉES
-- ============================================
-- Création des tables pour le système coach complet
-- Exécutez ce script dans Supabase SQL Editor

-- ============================================
-- 1. MISE À JOUR TABLE PROFILES
-- ============================================

-- Ajouter colonnes pour le système de séances coach
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS sessions_total INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sessions_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_type TEXT;

-- Ajouter contrainte pour subscription_type
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_subscription_type_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_subscription_type_check 
CHECK (subscription_type IS NULL OR subscription_type IN ('explorer', 'pathfinder', 'guide'));

-- ============================================
-- 2. TABLE RELATION COACH-CLIENT
-- ============================================

CREATE TABLE IF NOT EXISTS public.coach_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'inactive')),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    UNIQUE(coach_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_clients_coach ON public.coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client ON public.coach_clients(client_id);

-- ============================================
-- 3. TABLE SÉANCES DE COACHING
-- ============================================

CREATE TABLE IF NOT EXISTS public.coaching_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_date TIMESTAMPTZ NOT NULL,
    duration INTEGER DEFAULT 60, -- minutes
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled')),
    notes TEXT,
    session_type TEXT, -- 'ikigai', 'suivi', 'bilan', etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_coach ON public.coaching_sessions(coach_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_client ON public.coaching_sessions(client_id);
CREATE INDEX IF NOT EXISTS idx_coaching_sessions_date ON public.coaching_sessions(session_date);

-- ============================================
-- 4. TABLE INVITATIONS CLIENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.client_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_email TEXT NOT NULL,
    client_name TEXT,
    invitation_token TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
    personal_message TEXT,
    expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_client_invitations_coach ON public.client_invitations(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON public.client_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON public.client_invitations(client_email);

-- ============================================
-- 5. RLS POLICIES (Row Level Security)
-- ============================================

-- Enable RLS sur les nouvelles tables
ALTER TABLE public.coach_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaching_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_invitations ENABLE ROW LEVEL SECURITY;

-- Policies pour coach_clients
CREATE POLICY "Coaches can view their clients"
  ON public.coach_clients FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage their clients"
  ON public.coach_clients FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their coach relationship"
  ON public.coach_clients FOR SELECT
  USING (auth.uid() = client_id);

-- Policies pour coaching_sessions
CREATE POLICY "Coaches can view their sessions"
  ON public.coaching_sessions FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage their sessions"
  ON public.coaching_sessions FOR ALL
  USING (auth.uid() = coach_id);

CREATE POLICY "Clients can view their sessions"
  ON public.coaching_sessions FOR SELECT
  USING (auth.uid() = client_id);

-- Policies pour client_invitations
CREATE POLICY "Coaches can view their invitations"
  ON public.client_invitations FOR SELECT
  USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can manage their invitations"
  ON public.client_invitations FOR ALL
  USING (auth.uid() = coach_id);

-- ============================================
-- 6. FONCTION HELPER - Initialiser séances selon plan
-- ============================================

CREATE OR REPLACE FUNCTION public.initialize_coach_sessions()
RETURNS TRIGGER AS $$
BEGIN
    -- Si c'est un coach et qu'il a un subscription_type, initialiser les séances
    IF NEW.role = 'coach' AND NEW.subscription_type IS NOT NULL THEN
        NEW.sessions_total := CASE NEW.subscription_type
            WHEN 'explorer' THEN 10
            WHEN 'pathfinder' THEN 25
            WHEN 'guide' THEN 50
            ELSE 0
        END;
        NEW.sessions_used := 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_coach_profile_update ON public.profiles;
CREATE TRIGGER on_coach_profile_update
    BEFORE INSERT OR UPDATE OF subscription_type ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.initialize_coach_sessions();

-- ============================================
-- 7. FONCTION HELPER - Décrémenter séances
-- ============================================

CREATE OR REPLACE FUNCTION public.decrement_coach_session()
RETURNS TRIGGER AS $$
BEGIN
    -- Décrémenter le compteur de séances utilisées quand une séance est complétée
    IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
        UPDATE public.profiles
        SET sessions_used = sessions_used + 1
        WHERE id = NEW.coach_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_session_completed ON public.coaching_sessions;
CREATE TRIGGER on_session_completed
    AFTER INSERT OR UPDATE OF status ON public.coaching_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_coach_session();

-- ============================================
-- 8. DONNÉES DE TEST (OPTIONNEL)
-- ============================================

-- Décommentez pour créer des données de test
/*
-- Mettre à jour un coach existant avec un plan
UPDATE public.profiles
SET subscription_type = 'pathfinder'
WHERE role = 'coach'
LIMIT 1;
*/

-- ============================================
-- VÉRIFICATION
-- ============================================

SELECT '✅ Schéma base de données créé avec succès!' AS status;

-- Afficher les tables créées
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name IN ('coach_clients', 'coaching_sessions', 'client_invitations')
ORDER BY table_name, ordinal_position;
