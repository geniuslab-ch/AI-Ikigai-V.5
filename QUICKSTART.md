# 🚀 Guide de Démarrage Rapide

## Déploiement en 5 Minutes

### 1️⃣ Préparation (1 min)

```bash
# Cloner le template ou créer un nouveau dossier
mkdir ai-ikigai-dashboards
cd ai-ikigai-dashboards

# Copier tous vos fichiers dashboards ici
```

### 2️⃣ Initialisation Git (30 sec)

```bash
git init
git add .
git commit -m "Initial commit: AI-Ikigai Dashboards"
```

### 3️⃣ Push sur GitHub (1 min)

```bash
# Créer un repo sur GitHub: ai-ikigai-dashboards
# Puis :
git remote add origin https://github.com/VOTRE-USERNAME/ai-ikigai-dashboards.git
git branch -M main
git push -u origin main
```

### 4️⃣ Déploiement Cloudflare (2 min)

1. Aller sur https://dash.cloudflare.com/
2. Pages → Create a project → Connect to Git
3. Sélectionner votre repo `ai-ikigai-dashboards`
4. Configuration :
   - Build command : `npm run build`
   - Build output : `public`
   - Cliquer "Save and Deploy"

### 5️⃣ C'est Prêt ! (30 sec)

Votre site est maintenant en ligne sur :
```
https://ai-ikigai-dashboards.pages.dev
```

---

## 📋 Checklist Rapide

- [ ] Fichiers dans `/public` :
  - [ ] dashboard.html
  - [ ] dashboard.js
  - [ ] dashboard.css
  - [ ] coach-dashboard.html
  - [ ] coach-dashboard.js
  - [ ] admin-dashboard.html
  - [ ] admin-dashboard.js
  - [ ] api.js
  - [ ] invite.html
  - [ ] _headers
  - [ ] _redirects
  - [ ] 404.html
  - [ ] index.html

- [ ] Fichiers racine :
  - [ ] package.json
  - [ ] wrangler.toml
  - [ ] .gitignore

- [ ] GitHub :
  - [ ] Repo créé
  - [ ] Code pushé

- [ ] Cloudflare :
  - [ ] Compte créé
  - [ ] Projet connecté
  - [ ] Déployé

---

## 🎯 URLs des Dashboards

Une fois déployé, vos dashboards seront disponibles sur :

```
https://votre-site.pages.dev/                      # Page d'accueil
https://votre-site.pages.dev/dashboard.html        # Client
https://votre-site.pages.dev/coach-dashboard.html  # Coach
https://votre-site.pages.dev/admin-dashboard.html  # Admin
```

Ou avec des URLs simplifiées (grâce à _redirects) :

```
https://votre-site.pages.dev/client   # → dashboard.html
https://votre-site.pages.dev/coach    # → coach-dashboard.html
https://votre-site.pages.dev/admin    # → admin-dashboard.html
```

---

## ⚙️ Variables d'Environnement

Après le déploiement, configurer dans Cloudflare Dashboard :

```
Pages → ai-ikigai-dashboards → Settings → Environment variables

ENVIRONMENT = production
API_BASE_URL = https://api.ai-ikigai.com
```

---

## 🔄 Mises à Jour

Pour déployer des modifications :

```bash
# Faire vos modifications
git add .
git commit -m "Update: description"
git push

# Cloudflare redéploie automatiquement !
```

---

## 🆘 Problèmes Courants

### "Build failed"
➡️ Vérifier que `package.json` est à la racine

### "404 on pages"
➡️ Vérifier que les fichiers sont dans `/public`

### "API not working"
➡️ Configurer `API_BASE_URL` dans les variables d'environnement

---

## 📚 Documentation Complète

Pour plus de détails, voir :
- `DEPLOYMENT_README.md` - Guide complet
- `README.md` - Documentation générale

---

**Besoin d'aide ?** Consultez :
- Cloudflare Docs : https://developers.cloudflare.com/pages
- GitHub Issues : (votre repo)
