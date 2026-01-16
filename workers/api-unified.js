// ================================================
// CLOUDFLARE WORKER - UNIFIED API
// ================================================
// Combines: email invitations, PDF generation, Google Calendar
// Deploy: npx wrangler deploy

import { createClient } from '@supabase/supabase-js';

export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        };

        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // ============================================
            // ROUTE 1: Send Client Invitation Email
            // ============================================
            if (url.pathname === '/api/send-invitation' && request.method === 'POST') {
                return await handleSendInvitation(request, env, corsHeaders);
            }

            // ============================================
            // ROUTE 2: Generate PDF Report
            // ============================================
            if (url.pathname === '/api/generate-pdf' && request.method === 'POST') {
                return await handleGeneratePDF(request, env, corsHeaders);
            }

            // ============================================
            // ROUTE 3: Google Calendar - OAuth Init
            // ============================================
            if (url.pathname === '/auth/google/init') {
                return handleGoogleOAuthInit(env);
            }

            // ============================================
            // ROUTE 4: Google Calendar - OAuth Callback
            // ============================================
            if (url.pathname === '/auth/google/callback') {
                return await handleGoogleOAuthCallback(request, env);
            }

            // ============================================
            // ROUTE 5: Google Calendar - Create Event
            // ============================================
            if (url.pathname === '/api/calendar/create-event' && request.method === 'POST') {
                return await handleCreateCalendarEvent(request, corsHeaders);
            }

            // ============================================
            // ROUTE 6: Brevo - Notification Nouveau Client
            // ============================================
            if (url.pathname === '/api/notify/new-client' && request.method === 'POST') {
                return await handleNotifyNewClient(request, env, corsHeaders);
            }

            // ============================================
            // 404: Route not found
            // ============================================
            return new Response(JSON.stringify({
                success: false,
                error: `Route non trouvée: ${url.pathname}`
            }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });

        } catch (error) {
            console.error('API Error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: error.message
            }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
    },

    async scheduled(event, env, ctx) {
        ctx.waitUntil(handleScheduledTasks(env));
    }
};

// ================================================
// HANDLER: Send Invitation Email
// ================================================
async function handleSendInvitation(request, env, corsHeaders) {
    try {
        const { to, clientName, coachName, personalMessage, inviteLink } = await request.json();

        // Validation
        if (!to || !clientName || !coachName || !inviteLink) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Email HTML template
        const emailHTML = generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink);

        // Check if Resend API key is configured
        if (!env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not configured in Cloudflare Worker secrets');
        }

        // Resend API payload
        const resendPayload = {
            from: `${coachName} via AI-Ikigai <noreply@ai-ikigai.com>`,
            to: [to],
            reply_to: 'contact@ai-ikigai.com',
            subject: `${coachName} vous invite à découvrir votre Ikigai ✨`,
            html: emailHTML
        };

        // Send via Resend API
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.RESEND_API_KEY}`
            },
            body: JSON.stringify(resendPayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('Resend error:', result);
            const errorMessage = result.message || result.error || 'Failed to send email';
            throw new Error(`Resend error: ${errorMessage}`);
        }

        console.log('✅ Email sent via Resend:', result.id);

        return new Response(JSON.stringify({
            success: true,
            message: 'Email envoyé avec succès',
            emailId: result.id
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ================================================
// HANDLER: Generate PDF Report
// ================================================
async function handleGeneratePDF(request, env, corsHeaders) {
    try {
        const { clientId, coachId } = await request.json();

        if (!clientId || !coachId) {
            return new Response(JSON.stringify({ error: 'Missing clientId or coachId' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Connect to Supabase
        const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

        // Get client data
        const { data: client, error: clientError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', clientId)
            .single();

        if (clientError) throw new Error('Client non trouvé');

        // Get latest questionnaire
        const { data: questionnaire, error: qError } = await supabase
            .from('questionnaires')
            .select('*')
            .eq('user_id', clientId)
            .eq('completed', true)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single();

        if (qError) throw new Error('Aucune analyse Ikigai trouvée');

        // Generate PDF HTML (returns HTML for browser print)
        const pdfHTML = generatePDFHTML(client, questionnaire);

        return new Response(pdfHTML, {
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/html',
            }
        });

    } catch (error) {
        console.error('Error generating PDF:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}

// ================================================
// HANDLER: Google OAuth Init
// ================================================
function handleGoogleOAuthInit(env) {
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${env.GOOGLE_CLIENT_ID}` +
        `&redirect_uri=${encodeURIComponent('https://ai-ikigai.ai-ikigai.workers.dev/auth/google/callback')}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.events')}` +
        `&access_type=offline` +
        `&prompt=consent`;

    return Response.redirect(authUrl, 302);
}

