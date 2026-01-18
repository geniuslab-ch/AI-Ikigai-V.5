-- Vérifier le contenu complet des analyses
SELECT 
    id,
    user_id,
    created_at,
    passion_score,
    profession_score,
    mission_score,
    vocation_score,
    (career_recommendations IS NOT NULL) as has_career_recs,
    jsonb_array_length(career_recommendations) as career_recs_count,
    (business_ideas IS NOT NULL) as has_business_ideas,
    jsonb_array_length(business_ideas) as business_ideas_count,
    (trajectories IS NOT NULL) as has_trajectories,
    jsonb_array_length(trajectories) as trajectories_count,
    (passions IS NOT NULL) as has_passions,
    (talents IS NOT NULL) as has_talents
FROM analyses
ORDER BY created_at DESC
LIMIT 5;
