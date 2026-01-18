#!/usr/bin/env python3
"""
Script pour ajouter TOUS les endpoints restants en une fois
Endpoints: PDF, Google OAuth (3), Brevo Notification
"""

import re

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def add_all_remaining_endpoints(content):
    """Ajoute tous les endpoints restants après /api/send-invitation"""
    
    all_endpoints = '''\t\t// ============ PDF GENERATION ENDPOINT ============

\t\t// POST /api/generate-pdf
\t\tif (path === '/api/generate-pdf' && method === 'POST') {
\t\t\ttry {
\t\t\t\tconst { clientId, coachId } = await request.json();

\t\t\t\tif (!clientId || !coachId) {
\t\t\t\t\treturn errorResponse('Missing clientId or coachId', 400);
\t\t\t\t}

\t\t\t\tconst supabase = getSupabaseClient(env);

\t\t\t\tconst { data: client, error: clientError } = await supabase
\t\t\t\t\t.from('profiles')
\t\t\t\t\t.select('*')
\t\t\t\t\t.eq('id', clientId)
\t\t\t\t\t.single();

\t\t\t\tif (clientError) {
\t\t\t\t\treturn errorResponse('Client non trouvé', 404);
\t\t\t\t}

\t\t\t\tconst { data: analysis, error: analysisError } = await supabase
\t\t\t\t\t.from('analyses')
\t\t\t\t\t.select('*')
\t\t\t\t\t.eq('user_id', clientId)
\t\t\t\t\t.order('created_at', { ascending: false })
\t\t\t\t\t.limit(1)
\t\t\t\t\t.maybeSingle();

\t\t\t\tif (analysisError || !analysis) {
\t\t\t\t\treturn errorResponse('Aucune analyse Ikigai trouvée', 404);
\t\t\t\t}

\t\t\t\tconst pdfHTML = generatePDFHTML(client, analysis);

\t\t\t\treturn new Response(pdfHTML, {
\t\t\t\t\theaders: {
\t\t\t\t\t\t...corsHeaders,
\t\t\t\t\t\t'Content-Type': 'text/html',
\t\t\t\t\t}
\t\t\t\t});

\t\t\t} catch (error) {
\t\t\t\tconsole.error('❌ Erreur génération PDF:', error);
\t\t\t\treturn errorResponse(error.message, 500);
\t\t\t}
\t\t}

\t\t// ============ GOOGLE CALENDAR ENDPOINTS ============

\t\t// GET /api/google/oauth/init
\t\tif (path === '/api/google/oauth/init' && method === 'GET') {
\t\t\ttry {
\t\t\t\tif (!env.GOOGLE_CLIENT_ID) {
\t\t\t\t\treturn errorResponse('Google OAuth non configuré', 500);
\t\t\t\t}

\t\t\t\tconst authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
\t\t\t\t\t`client_id=${env.GOOGLE_CLIENT_ID}` +
\t\t\t\t\t`&redirect_uri=${encodeURIComponent('https://ai-ikigai.ai-ikigai.workers.dev/api/google/oauth/callback')}` +
\t\t\t\t\t`&response_type=code` +
\t\t\t\t\t`&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.events')}` +
\t\t\t\t\t`&access_type=offline` +
\t\t\t\t\t`&prompt=consent`;

\t\t\t\treturn Response.redirect(authUrl, 302);
\t\t\t} catch (error) {
\t\t\t\treturn errorResponse(error.message, 500);
\t\t\t}
\t\t}

\t\t// GET /api/google/oauth/callback
\t\tif (path === '/api/google/oauth/callback' && method === 'GET') {
\t\t\ttry {
\t\t\t\tconst code = url.searchParams.get('code');

\t\t\t\tif (!code) {
\t\t\t\t\treturn errorResponse('No code provided', 400);
\t\t\t\t}

\t\t\t\tif (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
\t\t\t\t\treturn errorResponse('Google OAuth non configuré', 500);
\t\t\t\t}

\t\t\t\tconst tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
\t\t\t\t\tmethod: 'POST',
\t\t\t\t\theaders: { 'Content-Type': 'application/json' },
\t\t\t\t\tbody: JSON.stringify({
\t\t\t\t\t\tcode,
\t\t\t\t\t\tclient_id: env.GOOGLE_CLIENT_ID,
\t\t\t\t\t\tclient_secret: env.GOOGLE_CLIENT_SECRET,
\t\t\t\t\t\tredirect_uri: 'https://ai-ikigai.ai-ikigai.workers.dev/api/google/oauth/callback',
\t\t\t\t\t\tgrant_type: 'authorization_code'
\t\t\t\t\t})
\t\t\t\t});

\t\t\t\tconst tokens = await tokenResponse.json();

\t\t\t\tif (!tokenResponse.ok) {
\t\t\t\t\treturn errorResponse(`Google OAuth error: ${JSON.stringify(tokens)}`, 400);
\t\t\t\t}

\t\t\t\treturn new Response(`
<!DOCTYPE html>
<html>
<head>
\t<title>Google Calendar Connected</title>
\t<style>
\t\tbody { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
\t\t.container { text-align: center; background: white; padding: 40px; border-radius: 12px; }
\t\th1 { color: #667eea; }
\t</style>
</head>
<body>
\t<div class="container">
\t\t<h1>✅ Connexion Google Calendar réussie !</h1>
\t\t<p>Fermeture automatique...</p>
\t</div>
\t<script>
\t\tif (window.opener) {
\t\t\twindow.opener.postMessage({
\t\t\t\ttype: 'GOOGLE_AUTH_SUCCESS',
\t\t\t\ttokens: ${JSON.stringify(tokens)}
\t\t\t}, '*');
\t\t\tsetTimeout(() => window.close(), 2000);
\t\t}
\t</script>
</body>
</html>
\t\t\t`, {
\t\t\t\t\theaders: { 'Content-Type': 'text/html' }
\t\t\t\t});

\t\t\t} catch (error) {
\t\t\t\treturn errorResponse(error.message, 500);
\t\t\t}
\t\t}

\t\t// POST /api/google/create-event
\t\tif (path === '/api/google/create-event' && method === 'POST') {
\t\t\ttry {
\t\t\t\tconst { accessToken, event } = await request.json();

\t\t\t\tif (!accessToken || !event) {
\t\t\t\t\treturn errorResponse('Missing accessToken or event', 400);
\t\t\t\t}

\t\t\t\tconst response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
\t\t\t\t\tmethod: 'POST',
\t\t\t\t\theaders: {
\t\t\t\t\t\t'Authorization': `Bearer ${accessToken}`,
\t\t\t\t\t\t'Content-Type': 'application/json'
\t\t\t\t\t},
\t\t\t\t\tbody: JSON.stringify(event)
\t\t\t\t});

\t\t\t\tconst result = await response.json();

\t\t\t\tif (!response.ok) {
\t\t\t\t\tthrow new Error(result.error?.message || 'Failed to create event');
\t\t\t\t}

\t\t\t\treturn jsonResponse(result);

\t\t\t} catch (error) {
\t\t\t\treturn errorResponse(error.message, 500);
\t\t\t}
\t\t}

\t\t// ============ BREVO NOTIFICATION ENDPOINT ============

\t\t// POST /api/notify/new-client
\t\tif (path === '/api/notify/new-client' && method === 'POST') {
\t\t\ttry {
\t\t\t\tconst { coachId, clientName, clientEmail } = await request.json();

\t\t\t\tif (!coachId || !clientName || !clientEmail) {
\t\t\t\t\treturn errorResponse('Missing required fields', 400);
\t\t\t\t}

\t\t\t\tconst supabase = getSupabaseClient(env);

\t\t\t\tconst { data: coach, error } = await supabase
\t\t\t\t\t.from('profiles')
\t\t\t\t\t.select('email, name, notification_new_clients')
\t\t\t\t\t.eq('id', coachId)
\t\t\t\t\t.single();

\t\t\t\tif (error || !coach) {
\t\t\t\t\treturn errorResponse('Coach not found', 404);
\t\t\t\t}

\t\t\t\tif (!coach.notification_new_clients) {
\t\t\t\t\treturn jsonResponse({ 
\t\t\t\t\t\tsuccess: true, 
\t\t\t\t\t\tmessage: 'Notifications disabled' 
\t\t\t\t\t});
\t\t\t\t}

\t\t\t\tawait sendBrevoEmail(env, 1, coach.email, {
\t\t\t\t\tcoach_name: coach.name,
\t\t\t\t\tclient_name: clientName,
\t\t\t\t\tclient_email: clientEmail
\t\t\t\t});

\t\t\t\tconsole.log(`✅ Notification sent to ${coach.email}`);

\t\t\t\treturn jsonResponse({ success: true });

\t\t\t} catch (error) {
\t\t\t\treturn errorResponse(error.message, 500);
\t\t\t}
\t\t}

'''
    
    # Find the admin stats endpoint
    admin_match = re.search(r'(\t\t// GET /api/dashboard/admin/stats)', content)
    if not admin_match:
        raise Exception("Cannot find admin stats endpoint")
    
    insert_pos = admin_match.start()
    
    # Insert all endpoints before admin
    new_content = content[:insert_pos] + all_endpoints + content[insert_pos:]
    
    return new_content

if __name__ == '__main__':
    filepath = 'index-supabase.js'
    
    print("📖 Reading index-supabase.js...")
    content = read_file(filepath)
    
    print("✏️  Adding remaining endpoints:")
    print("   - /api/generate-pdf")
    print("   - /api/google/oauth/init")
    print("   - /api/google/oauth/callback")
    print("   - /api/google/create-event")
    print("   - /api/notify/new-client")
    
    new_content = add_all_remaining_endpoints(content)
    
    print("💾 Writing updated file...")
    write_file(filepath, new_content)
    
    print("✅ Done! All endpoints added")
