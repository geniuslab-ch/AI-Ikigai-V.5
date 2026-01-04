-- ============================================
-- AI-IKIGAI Database Schema
-- Cloudflare D1 (SQLite)
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    name TEXT,
    role TEXT DEFAULT 'client' CHECK (role IN ('client', 'coach', 'admin', 'super_admin')),
    plan TEXT DEFAULT 'decouverte' CHECK (plan IN ('decouverte', 'essentiel', 'premium')),
    analyses_remaining INTEGER DEFAULT NULL,  -- NULL = illimité, pour plans avec limite
    subscription_end_date TEXT DEFAULT NULL,  -- Format ISO 8601, pour abonnements mensuels
    payment_date TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);

-- Questionnaires table
CREATE TABLE IF NOT EXISTS questionnaires (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    answers TEXT NOT NULL,  -- JSON
    cv_data TEXT,           -- JSON
    analysis TEXT NOT NULL, -- JSON
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_user ON questionnaires(user_id);
CREATE INDEX IF NOT EXISTS idx_questionnaires_created ON questionnaires(created_at);

-- Newsletter subscriptions
CREATE TABLE IF NOT EXISTS newsletter (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    type TEXT DEFAULT 'coach' CHECK (type IN ('client', 'coach', 'all')),
    subscribed_at TEXT NOT NULL,
    unsubscribed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter(email);

-- Payment transactions
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_session_id TEXT,
    stripe_payment_intent TEXT,
    amount INTEGER NOT NULL,
    currency TEXT DEFAULT 'EUR',
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Reports (generated PDF reports)
CREATE TABLE IF NOT EXISTS reports (
    id TEXT PRIMARY KEY,
    questionnaire_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    report_type TEXT DEFAULT 'basic' CHECK (report_type IN ('basic', 'full', 'premium')),
    file_key TEXT,  -- R2 storage key
    generated_at TEXT NOT NULL,
    FOREIGN KEY (questionnaire_id) REFERENCES questionnaires(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);

-- Sessions (for tracking)
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    questionnaire_id TEXT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    source TEXT,  -- utm_source
    medium TEXT,  -- utm_medium
    campaign TEXT -- utm_campaign
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
