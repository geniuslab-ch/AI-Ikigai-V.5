-- Vérifier toutes les analyses récentes et leurs scores
SELECT 
    id,
    created_at,
    passion_score,
    profession_score,
    mission_score,
    vocation_score,
    score::text as score_jsonb,
    (score IS NOT NULL) as has_score_json,
    (passion_score > 0 OR profession_score > 0 OR mission_score > 0 OR vocation_score > 0) as has_individual_scores
FROM analyses
ORDER BY created_at DESC
LIMIT 10;
