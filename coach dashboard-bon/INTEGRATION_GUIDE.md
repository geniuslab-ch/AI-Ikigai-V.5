# Guide d'Intégration Complet - AI-Ikigai Dashboards

## 📚 Vue d'ensemble

Ce guide explique comment intégrer les deux tableaux de bord (Client B2C et Coach) dans votre infrastructure AI-Ikigai.

## 🗂️ Structure des Fichiers

```
ai-ikigai/
├── public/
│   ├── index.html                          # Page d'accueil
│   ├── questionnaire.html                  # Questionnaire Ikigai
│   ├── coach.html                          # Page coach
│   │
│   ├── dashboard.html                      # Dashboard client B2C ⭐
│   ├── dashboard.js                        # Logic dashboard client ⭐
│   ├── dashboard.css                       # Styles dashboard client ⭐
│   │
│   ├── coach-dashboard.html                # Dashboard coach ⭐
│   ├── coach-dashboard.js                  # Logic dashboard coach ⭐
│   │
│   ├── api.js                              # Client API (existant)
│   └── styles.css                          # Styles globaux (existant)
│
├── src/
│   └── index.js                            # Cloudflare Worker backend
│
└── wrangler.toml                           # Config Cloudflare
```

## 🔄 Flux Utilisateur

### Pour les Clients (B2C)

```
1. Inscription/Connexion
   ↓
2. Questionnaire Ikigai
   ↓
3. Upload CV (optionnel)
   ↓
4. Traitement IA
   ↓
5. → DASHBOARD CLIENT ←
   - Score Ikigai
   - 4 Dimensions
   - Insights personnalisés
   - Suggestions carrière
   - Idées business
   - Axes développement
```

### Pour les Coachs

```
1. Inscription Coach/Connexion
   ↓
2. → DASHBOARD COACH ←
   - Overview (stats globales)
   - Liste des clients
   - Gestion des crédits
   - Économies réalisées
   ↓
3. Clic sur un client
   ↓
4. → DASHBOARD CLIENT en Modal ←
   - Vue complète du profil
   - Actions coach (rapport, email, séance)
```

## 🔌 Intégration API Backend

### 1. Routes API Requises

```javascript
// Dans src/index.js (Cloudflare Worker)

// ===== ROUTES CLIENT B2C =====

// Récupérer le dashboard d'un client
app.get('/api/client/dashboard/:id', async (c) => {
  const clientId = c.req.param('id');
  const userId = c.get('userId'); // From JWT
  
  // Vérifier que l'utilisateur a accès à ce dashboard
  if (!await hasAccess(userId, clientId)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const dashboard = await getClientDashboard(clientId);
  return c.json(dashboard);
});

// ===== ROUTES COACH =====

// Statistiques overview du coach
app.get('/api/coach/dashboard', async (c) => {
  const coachId = c.get('userId');
  
  const stats = await getCoachStats(coachId);
  const credits = await getCoachCredits(coachId);
  const savings = await calculateSavings(coachId);
  
  return c.json({ stats, credits, savings });
});

// Liste des clients du coach
app.get('/api/coach/clients', async (c) => {
  const coachId = c.get('userId');
  const clients = await getCoachClients(coachId);
  return c.json({ clients });
});

// Dashboard d'un client spécifique (vue coach)
app.get('/api/coach/clients/:id/ikigai', async (c) => {
  const coachId = c.get('userId');
  const clientId = c.req.param('id');
  
  // Vérifier que ce client appartient au coach
  if (!await isCoachClient(coachId, clientId)) {
    return c.json({ error: 'Unauthorized' }, 403);
  }
  
  const dashboard = await getClientDashboard(clientId);
  return c.json(dashboard);
});

// Acheter des crédits
app.post('/api/coach/credits/purchase', async (c) => {
  const coachId = c.get('userId');
  const { amount } = await c.req.json();
  
  // Créer une session Stripe
  const session = await createStripeCheckout(coachId, amount);
  return c.json({ checkoutUrl: session.url });
});
```

### 2. Fonctions Utilitaires Backend

