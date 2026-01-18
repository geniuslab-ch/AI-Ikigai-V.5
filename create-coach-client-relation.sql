-- SOLUTION RAPIDE : Créer manuellement les relations coach-client pour tests

-- 1. Trouvez vos IDs
SELECT id, email, role, name 
FROM profiles 
WHERE role IN ('coach', 'client')
ORDER BY created_at DESC 
LIMIT 10;

-- 2. Créez la relation (remplacez les IDs)
-- Exemple :
-- INSERT INTO coach_clients (coach_id, client_id, status)
-- VALUES ('ID_COACH_ICI', 'ID_CLIENT_ICI', 'active');

-- 3. Vérifiez
SELECT 
    cc.id,
    coach.email as coach_email,
    client.email as client_email,
    cc.status,
    cc.created_at
FROM coach_clients cc
INNER JOIN profiles coach ON coach.id = cc.coach_id
INNER JOIN profiles client ON client.id = cc.client_id;
