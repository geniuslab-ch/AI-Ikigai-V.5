# Tableau de Bord Coach - AI-Ikigai

## 📋 Vue d'ensemble

Le tableau de bord coach est une interface complète permettant aux coachs professionnels de gérer leurs clients, suivre leurs analyses Ikigai, et monitorer leurs performances. Il intègre le dashboard client pour une vue détaillée de chaque profil.

## 🎨 Sections Principales

### 1. **Overview (Vue d'ensemble)**
Statistiques clés en temps réel :
- 👥 **Clients actifs** : Nombre total avec tendance mensuelle
- 📅 **Séances cette semaine** : Planning hebdomadaire
- 📊 **Nouvelles analyses Ikigai** : Complétées récemment
- 🎯 **Score moyen d'alignement** : Moyenne de tous les clients

### 2. **Gestion des Crédits**
- ⚡ **Crédits restants** : Affichage avec barre de progression
- 💰 **Économies réalisées** : Comparaison vs analyse manuelle
  - Coût manuel estimé
  - Coût AI-Ikigai
  - Économies totales en € et temps

### 3. **Liste des Clients**
Table interactive avec :
- Informations client (nom, email, avatar)
- Score Ikigai avec code couleur
- Date de dernière analyse
- Prochaine séance planifiée
- Statut (Actif / En attente / Inactif)
- Actions rapides

**Fonctionnalités** :
- 🔍 Recherche par nom/email
- 🎚️ Filtres par statut et score
- 📥 Export en CSV
- ➕ Ajout de nouveaux clients
- ⋮ Menu d'actions par client

