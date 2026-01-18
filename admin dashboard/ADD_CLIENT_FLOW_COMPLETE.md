# Flux d'Ajout de Client - Documentation Complète

## 📋 Vue d'ensemble

Le système d'ajout de client permet aux coachs d'associer des clients existants ou d'inviter de nouveaux clients à rejoindre AI-Ikigai. Voici les deux scénarios possibles :

## 🔄 Scénario 1 : Client Existant

### Description
Associer un client qui possède déjà un compte AI-Ikigai et qui a complété son questionnaire.

### Flux Détaillé

```
1. Coach clique sur "➕ Nouveau client"
   └─> Modal s'ouvre avec 2 onglets

2. Coach sélectionne l'onglet "Client Existant"
   └─> Formulaire avec champ email

3. Coach entre l'email du client
   └─> Clic sur "Ajouter le client"

4. Frontend envoie requête POST /api/coach/clients/add-existing
   └─> Backend vérifie :
       ├─> Coach existe et a le rôle "coach" ✓
       ├─> Client existe avec cet email ✓
       ├─> Client a complété son questionnaire ✓
       ├─> Association n'existe pas déjà ✓
       └─> Si tout OK, créer l'association

5. Backend effectue les actions :
   ├─> Crée l'association dans coach_clients
   ├─> Envoie une notification au client (optionnel)
   ├─> Décrément les crédits du coach
   └─> Retourne les données du client

6. Frontend affiche le succès
   ├─> Message "Client ajouté avec succès"
   ├─> Recharge la liste des clients
   └─> Ferme le modal après 2 secondes

7. Client apparaît dans la liste du coach
   └─> Statut : "Actif"
   └─> Coach peut voir son dashboard immédiatement
```

### Cas d'Erreur

| Erreur | Message | Code HTTP |
|--------|---------|-----------|
| Email non trouvé | "Aucun client trouvé avec cet email" | 404 |
| Client déjà associé | "Ce client est déjà dans votre liste" | 400 |
| Questionnaire incomplet | "Ce client n'a pas encore complété son questionnaire" | 400 |
| Crédits insuffisants | "Crédits insuffisants" | 402 |

### Exemple de Requête

```javascript
// Frontend
const result = await ApiClient.post('/api/coach/clients/add-existing', {
  email: 'marie.dupont@email.com'
});

// Réponse succès
{
  "success": true,
  "message": "Client ajouté avec succès",
  "client": {
    "id": 123,
    "name": "Marie Dupont",
    "email": "marie.dupont@email.com",
    "avatar": "MD",
    "score": 75,
    "lastAnalysis": "2024-12-10T10:30:00Z",
    "nextSession": "2024-12-18T14:00:00Z",
    "status": "active"
  }
}
```

---

## 🆕 Scénario 2 : Nouveau Client

### Description
Inviter un nouveau client qui n'a pas encore de compte AI-Ikigai.

### Flux Détaillé

```
1. Coach clique sur "➕ Nouveau client"
   └─> Modal s'ouvre avec 2 onglets

2. Coach sélectionne l'onglet "Nouveau Client"
   └─> Formulaire avec champs :
       ├─> Nom complet *
       ├─> Email *
       ├─> Téléphone (optionnel)
       └─> Message d'invitation personnalisé (optionnel)

3. Coach remplit le formulaire
   └─> Clic sur "✉️ Envoyer l'invitation"

4. Frontend envoie requête POST /api/coach/clients/invite
   └─> Backend vérifie :
       ├─> Coach existe ✓
       ├─> Email n'existe pas déjà ✓
       └─> Si OK, créer l'invitation

5. Backend effectue les actions :
   ├─> Crée un compte client temporaire (status: "pending")
   ├─> Crée l'association coach-client (status: "pending")
   ├─> Génère un token d'invitation unique (expire 7 jours)
   ├─> Envoie l'email d'invitation au client
   └─> Retourne les données du client

6. Frontend affiche le succès
   ├─> Message "✉️ Invitation envoyée !"
   ├─> Ajoute le client en statut "pending" (optionnel)
   └─> Ferme le modal après 3 secondes

7. Client reçoit l'email d'invitation
   └─> Contient :
       ├─> Lien sécurisé : /invite/{token}
       ├─> Message du coach
       ├─> Présentation d'Ikigai
       └─> Expire dans 7 jours

8. Client clique sur le lien
   └─> Redirigé vers /invite/{token}

9. Page d'invitation se charge
   ├─> Vérifie la validité du token
   ├─> Affiche les informations pré-remplies
   └─> Formulaire de création de compte

10. Client choisit son mot de passe
    ├─> Validation des critères :
    │   ├─> Min 8 caractères
    │   ├─> Au moins une lettre
    │   └─> Au moins un chiffre
    └─> Clic sur "Créer mon compte"

11. Requête POST /api/invite/{token}/accept
    └─> Backend :
        ├─> Vérifie la validité du token
        ├─> Hash le mot de passe
        ├─> Active le compte (status: "active")
        ├─> Marque l'invitation comme utilisée
        ├─> Génère un JWT token
        └─> Retourne le token + redirectTo

12. Frontend reçoit la réponse
    ├─> Stocke le JWT dans localStorage
    ├─> Affiche "Compte créé avec succès !"
    └─> Redirige vers /questionnaire après 2s

13. Client complète le questionnaire Ikigai
    └─> Une fois complété :
        ├─> Statut passe de "pending" à "active"
        ├─> Apparaît dans la liste du coach
        └─> Dashboard accessible au coach
```