```javascript
// Calculer les stats du coach
async function getCoachStats(coachId) {
  const clients = await getCoachClients(coachId);
  
  return {
    activeClients: clients.filter(c => c.status === 'active').length,
    weekSessions: countWeekSessions(clients),
    newAnalyses: countRecentAnalyses(clients, 7), // 7 derniers jours
    avgScore: calculateAverageScore(clients)
  };
}

// Calculer les économies réalisées
async function calculateSavings(coachId) {
  const analysesCount = await countTotalAnalyses(coachId);
  
  const MANUAL_COST_PER_ANALYSIS = 100; // 5h × 20€/h
  const AI_COST_PER_ANALYSIS = 27.50;    // Prix moyen avec forfait
  const TIME_PER_ANALYSIS = 5;           // heures
  
  const manualCost = analysesCount * MANUAL_COST_PER_ANALYSIS;
  const aiCost = analysesCount * AI_COST_PER_ANALYSIS;
  const totalSavings = manualCost - aiCost;
  const timeSaved = analysesCount * TIME_PER_ANALYSIS;
  
  return {
    total: totalSavings,
    manualCost,
    aiCost,
    timeSaved,
    analysesCount
  };
}

// Récupérer le dashboard d'un client
async function getClientDashboard(clientId) {
  const questionnaire = await DB.prepare(
    'SELECT * FROM questionnaires WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
  ).bind(clientId).first();
  
  if (!questionnaire) {
    throw new Error('No questionnaire found');
  }
  
  // Parser les résultats JSON
  const results = JSON.parse(questionnaire.results);
  
  return {
    overallScore: results.overallScore,
    dimensions: results.dimensions,
    insights: results.insights,
    careerSuggestions: results.careerSuggestions,
    businessIdeas: results.businessIdeas,
    developmentAxes: results.developmentAxes
  };
}
```

## 📝 Configuration HTML Pages

### dashboard.html (Client)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <title>Mon Tableau de Bord Ikigai | AI-Ikigai</title>
    <!-- Fonts, Meta tags -->
    <link rel="stylesheet" href="dashboard.css">
</head>
<body>
    <!-- Contenu du dashboard -->
    
    <!-- Scripts -->
    <script src="api.js"></script>
    <script src="dashboard.js"></script>
</body>
</html>
```

### coach-dashboard.html (Coach)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <title>Tableau de Bord Coach | AI-Ikigai</title>
    <!-- Fonts, Meta tags -->
    <!-- CSS inline dans le fichier -->
    <!-- OU -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <!-- Contenu du dashboard coach -->
    
    <!-- Scripts -->
    <script src="api.js"></script>
    <script src="coach-dashboard.js"></script>
</body>
</html>
```

## 🔐 Gestion de l'Authentification

### Middleware de Protection

```javascript
// Dans dashboard.js et coach-dashboard.js

// Vérification automatique au chargement
document.addEventListener('DOMContentLoaded', async () => {
  // Vérifier le token JWT
  if (!ApiClient.isAuthenticated()) {
    // Rediriger vers login avec return URL
    const returnUrl = encodeURIComponent(window.location.pathname);
    window.location.href = `/login.html?return=${returnUrl}`;
    return;
  }
  
  try {
    // Vérifier que le token est valide
    const user = await AuthAPI.getCurrentUser();
    
    // Pour le coach dashboard, vérifier le rôle
    if (window.location.pathname.includes('coach-dashboard')) {
      if (user.role !== 'coach') {
        alert('Accès réservé aux coachs');
        window.location.href = '/dashboard.html';
        return;
      }
    }
    
    // Charger les données
    await loadDashboardData();
    
  } catch (error) {
    console.error('Auth error:', error);
    ApiClient.clearToken();
    window.location.href = '/login.html';
  }
});
```

## 🎯 Routage et Navigation

### Routes de l'Application

```javascript
// Exemple de routes (avec un framework ou manuellement)

const routes = {
  // Public
  '/': 'index.html',
  '/coach': 'coach.html',
  '/questionnaire': 'questionnaire.html',
  '/login': 'login.html',
  '/register': 'register.html',
  
  // Protégé - Client
  '/dashboard': 'dashboard.html',           // ← Dashboard Client B2C
  
  // Protégé - Coach
  '/coach-dashboard': 'coach-dashboard.html' // ← Dashboard Coach
};
```

