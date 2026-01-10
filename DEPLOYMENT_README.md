# AI-Ikigai Dashboards - Déploiement

## 📋 Vue d'ensemble

Ce projet contient trois tableaux de bord pour la plateforme AI-Ikigai :
- **Dashboard Client (B2C)** : Interface pour les utilisateurs finaux
- **Dashboard Coach** : Interface pour les coachs professionnels
- **Dashboard Admin** : Interface d'administration complète

## 🗂️ Structure du Projet

```
ai-ikigai-dashboards/
├── public/                          # Fichiers statiques (à déployer)
│   ├── dashboard.html               # Dashboard client B2C
│   ├── dashboard.js                 # Logic dashboard client
│   ├── dashboard.css                # Styles dashboard client
│   │
│   ├── coach-dashboard.html         # Dashboard coach
│   ├── coach-dashboard.js           # Logic dashboard coach
│   │
│   ├── admin-dashboard.html         # Dashboard admin
│   ├── admin-dashboard.js           # Logic dashboard admin
│   │
│   ├── api.js                       # Client API commun
│   ├── invite.html                  # Page d'invitation clients
│   ├── add-client-modal.html        # Modal ajout client (coach)
│   ├── add-client-functions.js      # Logic ajout client
│   │
│   ├── _headers                     # Headers HTTP
│   ├── _redirects                   # Redirections
│   └── 404.html                     # Page 404 (à créer)
│
├── package.json                     # Configuration npm
├── wrangler.toml                    # Configuration Cloudflare
├── .gitignore                       # Fichiers à ignorer
└── README.md                        # Ce fichier
```

## 🚀 Déploiement via GitHub et Cloudflare Pages

### Prérequis

- Compte GitHub
- Compte Cloudflare
- Node.js 18+ installé localement (pour le développement)

### Étape 1 : Préparation du Repository GitHub

1. **Créer un nouveau repository sur GitHub**
   ```bash
   # Sur github.com, créez un repo "ai-ikigai-dashboards"
   ```

2. **Cloner et organiser les fichiers**
   ```bash
   git clone https://github.com/votre-username/ai-ikigai-dashboards.git
   cd ai-ikigai-dashboards
   ```

3. **Créer la structure des dossiers**
   ```bash
   mkdir -p public
   ```

4. **Copier tous les fichiers dashboards dans /public**
   ```bash
   # Copier tous les fichiers HTML, JS, CSS dans public/
   cp dashboard.html public/
   cp dashboard.js public/
   cp dashboard.css public/
   cp coach-dashboard.html public/
   cp coach-dashboard.js public/
   cp admin-dashboard.html public/
   cp admin-dashboard.js public/
   cp api.js public/
   cp invite.html public/
   cp add-client-modal.html public/
   cp add-client-functions.js public/
   cp _headers public/
   cp _redirects public/
   ```

5. **Copier les fichiers de configuration à la racine**
   ```bash
   cp package.json ./
   cp wrangler.toml ./
   cp .gitignore ./
   ```

6. **Créer une page 404 simple**
   ```bash
   cat > public/404.html << 'EOF'
   <!DOCTYPE html>
   <html lang="fr">
   <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <title>404 - Page non trouvée | AI-Ikigai</title>
       <style>
           body {
               font-family: 'Outfit', sans-serif;
               background: #0a0a0f;
               color: #f8fafc;
               display: flex;
               align-items: center;
               justify-content: center;
               min-height: 100vh;
               margin: 0;
               text-align: center;
           }
           .container {
               max-width: 600px;
               padding: 2rem;
           }
           h1 {
               font-size: 6rem;
               background: linear-gradient(90deg, #00d4ff 0%, #d946ef 100%);
               -webkit-background-clip: text;
               -webkit-text-fill-color: transparent;
               margin: 0;
           }
           h2 {
               font-size: 2rem;
               margin: 1rem 0;
           }
           p {
               color: #94a3b8;
               margin-bottom: 2rem;
           }
           a {
               display: inline-block;
               background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #ec4899 100%);
               color: white;
               padding: 1rem 2rem;
               border-radius: 50px;
               text-decoration: none;
               font-weight: 600;
           }
       </style>
   </head>
   <body>
       <div class="container">
           <h1>404</h1>
           <h2>Page non trouvée</h2>
           <p>La page que vous recherchez n'existe pas ou a été déplacée.</p>
           <a href="/">Retour à l'accueil</a>
       </div>
   </body>
   </html>
   EOF
   ```

7. **Commit et push**
   ```bash
   git add .
   git commit -m "Initial commit: AI-Ikigai Dashboards"
   git push origin main
   ```

### Étape 2 : Configuration Cloudflare Pages

1. **Connecter GitHub à Cloudflare**
   - Aller sur https://dash.cloudflare.com/
   - Pages → Create a project
   - Connect to Git → Sélectionner votre repository GitHub
   - Autoriser l'accès Cloudflare

2. **Configuration du Build**
   ```
   Project name: ai-ikigai-dashboards
   Production branch: main
   Build command: npm run build
   Build output directory: public
   ```

3. **Variables d'environnement** (Pages → Settings → Environment variables)
   ```
   ENVIRONMENT = production
   API_BASE_URL = https://api.ai-ikigai.com
   ```

4. **Déployer**
   - Cliquer sur "Save and Deploy"
   - Le site sera disponible sur : https://ai-ikigai-dashboards.pages.dev

### Étape 3 : Configuration du Domaine Personnalisé

1. **Ajouter un domaine custom**
   - Pages → ai-ikigai-dashboards → Custom domains
   - Add custom domain
   - Entrer : `dashboards.ai-ikigai.com`

