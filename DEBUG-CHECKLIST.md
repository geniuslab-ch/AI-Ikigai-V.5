# Analysis Debugging Checklist

## Test Steps

### 1. Console du Questionnaire
Quand vous soumettez le questionnaire, **ouvrez la console (F12)** et cherchez:
- ✅ `📝 Submitting questionnaire to Supabase...`
- ✅ `✅ User authenticated: email@example.com`
- ✅ `👨‍🏫 User has coach: xxx` (si invité par coach)
- ✅ `✅ Analysis saved to Supabase: yyy`
- ❌ Erreurs rouges?

### 2. Vérification Base de Données

```sql
-- A. Vérifier qu'une analyse a été créée
SELECT id, user_id, coach_id, created_at, answers
FROM analyses 
ORDER BY created_at DESC 
LIMIT 3;

-- B. Vérifier la relation coach-client
SELECT c.id, c.coach_id, c.client_id, c.added_at,
       coach.email as coach_email,
       client.email as client_email
FROM coach_clients c
LEFT JOIN profiles coach ON c.coach_id = coach.id
LEFT JOIN profiles client ON c.client_id = client.id
ORDER BY c.added_at DESC
LIMIT 3;

-- C. Vérifier les profils
SELECT id, email, role, name
FROM profiles
ORDER BY created_at DESC
LIMIT 5;
```

### 3. Console Dashboard Client
Sur le dashboard client, **ouvrez console (F12)** et cherchez:
- Erreurs de chargement?
- Messages de Supabase?
- Query qui charge les analyses?

### 4. Console Dashboard Coach  
Sur le dashboard coach → "Mes Analyses", **console (F12)**:
- Erreurs?
- Query pour charger analyses des clients?

## Questions Clés

1. **Le questionnaire a-t-il été soumis avec succès?**
   - Regarder console pendant soumission
   - Vérifier SQL query A ci-dessus

2. **La relation coach-client existe-t-elle?**
   - Vérifier SQL query B ci-dessus

3. **Les dashboards chargent-ils les données?**
   - Console des dashboards
   - Erreurs RLS (Row Level Security)?

## Problèmes Potentiels

### Si analyse non créée:
- User pas authentifié
- Erreur dans QuestionnaireAPI.submit()
- Problème permissions Supabase

### Si analyse créée mais pas visible:
- RLS policies bloquent l'accès
- Dashboard ne query pas correctement
- Mauvais user_id/coach_id

### Si relation coach-client manquante:
- auth.html n'a pas créé le lien
- Invitation token invalide
- Erreur dans signup flow

## Actions

**FAITES CES 3 CHOSES:**
1. Soumettez questionnaire avec console ouverte → screenshot logs
2. Exécutez les 3 SQL queries → screenshot résultats  
3. Ouvrez dashboard client avec console → screenshot erreurs

Envoyez-moi les screenshots ou logs!
