# 🔌 Guide d'Intégrations Dashboard Coach

## Intégrations Backend Nécessaires

### ✅ Déjà Implémentées

#### 1. **Supabase** (Base de données)
- ✅ Connexion configurée
- ✅ Tables créées (coach_clients, coaching_sessions, etc.)
- ✅ Queries implémentées
- **Status** : Prêt ✅

#### 2. **MailChannels** (Email gratuit)
- ✅ Worker déployé : `workers/email-invitation.js`
- ✅ Template HTML créé
- ✅ Endpoint : https://ai-ikigai.ai-ikigai.workers.dev/api/send-invitation
- **Status** : Prêt ✅
- **Note** : Gratuit sur Cloudflare Workers

---

### 🔄 Intégrations Optionnelles (Améliorations)

#### 3. **Resend** (Alternative Email)
**Pourquoi ?** Meilleur deliverability que MailChannels

**Setup** :
```bash
npm install resend
```

**Code Worker** :
```javascript
import { Resend } from 'resend';

const resend = new Resend(env.RESEND_API_KEY);

await resend.emails.send({
  from: 'Coach <coach@ai-ikigai.com>',
  to: email,
  subject: `${coachName} vous invite...`,
  html: emailHTML
});
```

**Variables d'environnement** :
```
RESEND_API_KEY=re_xxxxx
```

**Coût** : Gratuit jusqu'à 3000 emails/mois

---

#### 4. **Google Calendar** (Planification séances)
**Pourquoi ?** Synchronisation automatique des séances

**Option A - Google Calendar API** :
```javascript
// Dans scheduleSession()
async function scheduleSession(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    
    // Créer événement Google Calendar
    const event = {
        summary: `Séance Ikigai - ${client.name}`,
        description: 'Séance de coaching Ikigai',
        start: { dateTime: selectedDate },
        end: { dateTime: selectedEndDate },
        attendees: [{ email: client.email }]
    };
    
    // Appeler Google Calendar API
    await createCalendarEvent(event);
}
```

**Variables nécessaires** :
```
GOOGLE_CLIENT_ID=xxxxx
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REFRESH_TOKEN=xxxxx
```

**Option B - Calendly (Plus simple)** :
```javascript
// Embed Calendly
function scheduleSession(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    
    // Ouvrir Calendly avec pre-fill
    window.open(`https://calendly.com/votre-lien?name=${client.name}&email=${client.email}`);
}
```

**Coût** :
- Google Calendar API : Gratuit
- Calendly : Gratuit (basique) ou €8/mois (pro)

---

## 📊 Recommandation

### Maintenant (Essentiel) ✅
- ✅ **Supabase** - OK
- ✅ **MailChannels** - OK
- ✅ **PDF Worker** - OK

### Bientôt (Améliorations)
- 🔄 **Resend** - Si problèmes de déliverabilité email
- 🔄 **Google Calendar** - Si synchronisation calendrier importante

### Plus tard (Nice to have)
- 📊 Analytics (Google Analytics, Plausible)
- 💬 Chat support (Intercom, Crisp)
- 📧 Email marketing (Brevo, Mailchimp)

---

## ✅ État Actuel

| Service | Status | Note |
|---------|--------|------|
| Supabase | ✅ Live | Base données |
| MailChannels | ✅ Live | Emails gratuits |
| PDF Generation | ✅ Live | HTML→Print |
| Resend | ⚪ Optionnel | Meilleur email |
| Google Calendar | ⚪ Optionnel | Planning |

---

## 🎯 Prochaine Action

**Voulez-vous** :
1. ✅ **Rester comme ça** (fonctionne déjà !)
2. 🔄 **Ajouter Resend** (meilleurs emails)
3. 📅 **Ajouter Calendly** (planning simple)
4. 🗓️ **Intégrer Google Calendar** (complet mais complexe)

**Mon conseil** : Testez d'abord avec MailChannels. Ajoutez Resend seulement si emails ne passent pas.