2. **Configurer le DNS**
   - Cloudflare créera automatiquement un enregistrement CNAME
   - Si votre domaine est sur Cloudflare : automatique
   - Sinon : ajouter manuellement :
     ```
     CNAME   dashboards   ai-ikigai-dashboards.pages.dev
     ```

3. **Activer HTTPS**
   - Cloudflare gère automatiquement le certificat SSL
   - Force HTTPS dans les paramètres

### Étape 4 : Configuration des Sous-domaines (Optionnel)

Pour avoir des URLs dédiées par dashboard :

```
client.ai-ikigai.com  → /dashboard.html
coach.ai-ikigai.com   → /coach-dashboard.html
admin.ai-ikigai.com   → /admin-dashboard.html
```

**Option A : Utiliser Cloudflare Workers**
```javascript
// Dans un Worker Cloudflare
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.hostname === 'client.ai-ikigai.com') {
      return fetch('https://dashboards.ai-ikigai.com/dashboard.html');
    }
    if (url.hostname === 'coach.ai-ikigai.com') {
      return fetch('https://dashboards.ai-ikigai.com/coach-dashboard.html');
    }
    if (url.hostname === 'admin.ai-ikigai.com') {
      return fetch('https://dashboards.ai-ikigai.com/admin-dashboard.html');
    }
    
    return fetch(request);
  }
}
```

**Option B : Utiliser les redirections Cloudflare**
- Dans le Dashboard Cloudflare → Rules → Redirect Rules
- Créer une règle par sous-domaine

## 🔄 Workflow de Développement

### Développement Local

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Le site sera accessible sur http://localhost:8788
```

### Déploiement Automatique

Chaque push sur `main` déclenche automatiquement un déploiement :

```bash
# Faire des modifications
git add .
git commit -m "Update: description des changements"
git push origin main

# Cloudflare Pages rebuild et déploie automatiquement
```

### Déploiement de Preview

Pour tester avant de merger sur main :

```bash
# Créer une branche
git checkout -b feature/nouvelle-fonctionnalite

# Faire des modifications et push
git push origin feature/nouvelle-fonctionnalite

# Cloudflare créera automatiquement une URL de preview :
# https://nouvelle-fonctionnalite.ai-ikigai-dashboards.pages.dev
```

### Rollback

En cas de problème :

1. Dans Cloudflare Dashboard → Pages → Deployments
2. Trouver le déploiement précédent qui fonctionnait
3. Cliquer sur "..." → "Rollback to this deployment"

## 🔐 Sécurité

### Headers de Sécurité

Les headers de sécurité sont configurés dans `_headers` :
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection
- Strict-Transport-Security
- Permissions-Policy

### Authentification

Les dashboards vérifient l'authentification côté client :
- JWT stocké dans localStorage
- Vérification du rôle utilisateur
- Redirection vers /login si non authentifié

⚠️ **Important** : L'authentification côté client n'est pas suffisante en production. Vous devez :
1. Implémenter l'authentification côté backend (API)
2. Valider les tokens JWT sur chaque requête API
3. Vérifier les permissions côté serveur

## 📊 Monitoring

### Analytics Cloudflare

Cloudflare Pages inclut des analytics gratuites :
- Visites par page
- Origine du trafic
- Performance
- Bande passante

Accès : Pages → ai-ikigai-dashboards → Analytics

### Logs

Pour voir les logs :
```bash
npx wrangler pages deployment tail --project-name=ai-ikigai-dashboards
```

## 🐛 Debugging

### Logs de Build

Si le déploiement échoue :
1. Dashboard Cloudflare → Pages → Deployments
2. Cliquer sur le déploiement échoué
3. Voir les logs de build

### Erreurs Communes

**Error: "Build command failed"**
- Vérifier que `package.json` est à la racine
- Vérifier que Node.js 18+ est configuré

**Error: "404 Not Found"**
- Vérifier que les fichiers sont dans `/public`
- Vérifier les redirections dans `_redirects`

**Error: "API calls failing"**
- Vérifier `API_BASE_URL` dans les variables d'environnement
- Vérifier CORS sur l'API backend

## 📝 Checklist de Déploiement

### Avant le Déploiement

- [ ] Tous les fichiers HTML/JS/CSS sont dans `/public`
- [ ] `_headers` et `_redirects` sont dans `/public`
- [ ] `package.json` et `wrangler.toml` sont à la racine
- [ ] `.gitignore` est configuré
- [ ] Page 404.html existe
- [ ] Variables d'environnement définies
- [ ] Tests locaux avec `npm run dev`

### Après le Déploiement

- [ ] Site accessible sur URL Cloudflare
- [ ] Toutes les pages se chargent
- [ ] API calls fonctionnent
- [ ] Authentification fonctionne
- [ ] Responsive sur mobile
- [ ] HTTPS actif
- [ ] Domaine custom configuré (si applicable)
- [ ] Analytics configurées

## 🆘 Support

### Documentation

- **Cloudflare Pages** : https://developers.cloudflare.com/pages
- **Wrangler CLI** : https://developers.cloudflare.com/workers/wrangler
- **AI-Ikigai Docs** : (votre documentation interne)

### Commandes Utiles

```bash
# Voir les déploiements
npx wrangler pages deployment list --project-name=ai-ikigai-dashboards

# Voir les logs en temps réel
npx wrangler pages deployment tail

# Déployer manuellement
npm run deploy

# Déployer une preview
npm run preview
```

## 🚀 Prochaines Étapes

1. **CI/CD avancé** : Ajouter tests automatiques avant déploiement
2. **A/B Testing** : Utiliser Cloudflare Workers pour A/B tests
3. **CDN** : Optimiser les assets avec Cloudflare Images
4. **Monitoring** : Intégrer Sentry ou LogRocket
5. **Performance** : Optimiser avec Lighthouse

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Maintenu par** : AI-Ikigai Team
