-- ============================================================================
-- MISE À JOUR des scores individuels depuis la colonne JSONB score
-- ============================================================================
-- Ce script extrait les scores de la colonne 'score' (JSONB) et remplit
-- les colonnes individuelles pour compatibilité avec l'ancien dashboard
-- ============================================================================

-- Afficher les scores actuels (avant mise à jour)
SELECT 
    id,
    user_id,
    created_at,
    passion_score,
    profession_score,
    mission_score,
    vocation_score,
    score
FROM analyses
WHERE user_id = '3255872e-656a-49a8-b250-eb9ed2382ac6'
ORDER BY created_at DESC;

-- ============================================================================
-- OPTION 1 : Mettre à jour TOUTES les analyses avec scores manquants
-- ============================================================================

UPDATE analyses
SET 
    passion_score = COALESCE((score->>'passion')::integer, (score->>'passion_score')::integer, 0),
    profession_score = COALESCE((score->>'profession')::integer, (score->>'profession_score')::integer, 0),
    mission_score = COALESCE((score->>'mission')::integer, (score->>'mission_score')::integer, 0),
    vocation_score = COALESCE((score->>'vocation')::integer, (score->>'vocation_score')::integer, 0)
WHERE 
    score IS NOT NULL 
    AND score != '{}'::jsonb
    AND (passion_score = 0 OR passion_score IS NULL);

-- Vérifier le résultat
SELECT 
    id,
    user_id,
    passion_score,
    profession_score,
    mission_score,
    vocation_score,
    score
FROM analyses
WHERE user_id = '3255872e-656a-49a8-b250-eb9ed2382ac6'
ORDER BY created_at DESC;

-- ============================================================================
-- OPTION 2 : Si les scores JSONB sont aussi à 0, générer des scores de test
-- ============================================================================

-- ATTENTION: Ceci génère des scores FACTICES pour tests uniquement
-- NE PAS UTILISER en production!

UPDATE analyses
SET 
    passion_score = 75,
    profession_score = 68,
    mission_score = 82,
    vocation_score = 71,
    score = jsonb_build_object(
        'passion', 75,
        'profession', 68,
        'mission', 82,
        'vocation', 71
    )
WHERE 
    user_id = '3255872e-656a-49a8-b250-eb9ed2382ac6'
    AND (passion_score = 0 OR passion_score IS NULL);

-- ============================================================================
-- RECOMMANDATION FINALE
-- ============================================================================
-- La meilleure solution reste de SUPPRIMER les analyses vides et de refaire
-- un nouveau questionnaire complet qui sera correctement enregistré :

-- DELETE FROM analyses WHERE user_id = '3255872e-656a-49a8-b250-eb9ed2382ac6';

-- Puis allez sur https://ai-ikigai.com/questionnaire.html
-- ============================================================================