### Email d'Invitation (Template)

```html
Bonjour Marie,

Sophie Bernard vous invite à découvrir votre Ikigai grâce à l'IA.

[Message personnalisé du coach si fourni]

Qu'est-ce que l'Ikigai ?
- ❤️ Ce que vous aimez
- ⭐ Ce en quoi vous êtes doué(e)
- 💰 Ce pour quoi vous pouvez être payé(e)
- 🌍 Ce dont le monde a besoin

Comment ça marche ?
1. Créez votre compte en quelques secondes
2. Complétez le questionnaire (15-20 min)
3. Recevez votre analyse personnalisée
4. Collaborez avec Sophie Bernard

[Bouton: 🚀 Découvrir mon Ikigai]

Cette invitation expire dans 7 jours.
```

### Cas d'Erreur

| Erreur | Message | Code HTTP |
|--------|---------|-----------|
| Email existe déjà | "Un compte existe déjà avec cet email" | 400 |
| Email invalide | "L'adresse email n'est pas valide" | 400 |
| Token invalide | "Invitation invalide ou expirée" | 404 |
| Token expiré | "Invitation expirée" | 400 |
| Token déjà utilisé | "Invitation déjà utilisée" | 400 |

### Exemple de Requête

```javascript
// Frontend - Invitation
const result = await ApiClient.post('/api/coach/clients/invite', {
  name: 'Marie Dupont',
  email: 'marie.dupont@email.com',
  phone: '+33 6 12 34 56 78',
  message: 'Bonjour Marie, je vous invite à découvrir votre Ikigai...'
});

// Réponse succès
{
  "success": true,
  "message": "Invitation envoyée avec succès",
  "client": {
    "id": 124,
    "name": "Marie Dupont",
    "email": "marie.dupont@email.com",
    "avatar": "MD",
    "score": null,
    "lastAnalysis": null,
    "nextSession": null,
    "status": "pending"
  },
  "invitationToken": "inv_a1b2c3d4e5f6..."
}

// Frontend - Acceptation
const result = await fetch('/api/invite/inv_a1b2c3d4e5f6/accept', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'SecurePass123' })
});

// Réponse succès
{
  "success": true,
  "message": "Compte créé avec succès",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "redirectTo": "/questionnaire"
}
```

---

## 🗄️ Structure Base de Données

### Table : users

```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,              -- NULL pour invitations pending
  name TEXT,
  role TEXT DEFAULT 'client',      -- 'client' | 'coach' | 'admin'
  status TEXT DEFAULT 'active',    -- 'active' | 'pending' | 'inactive'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Table : coach_clients

```sql
CREATE TABLE coach_clients (
  coach_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active',    -- 'active' | 'pending' | 'inactive'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (coach_id, client_id),
  FOREIGN KEY (coach_id) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES users(id)
);
```

### Table : invitations

```sql
CREATE TABLE invitations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  user_id INTEGER NOT NULL,         -- Client invité
  coach_id INTEGER NOT NULL,        -- Coach qui invite
  expires_at DATETIME NOT NULL,
  used INTEGER DEFAULT 0,           -- 0 = non utilisé, 1 = utilisé
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (coach_id) REFERENCES users(id)
);

-- Index pour recherche rapide
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_expires ON invitations(expires_at);
```

### Table : coach_credits

```sql
CREATE TABLE coach_credits (
  coach_id INTEGER PRIMARY KEY,
  credits_total INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (coach_id) REFERENCES users(id)
);
```

---

## 📊 Diagramme de Flux

```
┌─────────────────────────────────────────────────────────────┐
│                    COACH DASHBOARD                          │
│                                                             │
│  [➕ Nouveau client]  ←── Coach clique                      │
└────────────┬────────────────────────────────────────────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────┐
│                    MODAL S'OUVRE                           │
│                                                            │
│  [Client Existant] [Nouveau Client]  ←── 2 onglets        │
└───────┬────────────────┬───────────────────────────────────┘
        │                │
        │                │
    SCÉNARIO 1      SCÉNARIO 2
        │                │
        ↓                ↓