### Liens de Navigation

```html
<!-- Dans la navbar après login -->

<!-- Pour un client -->
<a href="/dashboard" class="nav-link">Mon Dashboard</a>

<!-- Pour un coach -->
<a href="/coach-dashboard" class="nav-link">Dashboard Coach</a>

<!-- Détection automatique du rôle -->
<script>
  async function navigateToDashboard() {
    const user = await AuthAPI.getCurrentUser();
    
    if (user.role === 'coach') {
      window.location.href = '/coach-dashboard';
    } else {
      window.location.href = '/dashboard';
    }
  }
</script>
```

## 💾 Base de Données

### Tables Requises

```sql
-- Table utilisateurs (étendue)
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'client', -- 'client' | 'coach' | 'admin'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Table questionnaires
CREATE TABLE questionnaires (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  answers TEXT NOT NULL,      -- JSON
  results TEXT,                -- JSON (dashboard data)
  cv_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Table relation coach-client
CREATE TABLE coach_clients (
  coach_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (coach_id, client_id),
  FOREIGN KEY (coach_id) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES users(id)
);

-- Table crédits coach
CREATE TABLE coach_credits (
  coach_id INTEGER PRIMARY KEY,
  credits_total INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES users(id)
);

-- Table séances
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  coach_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  scheduled_at DATETIME,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES users(id)
);
```

## 📊 Format des Données Dashboard

### Structure JSON Complète

```json
{
  "overallScore": 75,
  
  "dimensions": [
    {
      "type": "love",
      "title": "Ce que vous aimez",
      "score": 85,
      "items": [
        "Créativité et innovation",
        "Résolution de problèmes",
        "Travail d'équipe",
        "Apprentissage continu"
      ]
    },
    {
      "type": "good",
      "title": "Vos talents naturels",
      "score": 78,
      "items": [
        "Communication persuasive",
        "Analyse stratégique",
        "Gestion de projets",
        "Design thinking"
      ]
    },
    {
      "type": "paid",
      "title": "Valeur marchande",
      "score": 72,
      "items": [
        "Conseil en transformation digitale",
        "Formation professionnelle",
        "Coaching d'équipes",
        "Design de services"
      ]
    },
    {
      "type": "need",
      "title": "Impact sociétal",
      "score": 68,
      "items": [
        "Solutions durables",
        "Inclusion et diversité",
        "Éducation accessible",
        "Innovation responsable"
      ]
    }
  ],
  
  "insights": {
    "theme": {
      "title": "Créateur de Transformations Positives",
      "description": "Vous excellez dans l'accompagnement du changement..."
    },
    "motivators": {
      "description": "Vos principales sources de motivation...",
      "tags": ["Impact", "Reconnaissance", "Apprentissage", "Autonomie"]
    },
    "workStyle": {
      "description": "Vous préférez un mode de travail hybride...",
      "tags": ["Autonome", "Collaboratif", "Adaptable"]
    },
    "energyDrains": {
      "description": "Tâches répétitives sans valeur ajoutée...",
      "tags": ["Tâches répétitives", "Micromanagement"]
    },
    "currentAlignment": {
      "score": 75,
      "description": "Les aspects positifs incluent...",
      "tags": ["✓ Créativité", "✓ Autonomie", "⚠ Impact"]
    }
  },
  
  "careerSuggestions": [
    {
      "title": "Responsable Innovation & Transformation",
      "description": "Piloter des projets de transformation...",
      "match": 92
    }
  ],
  
  "businessIdeas": [
    {
      "title": "Cabinet de Conseil en Transformation Humaine",
      "description": "Créer une structure accompagnant...",
      "potential": "Élevé 🔥"
    }
  ],
  
  "developmentAxes": {
    "skills": {
      "items": [
        "🔹 Leadership stratégique et vision long terme",
        "🔹 Data analysis et KPIs de performance"
      ]
    },
    "habits": {
      "items": [
        "🔹 Rituels matinaux de planification stratégique",
        "🔹 Networking régulier dans votre secteur"
      ]
    },
    "values": {
      "items": [
        "🔹 Authenticité dans vos relations professionnelles",
        "🔹 Impact positif sur la société"
      ]
    },
    "traps": {
      "items": [
        "🔸 Surcharge de travail et burn-out",
        "🔸 Perfectionnisme paralysant"
      ]
    },
    "situations": {
      "items": [
        "🔹 Projets transversaux et innovants",
        "🔹 Postes avec autonomie décisionnelle"
      ]
    }
  }
}
```

