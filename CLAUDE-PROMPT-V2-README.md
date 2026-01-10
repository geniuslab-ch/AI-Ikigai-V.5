# Nouveau Prompt Claude - Version 2

## 🎯 Améliorations

Ce nouveau prompt implémente un système d'analyse structuré en 3 niveaux selon le plan utilisateur:

### Mapping Plans → Pack Levels

| Plan Utilisateur | Pack Level | Contenu Généré |
|------------------|------------|----------------|
| `decouverte` / `decouverte_coach` | **CLARITY** | 3 recommandations carrière + scores + profil |
| `essentiel` / `essentiel_coach` | **DIRECTION** | 3 trajectoires + 5 business ideas + plans 30j |
| `premium` / `premium_coach` / `elite_coach` | **TRANSFORMATION** | DIRECTION + diagnostic cohérence + positionnement + prep coaching |

## 📦 Structure des Outputs

### Pack CLARITY (Découverte)
```json
{
  "profileSummary": "...",
  "ikigaiSummary": "...",
  "passions": [...],
  "talents": [...],
  "mission": [...],
  "vocation": [...],
  "score": {...},
  "careerRecommendations": [
    {
      "title": "...",
      "description": "...",
      "matchScore": 85,
      "realism": "🟢",
      "realismLabel": "Accessible rapidement",
      "keyRisk": "..."
    }
  ]
}
```

### Pack DIRECTION (Essentiel)
- Tout de CLARITY +
- `trajectories` (3 parcours avec jobTitles, skills, actionPlan30Days)
- `businessIdeas` (5 idées avec problem, target, viability)

### Pack TRANSFORMATION (Premium/Elite)
- Tout de DIRECTION +
- `coherenceDiagnosis` (strengths, misalignments, keyRisks)
- `finalTrajectory` (choix + justification)
- `positioning` (statement, linkedinHeadline, pitch)
- `coachingPrep` (5 questions + topics)

## 🔧 Modifications du Prompt

1. **Framework d'analyse structuré** (4 étapes):
   - Ikigai analysis
   - CV analysis  
   - Market reality
   - Triangulation

2. **Principes renforcés**:
   - Ne PAS inventer d'informations
   - Toujours expliquer le raisonnement
   - Priorité au réalisme
   - Conseils spécifiques et actionnables
   - Concision

3. **Tone professionnel**:
   - Bienveillant et pragmatique
   - Pas de mysticisme ou flou motivationnel
   - Pédagogique et clair

## 🚀 Déploiement

Pour utiliser ce nouveau prompt, modifiez `wrangler.toml` pour pointer vers le nouveau worker file (quand prêt à tester).

Le fichier actuel `index-supabase.js` continue de fonctionner normalement.
