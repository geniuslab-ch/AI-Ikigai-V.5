// ================================================
// CLOUDFLARE WORKER - GÉNÉRATION PDF RAPPORTS
// ================================================
// Deploy: npx wrangler deploy workers/generate-pdf.js
// Usage: POST https://ai-ikigai.workers.dev/api/generate-pdf

import { createClient } from '@supabase/supabase-js';

export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

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
            const { clientId, coachId } = await request.json();

            if (!clientId || !coachId) {
                return new Response(JSON.stringify({ error: 'Missing clientId or coachId' }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // Connexion Supabase
            const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);

            // Récupérer données client
            const { data: client, error: clientError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', clientId)
                .single();

            if (clientError) throw new Error('Client non trouvé');

            // Récupérer dernier questionnaire
            const { data: questionnaire, error: qError } = await supabase
                .from('questionnaires')
                .select('*')
                .eq('user_id', clientId)
                .eq('completed', true)
                .order('completed_at', { ascending: false })
                .limit(1)
                .single();

            if (qError) throw new Error('Aucune analyse Ikigai trouvée');

            // Générer PDF en HTML/CSS (plus simple que jsPDF)
            const pdfHTML = generatePDFHTML(client, questionnaire);

            // Option 1 : Retourner HTML pour impression navigateur
            return new Response(pdfHTML, {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'text/html',
                }
            });

            // Option 2 : Utiliser un service PDF comme Puppeteer/Browserless
            // const pdfBuffer = await generatePDFWithPuppeteer(pdfHTML);
            // return new Response(pdfBuffer, {
            //     headers: {
            //         ...corsHeaders,
            //         'Content-Type': 'application/pdf',
            //         'Content-Disposition': `attachment; filename="rapport-ikigai-${client.name}.pdf"`
            //     }
            // });

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
};

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
        <p>Votre niveau d'alignement avec vo raison d'être</p>
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
