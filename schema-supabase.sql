-- ============================================
-- AI-IKIGAI Database Schema - SUPABASE
-- PostgreSQL
-- ============================================

-- Profiles table (lié à auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'coach', 'admin', 'super_admin')),
    plan TEXT DEFAULT 'decouverte' CHECK (plan IN ('decouverte', 'essentiel', 'premium')),
    analyses_remaining INTEGER DEFAULT NULL,
    subscription_end_date TIMESTAMPTZ DEFAULT NULL,
    payment_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON public.profiles(plan);

-- Questionnaires table
CREATE TABLE IF NOT EXISTS public.questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    answers JSONB NOT NULL,
    cv_data JSONB,
    analysis JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_user ON public.questionnaires(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created ON public.questionnaires(created_at);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS public.newsletter (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'coach' CHECK (type IN ('client', 'coach', 'all')),
    subscribed_at TIMESTAMPTZ DEFAULT NOW(),
    unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON public.newsletter(email);

-- Payment transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ============================================
-- TRIGGER: Auto-create profile on signup
-- ============================================

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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Questionnaires policies
CREATE POLICY "Users can view own questionnaires"
  ON public.questionnaires FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own questionnaires"
  ON public.questionnaires FOR INSERT
  WITH CHECK (auth.uid() = user_id);
