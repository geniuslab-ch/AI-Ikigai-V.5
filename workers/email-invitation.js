// ================================================
// CLOUDFLARE WORKER - EMAIL INVITATIONS
// ================================================
// Deploy: npx wrangler deploy workers/email-invitation.js
// Usage: POST https://ai-ikigai.workers.dev/api/send-invitation

export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        // Handle OPTIONS (preflight)
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        if (request.method !== 'POST') {
            return new Response('Method not allowed', {
                status: 405,
                headers: corsHeaders
            });
        }

        try {
            const { to, clientName, coachName, personalMessage, inviteLink } = await request.json();

            // Validation
            if (!to || !clientName || !coachName || !inviteLink) {
                return new Response(JSON.stringify({ error: 'Missing required fields' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Template email HTML
            const emailHTML = `
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
            transition: transform 0.2s;
        }
        .cta-button:hover {
            transform: translateY(-2px);
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

            // Envoyer via MailChannels (gratuit sur Cloudflare Workers)
            const response = await fetch('https://api.mailchannels.net/tx/v1/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personalizations: [{
                        to: [{ email: to, name: clientName }]
                    }],
                    from: {
                        email: 'coach@ai-ikigai.com',
                        name: 'AI-Ikigai Coach'
                    },
                    subject: `${coachName} vous invite à découvrir votre Ikigai ✨`,
                    content: [{
                        type: 'text/html',
                        value: emailHTML
                    }]
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`MailChannels error: ${error}`);
            }

            return new Response(JSON.stringify({
                success: true,
                message: 'Email envoyé avec succès'
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
};