## 🧪 Tests

### Tests Unitaires

```javascript
// test/dashboard.test.js

describe('Dashboard Client', () => {
  test('calcule le score correctement', () => {
    const score = 75;
    const interpretation = getScoreInterpretation(score);
    expect(interpretation.level).toBe('good');
  });
  
  test('formate les dates correctement', () => {
    const formatted = formatDate('2024-12-15');
    expect(formatted).toBe('15 déc. 2024');
  });
});

describe('Dashboard Coach', () => {
  test('calcule la moyenne des scores', () => {
    const clients = [
      { score: 80 },
      { score: 70 },
      { score: 90 }
    ];
    const avg = calculateAverageScore(clients);
    expect(avg).toBe(80);
  });
  
  test('compte les séances de la semaine', () => {
    const clients = [
      { nextSession: '2024-12-16' },
      { nextSession: '2024-12-25' },
      { nextSession: null }
    ];
    const count = countWeekSessions(clients);
    expect(count).toBe(1);
  });
});
```

### Tests E2E

```javascript
// test/e2e/dashboard.spec.js

describe('Flux complet client', () => {
  test('Client peut voir son dashboard', async () => {
    // Login
    await page.goto('/login');
    await page.fill('#email', 'test@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier redirection vers dashboard
    await page.waitForURL('/dashboard');
    
    // Vérifier éléments présents
    await expect(page.locator('.gauge-score')).toBeVisible();
    await expect(page.locator('.ikigai-map')).toBeVisible();
  });
});

describe('Flux complet coach', () => {
  test('Coach peut voir ses clients', async () => {
    // Login coach
    await page.goto('/login');
    await page.fill('#email', 'coach@example.com');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier dashboard coach
    await page.waitForURL('/coach-dashboard');
    await expect(page.locator('#activeClients')).toBeVisible();
    await expect(page.locator('.clients-table')).toBeVisible();
    
    // Ouvrir profil client
    await page.click('.clients-table tbody tr:first-child');
    await expect(page.locator('#clientModal')).toBeVisible();
  });
});
```

## 🚀 Déploiement

### Étape 1 : Build & Upload

```bash
# Build des assets
npm run build

# Upload vers Cloudflare Pages
wrangler pages deploy public
```

### Étape 2 : Variables d'Environnement

```bash
# Via Cloudflare Dashboard ou CLI
wrangler secret put JWT_SECRET
wrangler secret put STRIPE_SECRET_KEY
wrangler secret put OPENAI_API_KEY
```

### Étape 3 : Routes

```json
// _routes.json
{
  "version": 1,
  "routes": [
    {
      "route": "/api/*",
      "destination": "worker"
    },
    {
      "route": "/dashboard",
      "destination": "static"
    },
    {
      "route": "/coach-dashboard",
      "destination": "static"
    }
  ]
}
```

## 📈 Monitoring

### Métriques à Suivre

```javascript
// Analytics events
trackEvent('dashboard_view', { user_id, dashboard_type: 'client' });
trackEvent('client_profile_opened', { coach_id, client_id });
trackEvent('report_downloaded', { user_id, client_id });
trackEvent('credits_purchased', { coach_id, amount });
```

### Logs Importants

```javascript
console.log('Dashboard loaded:', {
  userId,
  role,
  loadTime: Date.now() - startTime
});

console.error('API Error:', {
  endpoint,
  error: error.message,
  userId
});
```

## 📞 Support & Documentation

- **Documentation complète** : `/docs`
- **API Reference** : `/docs/api`
- **Changelog** : `/CHANGELOG.md`
- **Issues** : GitHub Issues

---

**Guide créé par AI-Ikigai Team**  
**Version 1.0.0 - Décembre 2024**
