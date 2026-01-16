# 🎯 ACTIONS REQUISES DANS SUPABASE

## ⚠️ CRITIQUE: Exécutez ce SQL pour que les analyses fonctionnent

Copiez-collez ce script complet dans **Supabase SQL Editor** et exécutez:

```sql
-- =============================================
-- STEP 1: Ajouter colonnes manquantes à analyses
-- =============================================

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;

-- =============================================
-- STEP 2: Créer index pour performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_coach_id ON analyses(coach_id);

-- =============================================
-- STEP 3: Créer table coach_clients
-- =============================================

CREATE TABLE IF NOT EXISTS coach_clients (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coach_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    client_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    status text DEFAULT 'active',
    added_at timestamptz DEFAULT now(),
    UNIQUE(coach_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_clients_coach_id ON coach_clients(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_clients_client_id ON coach_clients(client_id);

-- =============================================
-- STEP 4: RLS pour table analyses (CRITIQUE!)
-- =============================================

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;

-- Supprimer anciennes policies
DROP POLICY IF EXISTS "Users can insert their own analyses" ON analyses;
DROP POLICY IF EXISTS "Users can view their own analyses" ON analyses;
DROP POLICY IF EXISTS "Coaches can view client analyses" ON analyses;

-- Users peuvent insérer leurs propres analyses
CREATE POLICY "Users can insert their own analyses" 
ON analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users peuvent voir leurs propres analyses
CREATE POLICY "Users can view their own analyses" 
ON analyses FOR SELECT 
USING (auth.uid() = user_id);

-- Coaches peuvent voir analyses de leurs clients
CREATE POLICY "Coaches can view client analyses" 
ON analyses FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM coach_clients 
        WHERE coach_clients.coach_id = auth.uid() 
        AND coach_clients.client_id = analyses.user_id
    )
);

-- =============================================
-- STEP 5: RLS pour table coach_clients
-- =============================================

ALTER TABLE coach_clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Coaches can view their clients" ON coach_clients;
DROP POLICY IF EXISTS "Coaches can add clients" ON coach_clients;
DROP POLICY IF EXISTS "Clients can view their coach" ON coach_clients;

CREATE POLICY "Coaches can view their clients" ON coach_clients
    FOR SELECT USING (auth.uid() = coach_id);

CREATE POLICY "Coaches can add clients" ON coach_clients
    FOR INSERT WITH CHECK (auth.uid() = coach_id);

CREATE POLICY "Clients can view their coach" ON coach_clients
    FOR SELECT USING (auth.uid() = client_id);

-- =============================================
-- STEP 6: Vérification
-- =============================================

-- Vérifier structure table analyses
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'analyses' 
ORDER BY ordinal_position;

-- Vérifier policies
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('analyses', 'coach_clients')
ORDER BY tablename, policyname;

-- Vérifier données
SELECT COUNT(*) as total_analyses FROM analyses;
SELECT COUNT(*) as total_coach_clients FROM coach_clients;
```

## ✅ Après avoir exécuté le SQL

1. **Rafraîchissez dashboards** (Cmd+Shift+R)
2. **Refaites le questionnaire** en tant que client
3. **Vérifiez console (F12)** - devrait voir:
   - `✅ Analysis saved to Supabase: xxx`
4. **Dashboard client** devrait montrer l'analyse
5. **Dashboard coach** devrait montrer analyses des clients

## 🔧 OPTIONNEL: Créer bucket pour CVs

Si vous voulez que l'upload de CV fonctionne:

1. Allez dans **Supabase Storage**
2. Créez un nouveau bucket nommé `cvs`
3. Policies: permettre aux users authentifiés d'upload

## 📊 Vérifier que ça marche

```sql
-- Voir toutes les analyses
SELECT id, user_id, coach_id, created_at 
FROM analyses 
ORDER BY created_at DESC;

-- Voir relations coach-client
SELECT 
    cc.id,
    coach.email as coach_email,
    client.email as client_email,
    cc.added_at
FROM coach_clients cc
LEFT JOIN profiles coach ON cc.coach_id = coach.id
LEFT JOIN profiles client ON cc.client_id = client.id
ORDER BY cc.added_at DESC;
```

## 🎯 Flow complet qui devrait marcher

1. **Coach** invite client via dashboard
2. **Client** s'inscrit via lien (crée automatiquement relation dans `coach_clients`)
3. **Client** fait questionnaire (sauvegarde dans `analyses` avec `user_id` + `coach_id`)
4. **Client** voit ses analyses dans dashboard client
5. **Coach** voit analyses du client dans dashboard coach

---

**Tout le code est pushé et déployé! Il ne manque QUE l'exécution du SQL dans Supabase.**
