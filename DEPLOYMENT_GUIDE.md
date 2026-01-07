# 🚀 Guide de Déploiement - AI-Ikigai avec Supabase

## 📋 Ce qui a été fait

✅ Base de données Supabase créée et configurée
✅ Nouveau worker avec intégration Supabase (`src/index-supabase.js`)
✅ Configuration `wrangler.toml` mise à jour
✅ `package.json` avec dépendance Supabase

---

## 🔧 Étapes de Déploiement

### 1. Installer les dépendances

```bash
cd /Users/dallyhermann/Documents/ai-ikigai/ai-ikigai-backend
npm install
```

### 2. Configurer les secrets Cloudflare

Vous devez configurer les clés secrètes (qui ne doivent PAS être dans le code) :

```bash
# Clé secrète Supabase
wrangler secret put SUPABASE_SERVICE_ROLE_KEY
# Quand demandé, collez: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cGt6ZnB2cWxjd252ZWtjeGh5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzI4MjQxMCwiZXhwIjoyMDgyODU4NDEwfQ.7LzCbcy8NcodaTxxYvB75lWY1CuZe0IXV3KemSgqiLg

# Clé API Claude (si vous l'avez déjà)
wrangler secret put ANTHROPIC_API_KEY
# Collez votre clé Claude AI

# Clé API Claude alternative (si configurée)
wrangler secret put CLAUDE_API_KEY
# Collez votre clé Claude AI
```

### 3. Tester en local

```bash
# Lancer le worker en local
wrangler dev --config wrangler.toml

# Tester le health check
curl http://localhost:8787/api/health
```

Vous devriez voir :
```json
{
  "success": true,
  "status": "ok",
  "version": "3.0.0-SUPABASE",
  "features": ["cv-analysis", "claude-ai", "supabase-auth", "dashboards"],
  "hasSupabase": true
}
```

### 4. Remplacer le fichier index.js

**Option A : Remplacer complètement** (recommandé)
```bash
# Sauvegarder l'ancien fichier
mv src/index.js src/index-old.js

# Utiliser la nouvelle version
mv src/index-supabase.js src/index.js
```

**Option B : Tester en parallèle**
```bash
# Modifier wrangler.toml pour pointer vers index-supabase.js
# Ligne 6: main = "src/index-supabase.js"
```

### 5. Déployer sur Cloudflare

```bash
# Déployer le worker
wrangler deploy

# Vérifier que c'est déployé
curl https://ai-ikagai.dallyhermann-71e.workers.dev/api/health
```

---

## 🧪 Tester les Nouveaux Endpoints

### Test 1 : Health Check
```bash
curl https://ai-ikagai.dallyhermann-71e.workers.dev/api/health
```

### Test 2 : Soumettre un questionnaire (existant)
```bash
curl -X POST https://ai-ikagai.dallyhermann-71e.workers.dev/api/questionnaire/submit \
  -H "Content-Type: application/json" \
  -d '{
    "answers": {
      "1": "create",
      "2": "tech",
      "3": "innovation"
    },
    "email": "test@example.com"
  }'
```

### Test 3 : Dashboard Client (NOUVEAU - nécessite authentification)
```bash
# D'abord, créer un utilisateur dans Supabase
# Ensuite, récupérer le token JWT
# Puis:
curl https://ai-ikagai.dallyhermann-71e.workers.dev/api/dashboard/client \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

### Test 4 : Dashboard Admin (NOUVEAU)
```bash
# Nécessite un utilisateur avec role='admin' dans Supabase
curl https://ai-ikagai.dallyhermann-71e.workers.dev/api/dashboard/admin/stats \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN"
```

---

## 📊 Nouveaux Endpoints Disponibles

### Dashboard Client
- `GET /api/dashboard/client` - Récupérer toutes les analyses de l'utilisateur

### Dashboard Coach
- `GET /api/dashboard/coach` - Statistiques et liste des clients
- `POST /api/dashboard/coach/clients/add` - Ajouter un client
- `GET /api/dashboard/coach/clients/:clientId` - Voir les analyses d'un client

### Dashboard Admin
- `GET /api/dashboard/admin/stats` - Statistiques globales
- `GET /api/dashboard/admin/users` - Liste de tous les utilisateurs
- `PUT /api/dashboard/admin/users/:userId` - Modifier un utilisateur

### Questionnaire (modifiés)
- `POST /api/questionnaire/submit` - Maintenant stocke aussi dans Supabase
- `POST /api/questionnaire/upload-cv` - Maintenant stocke aussi dans Supabase
- `GET /api/questionnaire/:id` - Récupère depuis KV ou Supabase

---

## 🔐 Créer un Utilisateur Admin de Test

Dans le SQL Editor de Supabase, exécutez :

```sql
-- Créer un utilisateur admin
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@ai-ikigai.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Mettre à jour le profil pour avoir le rôle admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'admin@ai-ikigai.com';
```

Ensuite vous pourrez vous connecter avec :
- Email: `admin@ai-ikigai.com`
- Mot de passe: `admin123`

---

## ⚠️ Problèmes Courants

### Erreur "Supabase not configured"
- Vérifiez que `SUPABASE_URL` et `SUPABASE_ANON_KEY` sont dans `wrangler.toml`
- Vérifiez que `SUPABASE_SERVICE_ROLE_KEY` est configuré comme secret

### Erreur "Token invalide"
- Le token JWT doit être valide et non expiré
- Utilisez Supabase Auth pour générer des tokens valides

### Erreur "Accès refusé"
- Vérifiez que l'utilisateur a le bon rôle dans la table `profiles`
- Les rôles sont : `client`, `coach`, `admin`, `super_admin`

---

## 📝 Prochaines Étapes

1. ✅ Déployer le worker avec Supabase
2. ⏳ Créer les pages frontend (login, dashboards)
3. ⏳ Connecter le frontend au nouveau backend
4. ⏳ Tester le flux complet

---

## 🆘 Besoin d'Aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs : `wrangler tail`
2. Testez en local : `wrangler dev`
3. Vérifiez la console Supabase pour les erreurs de base de données

**Faites-moi signe une fois le worker déployé et je continuerai avec le frontend !** 🚀