// ================================================
// HANDLER: Google OAuth Callback
// ================================================
async function handleGoogleOAuthCallback(request, env) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');

    if (!code) {
        return new Response('No code provided', { status: 400 });
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            code,
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            redirect_uri: 'https://ai-ikigai.ai-ikigai.workers.dev/auth/google/callback',
            grant_type: 'authorization_code'
        })
    });

    const tokens = await tokenResponse.json();

    if (!tokenResponse.ok) {
        return new Response(`Error: ${JSON.stringify(tokens)}`, { status: 400 });
    }

    // Return HTML page that sends tokens back to opener window
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

// ================================================
// HANDLER: Create Calendar Event
// ================================================
async function handleCreateCalendarEvent(request, corsHeaders) {
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

// ================================================
// TEMPLATE: Invitation Email HTML
// ================================================
function generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink) {
    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f8fafc;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(90deg, #00d4ff, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .tagline {
            color: #94a3b8;
            font-size: 0.9rem;
        }
        .content {
            line-height: 1.8;
            color: #334155;
        }
        .content h2 {
            color: #0a0a0f;
            margin-bottom: 20px;
        }
        .personal-message {
            background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #8b5cf6;
            font-style: italic;
            margin: 25px 0;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #00d4ff, #8b5cf6);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            margin: 30px 0;
            font-weight: 600;
            font-size: 1.1rem;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }
        .cta-container {
            text-align: center;
        }
        .benefits {
            margin: 30px 0;
        }
        .benefit-item {
            display: flex;
            align-items: flex-start;
            margin: 15px 0;
        }
        .benefit-icon {
            font-size: 1.5rem;
            margin-right: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 30px;
            border-top: 1px solid #e2e8f0;
            color: #94a3b8;
            font-size: 0.9rem;
        }
        .footer a {
            color: #8b5cf6;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AI-Ikigai</div>
            <div class="tagline">Découvrez votre raison d'être</div>
        </div>
        
        <div class="content">
            <h2>Bonjour ${clientName} 👋</h2>
            
            <p><strong>${coachName}</strong> vous invite à découvrir votre Ikigai avec AI-Ikigai !</p>
            
            ${personalMessage ? `
            <div class="personal-message">
                "${personalMessage}"
                <div style="text-align: right; margin-top: 10px; font-style: normal; color: #64748b;">— ${coachName}</div>
            </div>
            ` : ''}
            
            <div class="benefits">
                <div class="benefit-item">
                    <div class="benefit-icon">🎯</div>
                    <div>
                        <strong>Analyse personnalisée</strong><br>
                        Découvrez les 4 dimensions de votre Ikigai
                    </div>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">📊</div>
                    <div>
                        <strong>Dashboard interactif</strong><br>
                        Suivez votre progression et vos insights
                    </div>
                </div>
                <div class="benefit-item">
                    <div class="benefit-icon">🤝</div>
                    <div>
                        <strong>Accompagnement coach</strong><br>
                        Bénéficiez de l'expertise de ${coachName}
                    </div>
                </div>
            </div>
            
            <div class="cta-container">
                <a href="${inviteLink}" class="cta-button">
                    ✨ Créer mon compte gratuitement
                </a>
            </div>
            
            <p style="color: #94a3b8; font-size: 0.9rem; text-align: center;">
                Ce lien est valide pendant 7 jours
            </p>
        </div>
        
        <div class="footer">
            <p>Vous avez des questions ? Contactez directement ${coachName}</p>
            <p>© 2026 AI-Ikigai | <a href="https://ai-ikigai.com">ai-ikigai.com</a></p>
        </div>
    </div>
</body>
</html>
    `;
}

// ================================================
// TEMPLATE: PDF Report HTML
// ================================================
function generatePDFHTML(client, questionnaire) {
    const date = new Date().toLocaleDateString('fr-FR');

    return `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Rapport Ikigai - ${client.name}</title>
    <style>
        @page { margin: 2cm; }
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #8b5cf6;
            padding-bottom: 20px;
        }
        .logo {
            font-size: 2.5rem;
            font-weight: bold;
            background: linear-gradient(90deg, #00d4ff, #d946ef);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .client-info {
            margin: 30px 0;
            background: #f8fafc;
            padding: 20px;
            border-radius: 8px;
        }
        .score-global {
            text-align: center;
            margin: 40px 0;
        }
        .score-value {
            font-size: 4rem;
            font-weight: bold;
            color: #8b5cf6;
        }
        .dimensions {
            margin: 40px 0;
        }
        .dimension {
            margin: 25px 0;
            padding: 20px;
            background: #f8fafc;
            border-left: 4px solid #8b5cf6;
        }
        .dimension-title {
            font-size: 1.2rem;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .dimension-score {
            font-size: 2rem;
            color: #8b5cf6;
            margin: 10px 0;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #e2e8f0;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #00d4ff, #8b5cf6);
        }
        .footer {
            margin-top: 60px;
            text-align: center;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
            padding-top: 20px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">AI-Ikigai</div>
        <h1>Rapport d'Analyse Ikigai</h1>
    </div>

    <div class="client-info">
        <h2>${client.name}</h2>
        <p><strong>Email:</strong> ${client.email}</p>
        <p><strong>Date du rapport:</strong> ${date}</p>
        <p><strong>Analyse complétée le:</strong> ${new Date(questionnaire.completed_at).toLocaleDateString('fr-FR')}</p>
    </div>

    <div class="score-global">
        <h2>Score d'Alignement Global</h2>
        <div class="score-value">${questionnaire.ikigai_score}%</div>
        <p>Votre niveau d'alignement avec votre raison d'être</p>
    </div>

    <div class="dimensions">
        <h2>Les 4 Dimensions de Votre Ikigai</h2>
        
        <div class="dimension">
            <div class="dimension-title">🎯 Ce que vous aimez (Passion)</div>
            <div class="dimension-score">${questionnaire.passion_score || 0}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${questionnaire.passion_score || 0}%"></div>
            </div>
        </div>

        <div class="dimension">
            <div class="dimension-title">⭐ Ce en quoi vous excellez (Talent)</div>
            <div class="dimension-score">${questionnaire.talent_score || 0}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${questionnaire.talent_score || 0}%"></div>
            </div>
        </div>

        <div class="dimension">
            <div class="dimension-title">🌍 Ce dont le monde a besoin (Mission)</div>
            <div class="dimension-score">${questionnaire.mission_score || 0}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${questionnaire.mission_score || 0}%"></div>
            </div>
        </div>

        <div class="dimension">
            <div class="dimension-title">💰 Ce pour quoi vous pouvez être payé (Vocation)</div>
            <div class="dimension-score">${questionnaire.vocation_score || 0}%</div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${questionnaire.vocation_score || 0}%"></div>
            </div>
        </div>
    </div>

    <div class="footer">
        <p>Rapport généré par AI-Ikigai</p>
        <p>© 2026 AI-Ikigai | ai-ikigai.com</p>
    </div>

    <div class="no-print" style="text-align: center; margin: 40px 0;">
        <button onclick="window.print()" style="background: #8b5cf6; color: white; border: none; padding: 15px 30px; border-radius: 50px; font-size: 1.1rem; cursor: pointer;">
            📥 Télécharger PDF
        </button>
    </div>
</body>
</html>
    `;
}

// ================================================
// BREVO EMAIL FUNCTIONS
// ================================================

async function sendBrevoEmail(env, templateId, toEmail, params) {
    if (!env.BREVO_API_KEY) {
        throw new Error('BREVO_API_KEY not configured');
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': env.BREVO_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            templateId: parseInt(templateId),
            to: [{ email: toEmail }],
            params: params
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error('Brevo API Error:', errorData);
        throw new Error(`Brevo error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
}

// ================================================
// HANDLER: Notification Nouveau Client
// ================================================
async function handleNotifyNewClient(request, env, corsHeaders) {
    try {
        const { coachId, clientName, clientEmail } = await request.json();

        if (!coachId || !clientName || !clientEmail) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
        const { data: coach, error } = await supabaseClient
            .from('profiles')
            .select('email, name, notification_new_clients')
            .eq('id', coachId)
            .single();

        if (error || !coach) {
            return new Response(JSON.stringify({ error: 'Coach not found' }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        if (!coach.notification_new_clients) {
            return new Response(JSON.stringify({ success: true, message: 'Notifications disabled' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Template #1 = Nouveau Client
        await sendBrevoEmail(env, 1, coach.email, {
            coach_name: coach.name,
            client_name: clientName,
            client_email: clientEmail
        });

        console.log(`✅ Notification sent to ${coach.email} for new client: ${clientName}`);

        return new Response(JSON.stringify({ success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('Error in handleNotifyNewClient:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
// ================================================
// HANDLER: CRON - Session Reminders & Newsletter
// ================================================
async function handleScheduled(event, env) {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDate();
    
    // 9h UTC = Rappels séances
    if (hour === 9) {
        await sendSessionReminders(env);
    }
    
    // 10h UTC le 1er du mois = Newsletter
    if (hour === 10 && day === 1) {
        await sendMonthlyNewsletter(env);
    }
}

// ================================================
// FONCTION: Rappels Séances (Template #2)
// ================================================
async function sendSessionReminders(env) {
    try {
        const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        
        const { data: sessions, error } = await supabaseClient
            .from('coaching_sessions')
            .select('id, session_date, google_calendar_event_id, coach_id, client_id')
            .gte('session_date', tomorrowDate + 'T00:00:00')
            .lt('session_date', tomorrowDate + 'T23:59:59')
            .eq('status', 'scheduled');
        
        if (error || !sessions || sessions.length === 0) {
            console.log('No sessions tomorrow');
            return;
        }
        
        for (const session of sessions) {
            const { data: profiles } = await supabaseClient
                .from('profiles')
                .select('id, name, email, notification_sessions')
                .in('id', [session.coach_id, session.client_id]);
            
            const coach = profiles.find(p => p.id === session.coach_id);
            const client = profiles.find(p => p.id === session.client_id);
            
            if (!coach || !client) continue;
            if (!coach.notification_sessions) continue;
            
            const sessionDate = new Date(session.session_date);
            const calendarLink = session.google_calendar_event_id
                ? 'https://calendar.google.com/calendar/event?eid=' + session.google_calendar_event_id
                : 'https://ai-ikigai.com/dashboard-coach.html';
            
            await sendBrevoEmail(env, 2, coach.email, {
                coach_name: coach.name,
                client_name: client.name,
                session_date: sessionDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                }),
                session_time: sessionDate.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                google_calendar_link: calendarLink
            });
            
            console.log('Reminder sent to ' + coach.email + ' for session with ' + client.name);
        }
        
        console.log('Sent ' + sessions.length + ' session reminders');
        
    } catch (error) {
        console.error('Error in sendSessionReminders:', error);
    }
}

// ================================================
// FONCTION: Newsletter Mensuelle (Template #3)
// ================================================
async function sendMonthlyNewsletter(env) {
    try {
        const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
        
        const { data: coaches, error } = await supabaseClient
            .from('profiles')
            .select('email, name')
            .eq('role', 'coach')
            .eq('notification_newsletter', true);
        
        if (error || !coaches || coaches.length === 0) {
            console.log('No coaches with newsletter enabled');
            return;
        }
        
        const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' });
        
        for (const coach of coaches) {
            await sendBrevoEmail(env, 3, coach.email, {
                coach_name: coach.name,
                month: currentMonth
            });
            
            console.log('Newsletter sent to ' + coach.email);
        }
        
        console.log('Newsletter sent to ' + coaches.length + ' coaches');
        
    } catch (error) {
        console.error('Error in sendMonthlyNewsletter:', error);
    }
}
