-- Vérifier les réponses du questionnaire pour comprendre le format
SELECT 
    id,
    user_id,
    created_at,
    answers,
    jsonb_pretty(answers) as formatted_answers
FROM analyses
WHERE user_id = 'e9c7ee52-50e9-4e8e-87b7-da316eb4c7c3'
ORDER BY created_at DESC
LIMIT 1;

-- Si vous avez l'une des analyses, vérifiez aussi le contenu exact
SELECT 
    id,
    answers->'q1' as question_1,
    answers->'q2' as question_2,
    answers->'q3' as question_3,
    answers->'q4' as question_4,
    answers->'q5' as question_5
FROM analyses
WHERE user_id = 'e9c7ee52-50e9-4e8e-87b7-da316eb4c7c3'
ORDER BY created_at DESC
LIMIT 1;
