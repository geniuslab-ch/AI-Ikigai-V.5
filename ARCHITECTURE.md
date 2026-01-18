# 🏗️ Architecture Complète AI-Ikigai Dashboards

## 📊 Vue d'Ensemble

Ce document décrit l'architecture complète des trois dashboards AI-Ikigai et leur déploiement sur Cloudflare Pages via GitHub.

## 🗂️ Structure des Fichiers

```
ai-ikigai-dashboards/
│
├── 📁 public/                              # Fichiers statiques à déployer
│   │
│   ├── 🎯 DASHBOARD CLIENT (B2C)
│   │   ├── dashboard.html                  # Interface client
│   │   ├── dashboard.js                    # Logique client
│   │   └── dashboard.css                   # Styles client
│   │
│   ├── 🎓 DASHBOARD COACH
│   │   ├── coach-dashboard.html            # Interface coach
│   │   └── coach-dashboard.js              # Logique coach
│   │
│   ├── ⚡ DASHBOARD ADMIN
│   │   ├── admin-dashboard.html            # Interface admin
│   │   └── admin-dashboard.js              # Logique admin
│   │
│   ├── 🔧 COMPOSANTS COMMUNS
│   │   ├── api.js                          # Client API centralisé
│   │   ├── invite.html                     # Page invitation nouveaux clients
│   │   ├── add-client-modal.html           # Modal ajout client (coach)
│   │   └── add-client-functions.js         # Logique ajout client
│   │
│   ├── 🌐 PAGES SYSTÈME
│   │   ├── index.html                      # Page d'accueil
│   │   └── 404.html                        # Page erreur 404
│   │
│   └── ⚙️ CONFIGURATION
│       ├── _headers                        # Headers HTTP sécurité
│       └── _redirects                      # Redirections URL
│
├── 📝 FICHIERS RACINE
│   ├── package.json                        # Configuration npm
│   ├── wrangler.toml                       # Configuration Cloudflare
│   ├── .gitignore                          # Fichiers à ignorer
│   └── setup.sh                            # Script de setup
│
├── 🤖 CI/CD
│   └── .github/
│       └── workflows/
│           └── deploy.yml                  # GitHub Actions
│
└── 📚 DOCUMENTATION
    ├── README.md                           # Documentation principale
    ├── DEPLOYMENT_README.md                # Guide déploiement complet
    ├── QUICKSTART.md                       # Démarrage rapide
    ├── DASHBOARD_README.md                 # Doc dashboard client
    ├── COACH_DASHBOARD_README.md           # Doc dashboard coach
    ├── ADD_CLIENT_FLOW_COMPLETE.md         # Flux ajout client
    └── INTEGRATION_GUIDE.md                # Guide d'intégration
```

## 🎯 Les Trois Dashboards

### 1. Dashboard Client (B2C) 👤

**Fichiers** :
- `dashboard.html` (interface)
- `dashboard.js` (logique)
- `dashboard.css` (styles)

**Sections** :
- Score Ikigai avec jauge animée
- Carte des 4 dimensions
- Insights personnalisés
- Suggestions de carrière
- Idées de business
- Axes de développement

**Accès** :
```
https://votre-site.pages.dev/dashboard.html
https://votre-site.pages.dev/client
```

**Authentification** : Client avec compte AI-Ikigai

---

### 2. Dashboard Coach 🎓

**Fichiers** :
- `coach-dashboard.html` (interface)
- `coach-dashboard.js` (logique)

**Sections** :
- **Overview** : Stats globales (clients actifs, séances, analyses, score moyen)
- **Gestion crédits** : Crédits restants, économies réalisées
- **Liste clients** : Table avec filtres, recherche, actions
- **Profil client** : Modal avec dashboard client intégré
- **Ajout client** : 2 scénarios (existant / nouveau avec invitation)

**Accès** :
```
https://votre-site.pages.dev/coach-dashboard.html
https://votre-site.pages.dev/coach
```

**Authentification** : Coach professionnel

**Fonctionnalités Clés** :
- Ajout client existant (association immédiate)
- Invitation nouveau client (email + token)
- Gestion des crédits
- Export données
- Calcul économies (manuel vs AI)

---

### 3. Dashboard Admin ⚡

**Fichiers** :
- `admin-dashboard.html` (interface avec sidebar)
- `admin-dashboard.js` (logique complète)

**Architecture** :
- **Layout** : Sidebar fixe + contenu principal
- **Responsive** : Menu hamburger sur mobile
- **Rôles** : Super Admin, Admin, Lecture Seule

**Modules** :

#### Module A - Gestion
- **Utilisateurs** 👥
  - Liste complète avec filtres
  - Timeline d'activité
  - Réinitialiser mot de passe
  - Désactiver/Activer compte
  - Export données
  - Traitement GDPR

- **Coaches** 🎓
  - Liste avec métriques
  - Gestion crédits
  - Modifier plans
  - Marque blanche (logo, nom, couleurs)

#### Module B - Analyses Ikigai 🎯
- Liste toutes analyses
- Filtres : date, type, entreprise, statut
- Requête brute + Réponse IA
- Signalement anomalies

