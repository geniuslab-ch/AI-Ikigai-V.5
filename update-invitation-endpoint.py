#!/usr/bin/env python3
"""
Script to add coach-client relationship creation to the invitation endpoint
"""

file_path = 'index-supabase.js'

# Read the entire file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the start of the POST /api/send-invitation endpoint
start_marker = "// POST /api/send-invitation"
end_marker = "\t\t// ============ PDF GENERATION ENDPOINT ============"

# Find positions
start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos == -1 or end_pos == -1:
    print("❌ Could not find markers")
    exit(1)

# Extract the part before and after
before = content[:start_pos]
after = content[end_pos:]

# New endpoint code with coach_clients relationship creation
new_endpoint = '''// POST /api/send-invitation
\tif (path === '/api/send-invitation' && method === 'POST') {
\t\ttry {
\t\t\tconst { to, clientName, personalMessage, coachId } = await request.json();

\t\t\tif (!to || !clientName || !coachId) {
\t\t\t\treturn errorResponse('Champs requis manquants: to, clientName, coachId', 400);
\t\t\t}

\t\t\tif (!env.RESEND_API_KEY) {
\t\t\t\tconsole.error('❌ RESEND_API_KEY non configurée');
\t\t\t\treturn errorResponse('Service d\\'envoi d\\'email non configuré', 500);
\t\t\t}

\t\t\tconst supabase = getSupabaseClient(env);

\t\t\t// Récupérer les infos du coach
\t\t\tconst { data: coach, error: coachError } = await supabase
\t\t\t\t.from('profiles')
\t\t\t\t.select('id, name, email')
\t\t\t\t.eq('id', coachId)
\t\t\t\t.single();

\t\t\tif (coachError || !coach) {
\t\t\t\treturn errorResponse('Coach non trouvé', 404);
\t\t\t}

\t\t\tconst coachName = coach.name || coach.email.split('@')[0];

\t\t\t// Vérifier si un compte existe déjà pour cet email
\t\t\tconst { data: existingProfile } = await supabase
\t\t\t\t.from('profiles')
\t\t\t\t.select('id')
\t\t\t\t.eq('email', to.toLowerCase())
\t\t\t\t.single();

\t\t\tlet clientId = null;
\t\t\tif (existingProfile) {
\t\t\t\tclientId = existingProfile.id;
\t\t\t\tconsole.log('👤 Client existe déjà:', to);

\t\t\t\t// Vérifier si la relation existe déjà
\t\t\t\tconst { data: existingRelation } = await supabase
\t\t\t\t\t.from('coach_clients')
\t\t\t\t\t.select('id')
\t\t\t\t\t.eq('coach_id', coachId)
\t\t\t\t\t.eq('client_id', clientId)
\t\t\t\t\t.single();

\t\t\t\tif (existingRelation) {
\t\t\t\t\treturn errorResponse('Ce client est déjà invité', 400);
\t\t\t\t}
\t\t\t}

\t\t\t// Créer une invitation en attente
\t\t\tlet invitationId = null;
\t\t\tif (clientId) {
\t\t\t\t// Client existe → créer la relation directement
\t\t\t\tconst { data: relation, error: relationError } = await supabase
\t\t\t\t\t.from('coach_clients')
\t\t\t\t\t.insert({
\t\t\t\t\t\tcoach_id: coachId,
\t\t\t\t\t\tclient_id: clientId,
\t\t\t\t\t\tstatus: 'active',
\t\t\t\t\t\tinvitation_email: to.toLowerCase()
\t\t\t\t\t})
\t\t\t\t\t.select()
\t\t\t\t\t.single();

\t\t\t\tif (relationError) {
\t\t\t\t\tconsole.error('❌ Erreur création relation:', relationError);
\t\t\t\t\treturn errorResponse('Erreur création relation: ' + relationError.message);
\t\t\t\t}

\t\t\t\tinvitationId = relation.id;
\t\t\t\tconsole.log('✅ Relation créée pour client existant');
\t\t\t} else {
\t\t\t\t// Client n'existe pas encore → créer invitation en attente
\t\t\t\tconst { data: invitation, error: inviteError } = await supabase
\t\t\t\t\t.from('coach_clients')
\t\t\t\t\t.insert({
\t\t\t\t\t\tcoach_id: coachId,
\t\t\t\t\t\tclient_id: null,
\t\t\t\t\t\tstatus: 'pending',
\t\t\t\t\t\tinvitation_email: to.toLowerCase()
\t\t\t\t\t})
\t\t\t\t\t.select()
\t\t\t\t\t.single();

\t\t\t\tif (inviteError) {
\t\t\t\t\tconsole.error('❌ Erreur création invitation:', inviteError);
\t\t\t\t\treturn errorResponse('Erreur création invitation: ' + inviteError.message);
\t\t\t\t}

\t\t\t\tinvitationId = invitation.id;
\t\t\t\tconsole.log('✅ Invitation créée en attente:', invitationId);
\t\t\t}

\t\t\t// Générer le lien d'invitation avec l'ID du coach
\t\t\tconst inviteLink = `https://ai-ikigai.com/auth.html?role=client&coach_id=${coachId}&invitation_id=${invitationId}`;

\t\t\tconst emailHTML = generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink);

\t\t\tconst resendPayload = {
\t\t\t\tfrom: `${coachName} via AI-Ikigai <noreply@ai-ikigai.com>`,
\t\t\t\tto: [to],
\t\t\t\treply_to: 'contact@ai-ikigai.com',
\t\t\t\tsubject: `${coachName} vous invite à découvrir votre Ikigai ✨`,
\t\t\t\thtml: emailHTML
\t\t\t};

\t\t\tconsole.log('📧 Envoi email invitation via Resend:', to);

\t\t\tconst response = await fetch('https://api.resend.com/emails', {
\t\t\t\tmethod: 'POST',
\t\t\t\theaders: {
\t\t\t\t\t'Content-Type': 'application/json',
\t\t\t\t\t'Authorization': `Bearer ${env.RESEND_API_KEY}`
\t\t\t\t},
\t\t\t\tbody: JSON.stringify(resendPayload)
\t\t\t});

\t\t\tconst result = await response.json();

\t\t\tif (!response.ok) {
\t\t\t\tconsole.error('❌ Erreur Resend:', result);
\t\t\t\tconst errorMessage = result.message || result.error || 'Échec envoi email';
\t\t\t\treturn errorResponse(`Erreur Resend: ${errorMessage}`, 500);
\t\t\t}

\t\t\tconsole.log('✅ Email envoyé via Resend:', result.id);

\t\t\treturn jsonResponse({
\t\t\t\tsuccess: true,
\t\t\t\tmessage: 'Invitation envoyée avec succès',
\t\t\t\temailId: result.id,
\t\t\t\tinvitationId: invitationId
\t\t\t});

\t\t} catch (error) {
\t\t\tconsole.error('❌ Erreur endpoint send-invitation:', error);
\t\t\treturn errorResponse(error.message, 500);
\t\t}
\t}

\t'''

# Reconstruct file
new_content = before + new_endpoint + after

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("✅ Invitation endpoint updated with coach-client relationship creation")
