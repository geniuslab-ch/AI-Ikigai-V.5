// ================================================
// CLOUDFLARE WORKER - GOOGLE CALENDAR
// ================================================
// Deploy: npx wrangler deploy workers/google-calendar.js

export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        // Route 1: Initier OAuth
        if (url.pathname === '/auth/google/init') {
            const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
                `client_id=${env.GOOGLE_CLIENT_ID}` +
                `&redirect_uri=${encodeURIComponent('https://ai-ikigai.com/auth/google/callback')}` +
                `&response_type=code` +
                `&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.events')}` +
                `&access_type=offline` +
                `&prompt=consent`;

            return Response.redirect(authUrl, 302);
        }

        // Route 2: Callback OAuth
        if (url.pathname === '/auth/google/callback') {
            const code = url.searchParams.get('code');

            if (!code) {
                return new Response('No code provided', { status: 400 });
            }

            // Échanger le code contre un access token
            const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code,
                    client_id: env.GOOGLE_CLIENT_ID,
                    client_secret: env.GOOGLE_CLIENT_SECRET,
                    redirect_uri: 'https://ai-ikigai.com/auth/google/callback',
                    grant_type: 'authorization_code'
                })
            });

            const tokens = await tokenResponse.json();

            if (!tokenResponse.ok) {
                return new Response(`Error: ${JSON.stringify(tokens)}`, { status: 400 });
            }

            // Retourner page HTML avec les tokens
            return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>Google Calendar Connected</title>
                    <style>
                        body {
                            font-family: Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        }
                        .container {
                            text-align: center;
                            background: white;
                            padding: 40px;
                            border-radius: 12px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                        }
                        h1 { color: #667eea; margin: 0 0 20px 0; }
                        p { color: #666; margin: 15px 0; }
                        .spinner {
                            width: 40px;
                            height: 40px;
                            border: 4px solid #f3f3f3;
                            border-top: 4px solid #667eea;
                            border-radius: 50%;
                            animation: spin 1s linear infinite;
                            margin: 20px auto;
                        }
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>✅ Connexion Google Calendar réussie !</h1>
                        <div class="spinner"></div>
                        <p>Fermeture automatique...</p>
                    </div>
                    <script>
                        // Envoyer les tokens au dashboard
                        if (window.opener) {
                            window.opener.postMessage({
                                type: 'GOOGLE_AUTH_SUCCESS',
                                tokens: ${JSON.stringify(tokens)}
                            }, '*');
                            setTimeout(() => window.close(), 2000);
                        }
                    </script>
                </body>
                </html>
            `, {
                headers: { 'Content-Type': 'text/html' }
            });
        }

        // Route 3: Créer un événement
        if (url.pathname === '/api/calendar/create-event' && request.method === 'POST') {
            try {
                const { accessToken, event } = await request.json();

                if (!accessToken || !event) {
                    return new Response(JSON.stringify({ error: 'Missing accessToken or event' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event)
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error?.message || 'Failed to create event');
                }

                return new Response(JSON.stringify(result), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            } catch (error) {
                return new Response(JSON.stringify({ error: error.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        return new Response('Not found', {
            status: 404,
            headers: corsHeaders
        });
    }
};