#### Module C - Tarification 💳
- **B2C** :
  - Prix analyse unique
  - Bundles (3, 5, 10)
  - Upsells
  - Codes promo

- **Coach** :
  - Prix par analyse
  - Abonnements mensuels
  - Licence annuelle marque blanche
  - Packs de crédits

#### Module D - Analytique Business 📈
- **Métriques globales** :
  - Total utilisateurs
  - Total analyses
  - Taux conversion
  
- **Revenus** :
  - Mensuels / Annuels
  - MRR / ARR
  - Churn rate

- **Utilisateurs actifs** :
  - DAU / WAU / MAU
  
- **Segments** :
  - Usage particuliers
  - Usage coaches
  - Top 10 industries
  - Top 10 parcours suggérés
  - Répartition géographique

#### Module E - Support & Conformité 🎧
- **Support** :
  - Liste tickets
  - Notes internes
  - Assignation équipe
  - Statistiques

- **GDPR** 🔒 :
  - Export données utilisateur
  - Suppression définitive
  - Journal demandes

- **Logs d'Audit** 📝 :
  - Connexions
  - Modifications données
  - Échecs API
  - Échecs paiement

**Accès** :
```
https://votre-site.pages.dev/admin-dashboard.html
https://votre-site.pages.dev/admin
```

**Authentification** : Administrateur (3 niveaux de rôles)

---

## 🔐 Système d'Authentification

### Flux Général

```
1. Utilisateur accède au dashboard
   ↓
2. JavaScript vérifie JWT dans localStorage
   ↓
3. Si pas de token → Redirect /login
   ↓
4. Si token → Vérification API
   ↓
5. Si token valide → Chargement dashboard
   ↓
6. Si token invalide → Redirect /login
```

### Rôles Utilisateurs

| Rôle | Dashboard Accès | Permissions |
|------|----------------|-------------|
| **client** | Dashboard Client | Vue propre dashboard |
| **coach** | Dashboard Coach | Gestion clients, crédits |
| **admin** | Dashboard Admin | Gestion utilisateurs, tarifs, support |
| **super_admin** | Dashboard Admin | Accès total + gestion admins |
| **readonly_admin** | Dashboard Admin | Lecture seule |

### Vérification dans le Code

```javascript
// Dans chaque dashboard
document.addEventListener('DOMContentLoaded', async () => {
    // Vérifier authentification
    if (!ApiClient.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }
    
    // Vérifier le rôle
    const user = await AuthAPI.getCurrentUser();
    
    // Dashboard Admin
    if (!['admin', 'super_admin', 'readonly_admin'].includes(user.role)) {
        window.location.href = '/dashboard.html'; // Redirect
        return;
    }
    
    // Charger les données
    await loadDashboardData();
});
```

---

## 🌐 Déploiement Cloudflare Pages

### Workflow Automatique

```
GitHub Push (main branch)
    ↓
GitHub Actions trigger
    ↓
Build project (npm run build)
    ↓
Deploy to Cloudflare Pages
    ↓
Site live sur: https://ai-ikigai-dashboards.pages.dev
```

### Configuration Cloudflare

**Build Settings** :
```
Build command: npm run build
Build output directory: public
Root directory: /
```

**Environment Variables** :
```
ENVIRONMENT = production
API_BASE_URL = https://api.ai-ikigai.com
```

### Headers de Sécurité

Configurés dans `_headers` :
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security: max-age=31536000
- Permissions-Policy: geolocation=(), microphone=(), camera=()

### Redirections

Configurées dans `_redirects` :
```
/admin     →  /admin-dashboard.html
/coach     →  /coach-dashboard.html
/client    →  /dashboard.html
```

---

## 📡 Intégration API Backend

### Endpoints Requis

#### Authentification
```
POST   /api/auth/login              # Login
POST   /api/auth/register           # Inscription
GET    /api/auth/me                 # User info
POST   /api/auth/logout             # Logout
```

#### Dashboard Client
```
GET    /api/client/dashboard/:id    # Données dashboard
GET    /api/questionnaire/:id       # Résultats questionnaire
```

#### Dashboard Coach
```
GET    /api/coach/dashboard         # Stats coach
GET    /api/coach/clients           # Liste clients
GET    /api/coach/clients/:id/ikigai # Dashboard client
POST   /api/coach/clients/add-existing # Ajouter client existant
POST   /api/coach/clients/invite    # Inviter nouveau client
POST   /api/coach/credits/purchase  # Acheter crédits
```

#### Dashboard Admin
```
GET    /api/admin/stats             # Stats globales
GET    /api/admin/users             # Liste utilisateurs
GET    /api/admin/coaches           # Liste coaches
GET    /api/admin/analyses          # Liste analyses
GET    /api/admin/revenue           # Données revenus
GET    /api/admin/support/tickets   # Tickets support
GET    /api/admin/gdpr/requests     # Demandes GDPR
GET    /api/admin/audit/logs        # Logs audit
PUT    /api/admin/users/:id         # Modifier utilisateur
DELETE /api/admin/users/:id         # Supprimer utilisateur
```

### Configuration API Client