┌───────────────┐  ┌─────────────────┐
│ Email client  │  │ Nom + Email     │
│               │  │ + Tel + Message │
└───────┬───────┘  └────────┬────────┘
        │                   │
        ↓                   ↓
   API: add-existing   API: invite
        │                   │
        ↓                   ↓
┌───────────────┐  ┌─────────────────┐
│ Vérifications │  │ Créer compte    │
│ - Client OK?  │  │ - Générer token │
│ - Quiz fait?  │  │ - Envoyer email │
│ - Pas dupe?   │  │                 │
└───────┬───────┘  └────────┬────────┘
        │                   │
        ↓                   ↓
┌───────────────┐  ┌─────────────────┐
│ Association   │  │ Email envoyé    │
│ créée         │  │ Client "pending"│
└───────┬───────┘  └────────┬────────┘
        │                   │
        ↓                   │
┌───────────────┐           │
│ Client actif  │           │
│ dans la liste │           │
└───────────────┘           │
                            ↓
                  ┌─────────────────┐
                  │ Client accepte  │
                  │ l'invitation    │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ Crée mot passe  │
                  │ Fait quiz       │
                  └────────┬────────┘
                           │
                           ↓
                  ┌─────────────────┐
                  │ Client actif    │
                  │ dans la liste   │
                  └─────────────────┘
```

---

## 🎨 Composants UI

### 1. Modal Ajout Client (add-client-modal.html)
- Onglets : Client Existant / Nouveau Client
- Formulaires avec validation
- Messages de succès/erreur
- Design cohérent avec le site

### 2. Page Invitation (invite.html)
- Vérification du token
- Formulaire de création de compte
- Validation mot de passe en temps réel
- États : loading / form / success / error
- Redirection automatique après succès

---

## 🔐 Sécurité

### Tokens d'Invitation
- Format : `inv_` + 32 caractères aléatoires
- Stockés hashés en base de données
- Expiration : 7 jours
- Usage unique (marqué comme utilisé après acceptation)

### Mot de Passe
- Minimum 8 caractères
- Au moins une lettre
- Au moins un chiffre
- Hashé avec bcrypt (SHA-256 en dev)

### Rate Limiting
- Limitation des tentatives d'invitation
- Protection contre le spam
- Vérification CAPTCHA (optionnel)

---

## 📧 Configuration Email

### Variables d'Environnement

```bash
EMAIL_FROM=noreply@ai-ikigai.com
RESEND_API_KEY=re_xxxxxxxxxxxx
FRONTEND_URL=https://ai-ikigai.com
```

### Service Email (Resend)

```javascript
const resend = new Resend(env.RESEND_API_KEY);

await resend.emails.send({
  from: env.EMAIL_FROM,
  to: clientEmail,
  subject: `${coachName} vous invite à découvrir votre Ikigai`,
  html: emailTemplate
});
```

---

## ✅ Checklist d'Intégration

### Frontend
- [ ] Ajouter le modal dans coach-dashboard.html
- [ ] Inclure add-client-functions.js
- [ ] Créer la page invite.html
- [ ] Tester les deux scénarios
- [ ] Gérer tous les cas d'erreur

### Backend
- [ ] Implémenter les 3 routes API
- [ ] Créer les tables manquantes
- [ ] Configurer le service d'email
- [ ] Implémenter le hashing de mot de passe
- [ ] Ajouter les logs et monitoring

### Email
- [ ] Configurer Resend ou autre service
- [ ] Créer le template HTML
- [ ] Tester l'envoi d'emails
- [ ] Gérer les bounces et erreurs

### Tests
- [ ] Tester l'ajout de client existant
- [ ] Tester l'invitation de nouveau client
- [ ] Tester les expirations de tokens
- [ ] Tester les cas d'erreur
- [ ] Tester sur mobile

---

## 🐛 Debugging

### Logs Utiles

```javascript
// Backend
console.log('Coach adding client:', { coachId, clientEmail });
console.log('Invitation sent:', { token, clientEmail, expiresAt });
console.log('Invitation accepted:', { token, userId });

// Frontend
console.log('Opening add client modal');
console.log('Client added successfully:', client);
console.log('Invitation loaded:', invitationData);
```

### Erreurs Courantes

1. **"Email already exists"**
   - Cause : Tentative d'inviter un client qui existe déjà
   - Solution : Utiliser l'onglet "Client Existant"

2. **"Invitation expired"**
   - Cause : Token expiré (>7 jours)
   - Solution : Coach doit renvoyer une invitation

3. **"Client has no questionnaire"**
   - Cause : Client n'a pas complété le questionnaire
   - Solution : Attendre que le client le complète

4. **"Credits insufficient"**
   - Cause : Coach n'a plus de crédits
   - Solution : Acheter plus de crédits

---

## 📈 Métriques à Suivre

- Nombre d'invitations envoyées
- Taux d'acceptation des invitations
- Temps moyen avant acceptation
- Taux de complétion du questionnaire
- Nombre de clients actifs par coach

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024
