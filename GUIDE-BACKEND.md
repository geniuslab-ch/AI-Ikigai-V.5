# 🔧 AI-Ikigai Backend - Guide de Déploiement Cloudflare Workers

## 📋 Table des matières

1. [Architecture](#architecture)
2. [Prérequis](#prérequis)
3. [Installation locale](#installation-locale)
4. [Configuration Cloudflare](#configuration-cloudflare)
5. [Configuration des services externes](#configuration-des-services-externes)
6. [Déploiement](#déploiement)
7. [Connexion Frontend-Backend](#connexion-frontend-backend)
8. [API Reference](#api-reference)
9. [Maintenance](#maintenance)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│                   (Cloudflare Pages)                            │
│                  https://ai-ikigai.com                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      CLOUDFLARE WORKER                          │
│                    (ai-ikigai-api)                              │
│                https://api.ai-ikigai.com                        │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Auth      │  │ Questionnaire│  │   Payment    │          │
│  │   Routes     │  │    Routes    │  │   Routes     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│  D1 Database│      │  R2 Storage │      │   Stripe    │
│  (SQLite)   │      │   (CVs)     │      │  (Payments) │
└─────────────┘      └─────────────┘      └─────────────┘
                              │
                              ▼
                     ┌─────────────┐
                     │   Resend    │
                     │  (Emails)   │
                     └─────────────┘
```

---

## ✅ Prérequis

1. **Compte Cloudflare** (gratuit) : https://cloudflare.com
2. **Node.js** (v18+) : https://nodejs.org
3. **Wrangler CLI** : Outil Cloudflare pour les Workers
4. **Compte Stripe** : Pour les paiements (optionnel au début)
5. **Compte Resend** : Pour les emails (optionnel au début)

---

## 💻 Installation locale

### 1. Cloner ou créer le projet

```bash
# Créer le dossier
mkdir ai-ikigai-backend
cd ai-ikigai-backend

# Initialiser npm
npm init -y

# Installer Wrangler
npm install -D wrangler
```

### 2. Copier les fichiers

Copiez ces fichiers dans votre dossier :
- `src/index.js` - Code principal du Worker
- `wrangler.toml` - Configuration Wrangler
- `schema.sql` - Schéma de la base de données
- `package.json` - Dépendances

### 3. Se connecter à Cloudflare

```bash
npx wrangler login
```

Cela ouvrira un navigateur pour vous authentifier.

---

## ☁️ Configuration Cloudflare

### 1. Créer la base de données D1

```bash
# Créer la base D1
npx wrangler d1 create ai-ikigai-db
```

Vous recevrez un ID de base de données. **Copiez-le !**

Exemple de sortie :
```
✅ Successfully created DB 'ai-ikigai-db'

[[d1_databases]]
binding = "DB"
database_name = "ai-ikigai-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 2. Mettre à jour wrangler.toml

Remplacez `YOUR_D1_DATABASE_ID` dans `wrangler.toml` par l'ID reçu :

```toml
[[d1_databases]]
binding = "DB"
database_name = "ai-ikigai-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # Votre ID ici
```

### 3. Créer les tables

```bash
# En local (pour tester)
npx wrangler d1 execute ai-ikigai-db --file=./schema.sql --local

# En production
npx wrangler d1 execute ai-ikigai-db --file=./schema.sql --remote
```

### 4. Créer le bucket R2 (stockage CVs)

```bash
npx wrangler r2 bucket create ai-ikigai-cvs
```

### 5. Configurer les secrets

```bash
# Clé JWT (générez une clé sécurisée)
echo "votre-cle-secrete-tres-longue-et-aleatoire" | npx wrangler secret put JWT_SECRET

# URL du frontend
echo "https://ai-ikigai.com" | npx wrangler secret put FRONTEND_URL
```

---

## 🔌 Configuration des services externes

### Stripe (Paiements)

1. Créez un compte sur https://stripe.com
2. Allez dans **Developers > API Keys**
3. Copiez la clé secrète (sk_live_xxx ou sk_test_xxx)

```bash
npx wrangler secret put STRIPE_SECRET_KEY
# Collez votre clé secrète Stripe
```

4. Créez les produits et prix dans Stripe Dashboard :
   - Produit "Essentiel" à 29€
   - Produit "Premium" à 99€

5. Récupérez les Price IDs et configurez :

```bash
npx wrangler secret put STRIPE_PRICE_ESSENTIAL
# Collez price_xxx pour l'offre Essentiel

npx wrangler secret put STRIPE_PRICE_PREMIUM
# Collez price_xxx pour l'offre Premium
```

6. Configurez le webhook Stripe :
   - Allez dans **Developers > Webhooks**
   - Ajoutez un endpoint : `https://api.ai-ikigai.com/api/payment/webhook`
   - Sélectionnez l'événement : `checkout.session.completed`

### Resend (Emails)

1. Créez un compte sur https://resend.com
2. Vérifiez votre domaine
3. Récupérez votre API Key

```bash
npx wrangler secret put RESEND_API_KEY
# Collez votre clé API Resend

npx wrangler secret put EMAIL_FROM
# Ex: AI-Ikigai <noreply@ai-ikigai.com>
```

---

## 🚀 Déploiement

### Déploiement initial

```bash
# Déployer le Worker
npx wrangler deploy
```

Vous recevrez une URL comme : `https://ai-ikigai-api.votre-compte.workers.dev`

### Configuration du domaine personnalisé

1. Dans **Cloudflare Dashboard > Workers & Pages**
2. Cliquez sur votre Worker `ai-ikigai-api`
3. Onglet **Settings > Triggers**
4. Section **Custom Domains** → **Add Custom Domain**
5. Entrez : `api.ai-ikigai.com`

### Vérifier le déploiement

```bash
curl https://api.ai-ikigai.com/api/health
```

Réponse attendue :
```json
{"status":"ok","timestamp":"2024-..."}
```

---

## 🔗 Connexion Frontend-Backend

### 1. Mettre à jour le frontend

Modifiez `js/main.js` et `js/questionnaire.js` pour utiliser l'API :

**js/config.js** (nouveau fichier à créer) :
```javascript
// Configuration de l'API
const API_CONFIG = {
    baseUrl: 'https://api.ai-ikigai.com',
    // En développement local :
    // baseUrl: 'http://localhost:8787',
};

export default API_CONFIG;
```

### 2. Exemple d'appel API dans le questionnaire

Modifiez `js/questionnaire.js` pour envoyer les données au backend :

```javascript
// Ajouter en haut du fichier
const API_URL = 'https://api.ai-ikigai.com';

// Modifier la fonction startAnalysis()
async function startAnalysis() {
    cvUploadSection.classList.remove('active');
    progressSection.style.display = 'none';
    analyzingSection.classList.add('active');

    try {
        // Envoyer les réponses au backend
        const response = await fetch(`${API_URL}/api/questionnaire/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                answers: answers,
                email: userEmail // Si collecté
            })
        });

        const data = await response.json();
        
        if (data.success) {
            // Sauvegarder l'ID du questionnaire
            localStorage.setItem('questionnaireId', data.questionnaireId);
            
            // Afficher les résultats avec l'analyse du backend
            displayResults(data.analysis);
        }
    } catch (error) {
        console.error('Erreur:', error);
    }
}
```

### 3. Exemple d'upload CV

```javascript
async function uploadCV(file) {
    const formData = new FormData();
    formData.append('cv', file);
    formData.append('questionnaireId', localStorage.getItem('questionnaireId'));

    const response = await fetch(`${API_URL}/api/questionnaire/upload-cv`, {
        method: 'POST',
        body: formData
    });

    return await response.json();
}
```

### 4. Inscription newsletter (B2B)

Dans `js/main.js` :

```javascript
if (notifyForm) {
    notifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('notifyEmail').value;
        
        try {
            const response = await fetch(`${API_URL}/api/newsletter/subscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            const data = await response.json();
            
            if (data.success) {
                showToast('Inscription réussie !');
            }
        } catch (error) {
            showToast('Erreur, veuillez réessayer.');
        }
    });
}
```

---

## 📚 API Reference

### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Créer un compte |
| `/api/auth/login` | POST | Se connecter |
| `/api/auth/me` | GET | Obtenir l'utilisateur courant |

### Questionnaire

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/questionnaire/submit` | POST | Soumettre les réponses |
| `/api/questionnaire/upload-cv` | POST | Uploader un CV |
| `/api/questionnaire/:id` | GET | Récupérer un questionnaire |

### Payment

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payment/create-checkout` | POST | Créer une session Stripe |
| `/api/payment/webhook` | POST | Webhook Stripe |

### Newsletter

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/newsletter/subscribe` | POST | S'inscrire à la newsletter |

### Exemple de requêtes

**Inscription :**
```bash
curl -X POST https://api.ai-ikigai.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"secret123","name":"John"}'
```

**Soumettre questionnaire :**
```bash
curl -X POST https://api.ai-ikigai.com/api/questionnaire/submit \
  -H "Content-Type: application/json" \
  -d '{"answers":{"1":["create","teach"],"2":"tech",...}}'
```

---

## 🔧 Maintenance

### Logs en temps réel

```bash
npx wrangler tail
```

### Mettre à jour le Worker

```bash
# Après modification du code
npx wrangler deploy
```

### Consulter la base de données

```bash
# Requête SQL
npx wrangler d1 execute ai-ikigai-db --command "SELECT * FROM users LIMIT 10" --remote
```

### Backup de la base

```bash
npx wrangler d1 backup create ai-ikigai-db
```

### Variables d'environnement via Dashboard

1. Cloudflare Dashboard > Workers & Pages
2. Cliquez sur `ai-ikigai-api`
3. Settings > Variables
4. Ajoutez/modifiez les variables

---

## 🔒 Sécurité

- ✅ Tous les mots de passe sont hashés (SHA-256)
- ✅ Authentification par JWT
- ✅ CORS configuré
- ✅ Headers de sécurité
- ✅ Validation des entrées

### Recommandations supplémentaires

1. **Rate Limiting** : Ajoutez Cloudflare Rate Limiting
2. **WAF** : Activez le Web Application Firewall
3. **Monitoring** : Configurez les alertes Cloudflare

---

## 📝 Checklist de déploiement

- [ ] Wrangler installé et connecté
- [ ] Base D1 créée
- [ ] Tables créées (`schema.sql` exécuté)
- [ ] Bucket R2 créé
- [ ] JWT_SECRET configuré
- [ ] FRONTEND_URL configuré
- [ ] Worker déployé
- [ ] Domaine personnalisé configuré (api.ai-ikigai.com)
- [ ] Test endpoint /api/health
- [ ] Stripe configuré (optionnel)
- [ ] Resend configuré (optionnel)
- [ ] Frontend mis à jour pour appeler l'API

---

## 🆘 Dépannage

### Erreur "D1 database not found"

Vérifiez que l'ID de la base dans `wrangler.toml` est correct.

### Erreur CORS

Vérifiez que `FRONTEND_URL` est bien configuré et correspond à votre domaine.

### Les emails ne partent pas

1. Vérifiez que `RESEND_API_KEY` est configuré
2. Vérifiez que votre domaine est vérifié sur Resend

### Paiements Stripe échouent

1. Vérifiez les clés API (test vs live)
2. Vérifiez les Price IDs
3. Consultez les logs Stripe Dashboard

---

**Bonne mise en production ! 🚀**
