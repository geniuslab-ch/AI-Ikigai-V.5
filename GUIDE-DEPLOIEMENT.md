# 🚀 AI-Ikigai - Guide de Déploiement

## 📋 Table des matières

1. [Structure du projet](#structure-du-projet)
2. [Prérequis](#prérequis)
3. [Étape 1 : Configuration GitHub](#étape-1--configuration-github)
4. [Étape 2 : Configuration Cloudflare Pages](#étape-2--configuration-cloudflare-pages)
5. [Étape 3 : Configuration du domaine sur Infomaniak](#étape-3--configuration-du-domaine-sur-infomaniak)
6. [Étape 4 : Personnalisation](#étape-4--personnalisation)
7. [Maintenance](#maintenance)

---

## 📁 Structure du projet

```
ai-ikigai-deploy/
├── index.html              # Page d'accueil principale
├── questionnaire.html      # Page du questionnaire Ikigai
├── mentions-legales.html   # Mentions légales
├── confidentialite.html    # Politique de confidentialité
├── cgv.html               # Conditions générales de vente
├── robots.txt             # Instructions pour les moteurs de recherche
├── sitemap.xml            # Plan du site pour le SEO
├── _headers               # Configuration des headers Cloudflare
├── _redirects             # Redirections Cloudflare
├── _routes.json           # Configuration des routes Cloudflare
├── css/
│   ├── styles.css         # Styles de la page principale
│   └── questionnaire.css  # Styles du questionnaire
├── js/
│   ├── main.js            # JavaScript principal
│   └── questionnaire.js   # JavaScript du questionnaire
└── assets/
    └── favicon.svg        # Favicon du site
```

---

## ✅ Prérequis

Avant de commencer, assurez-vous d'avoir :

- [ ] Un compte GitHub (gratuit) : https://github.com
- [ ] Un compte Cloudflare (gratuit) : https://cloudflare.com
- [ ] Un nom de domaine chez Infomaniak
- [ ] Accès à la console d'administration Infomaniak

---

## 📦 Étape 1 : Configuration GitHub

### 1.1 Créer un nouveau repository

1. Connectez-vous à GitHub
2. Cliquez sur le bouton **"+"** en haut à droite → **"New repository"**
3. Configurez le repository :
   - **Repository name** : `ai-ikigai`
   - **Description** : `Site web AI-Ikigai - Découvrez votre raison d'être`
   - **Visibility** : Private (recommandé) ou Public
   - Cochez **"Add a README file"**
4. Cliquez sur **"Create repository"**

### 1.2 Uploader les fichiers

**Option A : Via l'interface GitHub (plus simple)**

1. Dans votre repository, cliquez sur **"Add file"** → **"Upload files"**
2. Glissez-déposez tous les fichiers du dossier `ai-ikigai-deploy`
3. Ajoutez un message de commit : `Initial commit - AI-Ikigai website`
4. Cliquez sur **"Commit changes"**

**Option B : Via Git en ligne de commande**

```bash
# Cloner le repository
git clone https://github.com/VOTRE_USERNAME/ai-ikigai.git
cd ai-ikigai

# Copier les fichiers du dossier ai-ikigai-deploy dans ce dossier

# Ajouter tous les fichiers
git add .

# Commit
git commit -m "Initial commit - AI-Ikigai website"

# Push
git push origin main
```

---

## ☁️ Étape 2 : Configuration Cloudflare Pages

### 2.1 Connecter GitHub à Cloudflare

1. Allez sur https://dash.cloudflare.com
2. Dans le menu de gauche, cliquez sur **"Workers & Pages"**
3. Cliquez sur **"Create application"**
4. Sélectionnez **"Pages"**
5. Cliquez sur **"Connect to Git"**
6. Autorisez Cloudflare à accéder à votre compte GitHub
7. Sélectionnez le repository `ai-ikigai`

### 2.2 Configurer le build

Dans l'écran de configuration :

| Paramètre | Valeur |
|-----------|--------|
| **Project name** | `ai-ikigai` |
| **Production branch** | `main` |
| **Framework preset** | `None` |
| **Build command** | *(laisser vide)* |
| **Build output directory** | `/` |

Cliquez sur **"Save and Deploy"**

### 2.3 Attendre le déploiement

- Cloudflare va automatiquement déployer votre site
- Vous recevrez une URL temporaire : `ai-ikigai.pages.dev`
- Testez le site pour vérifier que tout fonctionne

---

## 🌐 Étape 3 : Configuration du domaine sur Infomaniak

### 3.1 Ajouter le domaine sur Cloudflare Pages

1. Dans Cloudflare Pages, allez dans votre projet `ai-ikigai`
2. Onglet **"Custom domains"**
3. Cliquez sur **"Set up a custom domain"**
4. Entrez votre domaine : `ai-ikigai.com` (ou votre domaine)
5. Cloudflare vous donnera des instructions DNS

### 3.2 Configurer les DNS chez Infomaniak

1. Connectez-vous à https://manager.infomaniak.com
2. Allez dans **"Noms de domaine"**
3. Sélectionnez votre domaine
4. Cliquez sur **"Zone DNS"**

**Ajoutez ces enregistrements :**

| Type | Nom | Valeur | TTL |
|------|-----|--------|-----|
| CNAME | @ | `ai-ikigai.pages.dev` | 3600 |
| CNAME | www | `ai-ikigai.pages.dev` | 3600 |

> ⚠️ **Note** : Si vous ne pouvez pas créer un CNAME pour `@`, utilisez plutôt un enregistrement A avec l'IP fournie par Cloudflare.

### 3.3 Méthode alternative : Utiliser Cloudflare comme DNS

Pour de meilleures performances, vous pouvez transférer la gestion DNS à Cloudflare :

1. Sur Cloudflare, ajoutez votre site dans **"Websites"**
2. Cloudflare vous donnera 2 nameservers
3. Sur Infomaniak, allez dans votre domaine → **"Serveurs DNS"**
4. Remplacez les nameservers par ceux de Cloudflare :
   - `xxx.ns.cloudflare.com`
   - `yyy.ns.cloudflare.com`
5. Attendez la propagation DNS (jusqu'à 48h)

### 3.4 Activer HTTPS

- Cloudflare génère automatiquement un certificat SSL gratuit
- Allez dans **"SSL/TLS"** sur Cloudflare
- Sélectionnez le mode **"Full (strict)"**

---

## ✏️ Étape 4 : Personnalisation

### 4.1 Fichiers à personnaliser OBLIGATOIREMENT

Modifiez ces fichiers avec vos informations :

**`index.html`** :
- Remplacez l'URL `https://ai-ikigai.com` par votre domaine
- Mettez à jour les liens des réseaux sociaux

**`mentions-legales.html`** :
- `[Nom de votre société]`
- `[Adresse complète]`
- `[Numéro SIRET/SIREN]`
- `[Email de contact]`
- `[Nom du directeur]`

**`confidentialite.html`** :
- Toutes les occurrences de `[...]`
- Votre email de contact

**`cgv.html`** :
- Informations de votre société
- Coordonnées du médiateur

**`sitemap.xml`** :
- Remplacez `https://ai-ikigai.com` par votre domaine

### 4.2 Ajouter votre logo

1. Créez une image `og-image.png` (1200x630px) pour les réseaux sociaux
2. Créez `apple-touch-icon.png` (180x180px)
3. Uploadez-les dans le dossier `assets/`

### 4.3 Ajouter Google Analytics (optionnel)

Ajoutez ce code juste avant `</head>` dans `index.html` et `questionnaire.html` :

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

Remplacez `G-XXXXXXXXXX` par votre ID Google Analytics.

---

## 🔧 Maintenance

### Mise à jour du site

1. Modifiez les fichiers localement
2. Committez et pushez sur GitHub :

```bash
git add .
git commit -m "Description de la modification"
git push origin main
```

3. Cloudflare redéploie automatiquement (1-2 minutes)

### Vérifier le déploiement

- Allez sur Cloudflare Pages → Votre projet → **"Deployments"**
- Vérifiez que le dernier déploiement est en status "Success"

### Rollback (retour en arrière)

Si une mise à jour cause des problèmes :
1. Cloudflare Pages → Deployments
2. Trouvez un déploiement précédent qui fonctionnait
3. Cliquez sur les 3 points → **"Rollback to this deployment"**

---

## 🆘 Dépannage

### Le site n'est pas accessible

1. Vérifiez que le déploiement Cloudflare est réussi
2. Vérifiez la propagation DNS : https://dnschecker.org
3. Attendez jusqu'à 48h pour la propagation complète

### Erreur 404 sur les pages

1. Vérifiez que tous les fichiers sont bien uploadés
2. Vérifiez les noms de fichiers (sensibles à la casse)

### Les styles ne s'affichent pas

1. Vérifiez que le dossier `css/` existe avec les fichiers
2. Videz le cache de votre navigateur (Ctrl+Shift+R)

### Le formulaire de notification ne fonctionne pas

Le formulaire est actuellement en mode "démonstration". Pour le faire fonctionner :
1. Créez un backend (Netlify Functions, Cloudflare Workers, ou autre)
2. Configurez un service d'email (SendGrid, Mailgun, etc.)
3. Modifiez `main.js` pour appeler votre API

---

## 📞 Support

Pour toute question technique :
- Cloudflare : https://support.cloudflare.com
- GitHub : https://support.github.com
- Infomaniak : https://support.infomaniak.com

---

## 📝 Checklist de lancement

- [ ] Repository GitHub créé
- [ ] Fichiers uploadés
- [ ] Cloudflare Pages configuré
- [ ] Domaine personnalisé ajouté
- [ ] DNS configurés chez Infomaniak
- [ ] HTTPS activé
- [ ] Mentions légales personnalisées
- [ ] Politique de confidentialité personnalisée
- [ ] CGV personnalisées
- [ ] Logo et images ajoutés
- [ ] Test complet du site
- [ ] Test du questionnaire
- [ ] Test sur mobile
- [ ] Google Analytics configuré (optionnel)

---

**Bonne mise en ligne ! 🎉**