Dans `api.js` :
```javascript
const ApiClient = {
    baseURL: 'https://api.ai-ikigai.com',
    
    async get(endpoint) {
        const token = localStorage.getItem('ai-ikigai-token');
        const response = await fetch(this.baseURL + endpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.json();
    },
    
    // ... autres méthodes
};
```

---

## 🎨 Design System

### Couleurs

```css
--cyan: #00d4ff
--blue: #4169e1
--purple: #8b5cf6
--magenta: #d946ef
--pink: #ec4899
--gradient-primary: linear-gradient(135deg, cyan → blue → purple → magenta → pink)
```

### Typographie

- **Body** : Outfit (Google Fonts)
- **Headings** : Sora (Google Fonts)

### Composants Communs

- **Cards** : border-radius 16-20px, hover effects
- **Buttons** : border-radius 50px, gradient background
- **Tables** : Headers sticky, alternating rows
- **Badges** : border-radius 50px, color-coded
- **Modals** : Backdrop blur, smooth animations

---

## 📱 Responsive Design

### Breakpoints

```css
Desktop:  > 1024px    # Full layout, sidebar fixe
Tablet:   768-1024px  # Sidebar collapsible
Mobile:   < 768px     # Menu hamburger, single column
```

### Adaptations

**Desktop** :
- Sidebar fixe 280px
- Multi-column grids
- Tous les champs visibles

**Mobile** :
- Sidebar escamotable
- Tables → Cards
- Navigation simplifiée
- Touch-friendly

---

## 🔒 Sécurité

### Frontend
- JWT stocké dans localStorage
- Vérification rôle utilisateur
- HTTPS forcé
- Headers sécurité

### Backend (à implémenter)
- Validation JWT côté serveur
- Rate limiting
- CORS configuré
- Logs d'audit
- Validation des permissions

---

## 📊 Performance

### Optimisations
- Cache assets (1 an pour CSS/JS)
- No-cache pour HTML
- Lazy loading images
- Code minifié
- Compression gzip/brotli (Cloudflare)

### Métriques Cibles
- Lighthouse Score > 90
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- Cumulative Layout Shift < 0.1

---

## 🧪 Tests

### Tests à Implémenter

**Unitaires** :
- Fonctions utilitaires
- Calculs (scores, économies, etc.)
- Validation formulaires

**Intégration** :
- Appels API
- Authentification
- Navigation

**E2E** :
- Flux complets utilisateur
- Cross-browser

---

## 📈 Analytics

### Événements à Tracker

```javascript
// Dashboard Client
track('dashboard_view', { user_id, dashboard_type: 'client' });
track('download_report', { user_id });

// Dashboard Coach
track('client_added', { coach_id, method: 'existing|invite' });
track('credits_purchased', { coach_id, amount });

// Dashboard Admin
track('user_modified', { admin_id, user_id, action });
track('price_changed', { admin_id, product, old_price, new_price });
```

---

## 🚀 Roadmap

### Phase 1 - MVP (Actuel)
- [x] Dashboard Client complet
- [x] Dashboard Coach complet
- [x] Dashboard Admin (structure)
- [x] Système d'invitation
- [x] Déploiement Cloudflare

### Phase 2 - Améliorations
- [ ] Tests automatisés
- [ ] Graphiques interactifs (Chart.js)
- [ ] Export Excel/PDF
- [ ] Notifications temps réel
- [ ] Recherche globale avancée

### Phase 3 - Features Avancées
- [ ] Messagerie coach-client
- [ ] Vidéoconférence intégrée
- [ ] Templates personnalisables
- [ ] API publique
- [ ] Mobile apps (React Native)

---

## 📚 Documentation Disponible

| Fichier | Description |
|---------|-------------|
| `README.md` | Documentation principale |
| `DEPLOYMENT_README.md` | Guide déploiement complet |
| `QUICKSTART.md` | Démarrage rapide (5 min) |
| `DASHBOARD_README.md` | Doc dashboard client |
| `COACH_DASHBOARD_README.md` | Doc dashboard coach |
| `ADD_CLIENT_FLOW_COMPLETE.md` | Flux ajout client détaillé |
| `INTEGRATION_GUIDE.md` | Guide intégration technique |

---

## 🆘 Support

### Resources
- **Cloudflare Docs** : https://developers.cloudflare.com/pages
- **GitHub Issues** : (votre repo)
- **Email** : support@ai-ikigai.com

### Debugging
```bash
# Logs Cloudflare
npx wrangler pages deployment tail

# Test local
npm run dev

# Build test
npm run build
```

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Auteur** : AI-Ikigai Team

---

## ✅ Checklist Finale de Déploiement

- [ ] Tous les fichiers HTML/JS/CSS dans `/public`
- [ ] `_headers` et `_redirects` configurés
- [ ] `package.json` et `wrangler.toml` à la racine
- [ ] `.gitignore` configuré
- [ ] Repository GitHub créé et pusheconfigured
- [ ] Cloudflare Pages connecté à GitHub
- [ ] Variables d'environnement configurées
- [ ] Domaine personnalisé configuré (optionnel)
- [ ] Tests manuels effectués
- [ ] Documentation à jour

🎉 **Prêt pour la production !**