### 4. **Profil Client Individuel (Modal)**
Au clic sur un client, affichage du dashboard complet :
- Score Ikigai avec jauge animée
- Carte des 4 dimensions (Ce qu'il aime, Talents, Valeur marchande, Impact)
- Actions coach :
  - 📥 Télécharger le rapport PDF
  - 📅 Planifier une séance
  - ✉️ Envoyer un email

## 📊 Calculs et Métriques

### Score Moyen d'Alignement
```javascript
scoreMoyen = Σ(scores de tous les clients) / nombre de clients
```

### Séances de la Semaine
Compte les séances planifiées entre aujourd'hui et +7 jours.

### Nouvelles Analyses
Analyses complétées dans les 7 derniers jours.

### Économies Réalisées
```javascript
économies = (coût_manuel × nb_analyses) - (coût_AI × nb_analyses)

Où :
- coût_manuel ≈ 100€/analyse (5h × 20€/h)
- coût_AI ≈ 27.50€/analyse (avec forfait)
- temps_économisé ≈ 5h/analyse
```

**Exemple avec 53 analyses** :
- Coût manuel : 53 × 100€ = 5 300€
- Coût AI-Ikigai : 53 × 27.50€ = 1 460€
- **Économies : 3 840€**
- **Temps économisé : 265 heures**

## 🔧 Fichiers

### coach-dashboard.html
Interface complète du coach avec :
- Navigation avec compteur de crédits
- Grille de statistiques overview
- Cartes crédits et économies
- Table clients interactive
- Modal pour profil client détaillé
- Design responsive

### coach-dashboard.js
Logique JavaScript pour :
- Chargement des données API
- Calcul des statistiques
- Filtrage et recherche de clients
- Affichage du profil client en modal
- Gestion des actions (export, ajout, etc.)

## 🚀 Intégration

### Structure de Données API

#### Endpoint : GET /api/coach/dashboard
```json
{
  "stats": {
    "activeClients": 24,
    "weekSessions": 7,
    "newAnalyses": 5,
    "avgScore": 72
  },
  "credits": {
    "remaining": 47,
    "total": 100,
    "used": 53
  },
  "savings": {
    "total": 3840,
    "manualCost": 5300,
    "aiCost": 1460,
    "timeSaved": 265
  }
}
```

#### Endpoint : GET /api/coach/clients
```json
{
  "clients": [
    {
      "id": 1,
      "name": "Marie Dupont",
      "email": "marie.dupont@email.com",
      "avatar": "MD",
      "score": 75,
      "lastAnalysis": "2024-12-10",
      "nextSession": "2024-12-18",
      "status": "active"
    }
  ]
}
```

#### Endpoint : GET /api/coach/clients/:id/ikigai
```json
{
  "overallScore": 75,
  "dimensions": [
    {
      "type": "love",
      "score": 85,
      "items": ["Créativité", "Innovation", ...]
    },
    ...
  ],
  "insights": { ... },
  "careerSuggestions": [ ... ],
  "businessIdeas": [ ... ]
}
```

## 🎨 Personnalisation

### Codes Couleur des Scores
```css
80-100 : badge-success (vert) - Excellent
60-79  : badge-success (vert) - Bon
40-59  : badge-warning (orange) - Moyen
0-39   : badge-danger (rouge) - Faible
```

### Statuts Client
- **Actif** 🟢 : Client avec séances régulières
- **En attente** 🟡 : Analyse complétée, séance à planifier
- **Inactif** ⚪ : Aucune activité récente

## 💡 Fonctionnalités Avancées

### Recherche Intelligente
```javascript
// Recherche dans nom ET email
filterClients() {
  return clients.filter(c => 
    c.name.toLowerCase().includes(search) ||
    c.email.toLowerCase().includes(search)
  );
}
```

### Filtres Cumulatifs
Les filtres (recherche, statut, score) fonctionnent ensemble :
- Recherche : "marie" 
- Statut : "active"
- Score : "good"
→ Résultat : Marie Dupont avec score 60-79 et statut actif

### Modal Profil Client
Le modal charge dynamiquement le dashboard client complet :
1. Clic sur une ligne du tableau
2. Chargement des données client
3. Génération du HTML du dashboard
4. Animation de la jauge et des barres
5. Activation des actions spécifiques coach

### Actions Rapides
- **Télécharger rapport** : Export PDF personnalisé
- **Planifier séance** : Intégration calendrier
- **Envoyer email** : Ouverture client email avec pré-remplissage

## 📱 Responsive Design

### Desktop (> 1024px)
- Statistiques en grille 4 colonnes
- Table complète avec toutes les colonnes
- Modal large

### Tablet (768px - 1024px)
- Statistiques en grille 2 colonnes
- Navigation simplifiée

### Mobile (< 768px)
- Statistiques en 1 colonne
- Table transformée en cartes
- Modal plein écran
- Filtres empilés verticalement

## 🔐 Sécurité

### Authentification Coach
```javascript
// Vérification obligatoire au chargement
if (!ApiClient.isAuthenticated()) {
  window.location.href = '/login.html';
}
```

### Permissions
- Accès uniquement aux clients du coach connecté
- Token JWT requis pour toutes les requêtes API
- Validation côté backend des droits d'accès

## 🎯 Workflows Typiques

### Workflow 1 : Suivi Client
1. Coach se connecte au dashboard
2. Consulte les stats overview
3. Recherche un client spécifique
4. Ouvre son profil en modal
5. Télécharge le rapport PDF
6. Planifie la prochaine séance

### Workflow 2 : Nouveau Client
1. Clic sur "Nouveau client"
2. Saisie des informations
3. Envoi invitation questionnaire
4. Client complète son Ikigai
5. Analyse apparaît dans "Nouvelles analyses"
6. Planification première séance

### Workflow 3 : Gestion Crédits
1. Consultation crédits restants
2. Vérification économies réalisées
3. Si crédits faibles : achat de crédits
4. Confirmation et recharge

## 📊 Analytics & Tracking

### Événements à Tracker
```javascript
// Exemple Google Analytics
gtag('event', 'coach_dashboard_view');
gtag('event', 'client_profile_opened', { client_id: 123 });
gtag('event', 'report_downloaded', { client_id: 123 });
gtag('event', 'credits_purchased', { amount: 50 });
```

## 🐛 Debugging

### Logs Console
```javascript
console.log('🎯 Coach Dashboard initialization...');
console.log('Loading clients:', clients.length);
console.log('Stats updated:', stats);
```

### Erreurs Courantes
1. **"Coach not authenticated"** : Token manquant/expiré
2. **"Cannot load clients"** : Erreur API backend
3. **"Modal not opening"** : ID client invalide

## 🔄 Intégration avec Dashboard Client

Le dashboard coach intègre le dashboard client existant :

```javascript
// Dans le modal, injection du HTML client
function generateClientDashboardHTML(client) {
  return `
    <!-- Score Ikigai -->
    <div class="gauge-container">...</div>
    
    <!-- Carte Ikigai -->
    <div class="ikigai-map">...</div>
    
    <!-- Actions Coach -->
    <div class="coach-actions">...</div>
  `;
}
```

**Avantages** :
- Réutilisation du code dashboard B2C
- Interface cohérente
- Maintenance simplifiée
- Ajout d'actions spécifiques coach

## 📦 Déploiement

### Checklist Pré-Production
- [ ] Connexion API testée
- [ ] Authentification fonctionnelle
- [ ] Filtres et recherche opérationnels
- [ ] Modal profil client s'affiche
- [ ] Calculs statistiques corrects
- [ ] Export CSV fonctionnel
- [ ] Responsive testé mobile/tablette/desktop
- [ ] Analytics configurés

### Variables d'Environnement
```bash
API_BASE_URL=https://api.ai-ikigai.com
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
GOOGLE_ANALYTICS_ID=G-XXXXXXXX
```

## 🚀 Fonctionnalités Futures

### Phase 2
- [ ] Messagerie interne coach-client
- [ ] Notifications push pour nouvelles analyses
- [ ] Agenda intégré avec rappels
- [ ] Notes privées par client
- [ ] Historique des séances

### Phase 3
- [ ] Tableau de bord analytique avancé
- [ ] Comparaison de progression dans le temps
- [ ] Templates d'emails personnalisables
- [ ] Rapports personnalisés avec branding coach
- [ ] Intégration Zoom/Teams pour visio

### Phase 4
- [ ] Marketplace de ressources
- [ ] Communauté de coachs
- [ ] Certifications et badges
- [ ] Programme de parrainage
- [ ] API publique pour intégrations tierces

## 📞 Support

### Documentation
- Guide complet : https://docs.ai-ikigai.com/coach
- Tutoriels vidéo : https://ai-ikigai.com/tutorials
- FAQ Coach : https://help.ai-ikigai.com/coach

### Contact
- Email : coach@ai-ikigai.com
- Chat support : Disponible dans le dashboard
- Téléphone : +33 1 XX XX XX XX (Lun-Ven 9h-18h)

## 📄 Licence

© 2024 AI-Ikigai. Tous droits réservés.

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Compatibilité** : Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
