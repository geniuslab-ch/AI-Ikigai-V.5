# 🎯 AI-Ikigai

> Découvrez votre raison d'être professionnelle grâce à l'intelligence artificielle

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://lecomte0015.github.io/AI-Ikagai/)
[![GitHub Pages](https://img.shields.io/badge/deployed-GitHub%20Pages-blue)](https://lecomte0015.github.io/AI-Ikagai/)

AI-Ikigai est une application web qui aide les utilisateurs à découvrir leur Ikigai professionnel en combinant un questionnaire intelligent avec l'analyse de CV par IA. L'application génère un profil personnalisé et des recommandations de carrière adaptées.

## ✨ Fonctionnalités

### 🎨 Frontend
- **Landing Page moderne** avec animations et design premium
- **Questionnaire interactif** de 15 questions sur les passions, talents, valeurs et aspirations
- **Upload et analyse de CV** avec extraction automatique des compétences
- **Dashboard utilisateur** avec visualisation des résultats et historique des analyses
- **Pages légales** complètes (Mentions légales, Confidentialité, CGV, Contact)
- **Blog** pour articles et ressources
- **Authentification Supabase** avec gestion de profils

### 🤖 Backend
- **API Cloudflare Workers** pour traitement des requêtes
- **Analyse IA avec Claude (Anthropic)** pour génération de profils Ikigai
- **Base de données Supabase** pour stockage des utilisateurs et analyses
- **Stockage KV** pour cache et performances

### 📊 Dashboard
- Vue d'ensemble des analyses
- Historique complet des questionnaires
- Recommandations personnalisées
- Gestion du profil utilisateur

## 🛠️ Technologies

### Frontend
- **HTML5 / CSS3** - Structure et styles
- **JavaScript Vanilla** - Logique applicative
- **Supabase JS SDK** - Authentification et base de données
- **Design System** - Variables CSS personnalisées, gradients, animations

### Backend
- **Cloudflare Workers** - Serverless computing
- **Supabase** - PostgreSQL database avec Row Level Security
- **Claude AI (Anthropic)** - Analyse intelligente des profils
- **KV Storage** - Cache distribué

### Déploiement
- **Frontend** : GitHub Pages
- **Backend** : Cloudflare Workers
- **Database** : Supabase Cloud

## 📁 Structure du Projet

```
AI-Ikigai/
├── ai-ikigai-frontend/          # Application frontend
│   ├── index.html               # Page d'accueil
│   ├── questionnaire.html       # Questionnaire interactif
│   ├── dashboard-client.html    # Dashboard utilisateur
│   ├── blog.html                # Page blog
│   ├── contact.html             # Formulaire de contact
│   ├── mentions-legales.html    # Mentions légales
│   ├── confidentialite.html     # Politique de confidentialité
│   ├── cgv.html                 # Conditions générales
│   ├── login.html               # Page de connexion
│   ├── reset-password.html      # Réinitialisation mot de passe
│   ├── styles.css               # Styles globaux
│   ├── supabase-client.js       # Configuration Supabase
│   └── assets/                  # Images et ressources
│
├── ai-ikigai-backend/           # API Backend
│   ├── src/
│   │   ├── index.js             # Point d'entrée principal
│   │   └── index-standalone.js  # Version standalone
│   ├── wrangler.toml            # Configuration Cloudflare
│   └── package.json             # Dépendances Node.js
│
├── supabase-schema.sql          # Schéma de base de données
├── SUPABASE_CONFIG.md           # Documentation Supabase
└── README.md                    # Ce fichier
```

## 🚀 Installation et Déploiement

### Prérequis
- Node.js 18+
- Compte Supabase
- Compte Cloudflare (pour le backend)
- Compte GitHub (pour le déploiement)

### Configuration Frontend

1. **Cloner le repository**
```bash
git clone https://github.com/Lecomte0015/AI-Ikagai.git
cd AI-Ikigai
```

2. **Configurer Supabase**
Créez un fichier `supabase-client.js` avec vos credentials :
```javascript
const SUPABASE_URL = 'https://votre-projet.supabase.co';
const SUPABASE_ANON_KEY = 'votre-anon-key';
```

3. **Tester localement**
```bash
cd ai-ikigai-frontend
python3 -m http.server 8000
```
Ouvrez `http://localhost:8000`

4. **Déployer sur GitHub Pages**
- Pushez sur la branche `main`
- Activez GitHub Pages dans Settings → Pages
- Source : Deploy from branch `main`
- Le site sera disponible sur `https://[username].github.io/AI-Ikagai/`

### Configuration Backend

1. **Installer Wrangler CLI**
```bash
npm install -g wrangler
```

2. **Configurer les variables d'environnement**
Dans `wrangler.toml` :
```toml
[vars]
SUPABASE_URL = "https://votre-projet.supabase.co"
SUPABASE_ANON_KEY = "votre-anon-key"
```

Secrets (via dashboard Cloudflare) :
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY`

3. **Déployer**
```bash
cd ai-ikigai-backend
npm install
wrangler deploy
```

### Configuration Supabase

1. **Créer les tables**
Exécutez `supabase-schema.sql` dans l'éditeur SQL Supabase

2. **Configurer RLS (Row Level Security)**
Les policies sont incluses dans le schéma SQL

3. **Activer l'authentification**
- Email/Password
- Configuration SMTP pour emails

## 🎨 Personnalisation

### Couleurs et Design
Les variables CSS sont définies dans chaque fichier HTML :
```css
:root {
    --cyan: #00d4ff;
    --purple: #8b5cf6;
    --magenta: #d946ef;
    --dark: #0a0a0f;
    --dark-card: #12121a;
}
```

### Textes et Contenu
- Modifiez les fichiers HTML directement
- Les textes légaux sont dans `mentions-legales.html`, `confidentialite.html`, `cgv.html`

## 📊 Base de Données

### Tables Principales
- `profiles` - Profils utilisateurs
- `questionnaires` - Réponses aux questionnaires
- `analyses` - Résultats d'analyses IA
- `cv_uploads` - CVs téléchargés

### Sécurité
- Row Level Security (RLS) activé
- Policies basées sur `auth.uid()`
- Fonction `is_admin()` pour accès admin

## 🔐 Sécurité

- ✅ HTTPS obligatoire
- ✅ Authentification Supabase
- ✅ Row Level Security sur toutes les tables
- ✅ Validation des entrées côté backend
- ✅ Rate limiting sur l'API
- ✅ Secrets stockés dans Cloudflare

## 🐛 Dépannage

### Le CSS ne charge pas
Vérifiez que le chemin est `href="styles.css"` et non `href="css/styles.css"`

### Erreur 404 sur les liens
Sur GitHub Pages, utilisez des chemins relatifs : `href="index.html"` au lieu de `href="/"`

### Problèmes d'authentification
Vérifiez que les URLs Supabase sont correctes dans `supabase-client.js`

### Backend ne répond pas
Vérifiez les logs Cloudflare Workers et les variables d'environnement

## 📝 Licence

Ce projet est sous licence MIT.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

## 📧 Contact

Pour toute question : contact@ai-ikigai.com

---

**Développé avec ❤️ par l'équipe AI-Ikigai**
