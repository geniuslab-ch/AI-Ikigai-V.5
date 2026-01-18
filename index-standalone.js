/**
 * AI-IKIGAI Backend - VERSION STANDALONE (sans npm)
 * Compatible avec l'éditeur Cloudflare Dashboard
 * Combine CV + Questionnaire avec Claude AI + Supabase Auth
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
}

function errorResponse(message, status = 400) {
    console.error('❌ Error:', message);
    return jsonResponse({ success: false, error: message }, status);
}

// ============================================
// SUPABASE CLIENT (sans SDK - utilise fetch)
// ============================================

async function supabaseQuery(env, method, table, options = {}) {
    const url = `${env.SUPABASE_URL}/rest/v1/${table}${options.query || ''}`;

    const headers = {
        'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
    };

    if (options.select) {
        headers['Accept'] = 'application/json';
    }

    const fetchOptions = {
        method,
        headers
    };

    if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Supabase query failed');
    }

    return data;
}

async function supabaseAuth(env, token) {
    const response = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
        headers: {
            'apikey': env.SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) {
        return null;
    }

    return await response.json();
}

// ============================================
// ANALYSE CV avec Claude AI
// ============================================

async function analyzeCVWithClaude(cvText, env) {
    if (!env.ANTHROPIC_API_KEY && !env.CLAUDE_API_KEY) {
        console.warn('⚠️ Pas de clé API Claude, utilisation analyse simple');
        return analyzeSimpleCV(cvText);
    }

    try {
        console.log('🤖 Appel Claude API pour analyse CV...');

        const apiKey = env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 2000,
                messages: [{
                    role: 'user',
                    content: `Analyse ce CV et extrait les informations clés au format JSON strict (sans texte avant ou après):

{
  "skills": ["compétence1", "compétence2", ...],
  "experiences": ["poste1 chez entreprise1", "poste2", ...],
  "education": ["diplôme1", "diplôme2", ...],
  "industries": ["industrie1", "industrie2", ...],
  "yearsExperience": nombre_années
}

CV:
${cvText.substring(0, 4000)}

Retourne UNIQUEMENT le JSON, rien d'autre.`
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erreur Claude API:', data);
            return analyzeSimpleCV(cvText);
        }

        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const cvData = JSON.parse(jsonMatch[0]);
            console.log('✅ CV analysé par Claude:', cvData);
            return cvData;
        }

        console.warn('⚠️ Pas de JSON trouvé dans la réponse Claude');
        return analyzeSimpleCV(cvText);

    } catch (error) {
        console.error('❌ Erreur analyse Claude:', error.message);
        return analyzeSimpleCV(cvText);
    }
}

function analyzeSimpleCV(cvText) {
    console.log('📊 Analyse simple du CV (sans IA)');
    const text = cvText.toLowerCase();

    const cvData = {
        skills: [],
        experiences: [],
        education: [],
        industries: [],
        yearsExperience: 0
    };

    const techSkills = ['javascript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker',
        'git', 'api', 'machine learning', 'ai', 'data', 'cloud', 'typescript', 'angular', 'vue',
        'html', 'css', 'mongodb', 'postgresql', 'kubernetes', 'terraform'];

    techSkills.forEach(skill => {
        if (text.includes(skill)) {
            cvData.skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
    });

    const softSkills = ['leadership', 'communication', 'management', 'gestion', 'stratégie',
        'analyse', 'créativité', 'innovation', 'organisation', 'autonomie'];

    softSkills.forEach(skill => {
        if (text.includes(skill)) {
            cvData.skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
        }
    });

    const industries = ['tech', 'finance', 'santé', 'éducation', 'retail', 'consulting'];
    industries.forEach(industry => {
        if (text.includes(industry)) {
            cvData.industries.push(industry);
        }
    });

    const yearMatches = text.match(/(\d{4})/g);
    if (yearMatches && yearMatches.length >= 2) {
        const years = yearMatches.map(y => parseInt(y)).filter(y => y >= 1990 && y <= new Date().getFullYear()).sort();
        if (years.length > 0) {
            cvData.yearsExperience = Math.min(new Date().getFullYear() - years[0], 40);
        }
    }

    cvData.skills = [...new Set(cvData.skills)];
    cvData.industries = [...new Set(cvData.industries)];

    console.log('✅ CV analysé (simple):', {
        skills: cvData.skills.length,
        yearsExp: cvData.yearsExperience
    });

    return cvData;
}

// ============================================
// GÉNÉRATION RECOMMANDATIONS avec Claude AI
// ============================================

async function generateRecommendationsWithClaude(answers, cvData, env) {
    if (!env.ANTHROPIC_API_KEY && !env.CLAUDE_API_KEY) {
        console.warn('⚠️ Pas de clé API Claude, utilisation génération simple');
        return generateSimpleRecommendations(answers, cvData);
    }

    try {
        console.log('🤖 Appel Claude API pour recommandations...');

        const apiKey = env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY;

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                max_tokens: 3000,
                messages: [{
                    role: 'user',
                    content: `Tu es un expert en orientation professionnelle. Analyse ces données et génère un profil Ikigai personnalisé au format JSON strict:

RÉPONSES QUESTIONNAIRE:
${JSON.stringify(answers, null, 2)}

CV ANALYSÉ:
Compétences: ${cvData.skills.join(', ') || 'Non spécifié'}
Expériences: ${cvData.experiences.join(', ') || 'Non spécifié'}
Formation: ${cvData.education.join(', ') || 'Non spécifié'}
Industries: ${cvData.industries.join(', ') || 'Non spécifié'}
Années d'expérience: ${cvData.yearsExperience || 0}

Génère un JSON avec cette structure exacte (sans texte avant ou après):
{
  "passions": ["passion1", "passion2", "passion3"],
  "talents": ["talent1", "talent2", "talent3"],
  "mission": ["mission1", "mission2", "mission3"],
  "vocation": ["vocation1", "vocation2", "vocation3"],
  "recommendations": [
    {
      "title": "Poste recommandé 1",
      "description": "Description personnalisée basée sur le profil réel",
      "matchScore": 95
    },
    {
      "title": "Poste recommandé 2", 
      "description": "Description personnalisée basée sur le profil réel",
      "matchScore": 88
    },
    {
      "title": "Poste recommandé 3",
      "description": "Description personnalisée basée sur le profil réel", 
      "matchScore": 82
    }
  ],
  "score": {
    "passion": 85,
    "profession": 75,
    "mission": 90,
    "vocation": 80
  }
}

IMPORTANT: Base-toi sur les VRAIES réponses et le VRAI CV pour personnaliser. Sois spécifique et pertinent. Retourne UNIQUEMENT le JSON.`
                }]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Erreur Claude API:', data);
            return generateSimpleRecommendations(answers, cvData);
        }

        const content = data.content[0].text;
        const jsonMatch = content.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const analysis = JSON.parse(jsonMatch[0]);
            console.log('✅ Recommandations générées par Claude');
            return analysis;
        }

        console.warn('⚠️ Pas de JSON trouvé dans la réponse Claude');
        return generateSimpleRecommendations(answers, cvData);

    } catch (error) {
        console.error('❌ Erreur génération Claude:', error.message);
        return generateSimpleRecommendations(answers, cvData);
    }
}

function generateSimpleRecommendations(answers, cvData) {
    console.log('📊 Génération simple des recommandations (sans IA)');

    const analysis = {
        passions: [],
        talents: [],
        mission: [],
        vocation: [],
        recommendations: [],
        score: { passion: 0, profession: 0, mission: 0, vocation: 0 }
    };

    const allAnswers = [];
    for (const key in answers) {
        const value = answers[key];
        if (Array.isArray(value)) {
            allAnswers.push(...value);
        } else if (value) {
            allAnswers.push(String(value));
        }
    }

    const mapping = {
        'create': { label: 'Créativité', category: 'passion', score: 25 },
        'analyze': { label: 'Analyse', category: 'profession', score: 20 },
        'teach': { label: 'Enseignement', category: 'mission', score: 30 },
        'connect': { label: 'Networking', category: 'passion', score: 20 },
        'build': { label: 'Construction', category: 'profession', score: 25 },
        'explore': { label: 'Exploration', category: 'passion', score: 20 },
        'impact': { label: 'Impact positif', category: 'mission', score: 30 },
        'tech': { label: 'Technologie', category: 'profession', score: 20 },
        'art': { label: 'Art & Design', category: 'passion', score: 25 },
        'business': { label: 'Business', category: 'vocation', score: 20 },
        'science': { label: 'Sciences', category: 'profession', score: 20 },
        'social': { label: 'Impact social', category: 'mission', score: 30 },
        'health': { label: 'Santé & Bien-être', category: 'mission', score: 25 },
        'challenge': { label: 'Défis', category: 'passion', score: 20 },
        'learn': { label: 'Apprentissage', category: 'passion', score: 20 },
        'freedom': { label: 'Liberté', category: 'passion', score: 25 },
        'communication': { label: 'Communication', category: 'profession', score: 20 },
        'leadership': { label: 'Leadership', category: 'profession', score: 25 },
        'creativity': { label: 'Créativité', category: 'passion', score: 25 },
        'education': { label: 'Éducation', category: 'mission', score: 30 },
        'environment': { label: 'Environnement', category: 'mission', score: 30 },
        'innovation': { label: 'Innovation', category: 'vocation', score: 25 },
        'startup': { label: 'Startup', category: 'vocation', score: 25 },
        'remote': { label: 'Télétravail', category: 'vocation', score: 15 },
        'freelance': { label: 'Freelance', category: 'vocation', score: 20 },
    };

    allAnswers.forEach(answer => {
        const lower = String(answer).toLowerCase().trim();
        if (mapping[lower]) {
            const item = mapping[lower];
            if (item.category === 'passion') analysis.passions.push(item.label);
            else if (item.category === 'profession') analysis.talents.push(item.label);
            else if (item.category === 'mission') analysis.mission.push(item.label);
            else if (item.category === 'vocation') analysis.vocation.push(item.label);
            analysis.score[item.category] = Math.min(100, (analysis.score[item.category] || 0) + item.score);
        }
    });

    if (cvData.skills && cvData.skills.length > 0) {
        analysis.talents.push(...cvData.skills.slice(0, 5));
        analysis.score.profession = Math.min(100, analysis.score.profession + 30);
    }

    if (cvData.industries && cvData.industries.length > 0) {
        analysis.vocation.push(...cvData.industries.slice(0, 3));
        analysis.score.vocation = Math.min(100, analysis.score.vocation + 20);
    }

    analysis.passions = [...new Set(analysis.passions)].slice(0, 5);
    analysis.talents = [...new Set(analysis.talents)].slice(0, 5);
    analysis.mission = [...new Set(analysis.mission)].slice(0, 5);
    analysis.vocation = [...new Set(analysis.vocation)].slice(0, 5);

    if (analysis.passions.length === 0) analysis.passions = ['Innovation', 'Créativité', 'Apprentissage'];
    if (analysis.talents.length === 0) analysis.talents = ['Résolution de problèmes', 'Communication', 'Organisation'];
    if (analysis.mission.length === 0) analysis.mission = ['Impact positif', 'Développement', 'Contribution'];
    if (analysis.vocation.length === 0) analysis.vocation = ['Conseil', 'Formation', 'Expertise'];

    for (const key in analysis.score) {
        if (analysis.score[key] === 0) analysis.score[key] = 60;
        analysis.score[key] = Math.max(50, Math.min(100, analysis.score[key]));
    }

    const dominant = Object.entries(analysis.score).sort((a, b) => b[1] - a[1])[0][0];

    if (dominant === 'passion' && analysis.passions[0]) {
        analysis.recommendations.push({
            title: `Créateur ${analysis.passions[0]}`,
            description: `Exploitez votre passion pour ${analysis.passions[0].toLowerCase()} en créant des projets innovants qui vous inspirent.`,
            matchScore: 92
        });
    } else if (dominant === 'mission' && analysis.mission[0]) {
        analysis.recommendations.push({
            title: `Responsable ${analysis.mission[0]}`,
            description: `Dirigez des initiatives dans ${analysis.mission[0].toLowerCase()} pour créer un impact durable.`,
            matchScore: 90
        });
    } else if (dominant === 'profession' && analysis.talents[0]) {
        analysis.recommendations.push({
            title: `Expert ${analysis.talents[0]}`,
            description: `Devenez une référence en ${analysis.talents[0].toLowerCase()} grâce à votre expertise unique.`,
            matchScore: 88
        });
    } else {
        analysis.recommendations.push({
            title: `Consultant Stratégique`,
            description: `Conseillez des organisations en combinant vos compétences et votre vision.`,
            matchScore: 85
        });
    }

    if (cvData.skills && cvData.skills.length > 0) {
        const mainSkill = cvData.skills[0];
        const expText = cvData.yearsExperience > 0 ? ` avec ${cvData.yearsExperience} ans d'expérience` : '';
        analysis.recommendations.push({
            title: `Lead ${mainSkill}`,
            description: `Dirigez des équipes et projets en ${mainSkill.toLowerCase()}${expText} pour maximiser votre impact.`,
            matchScore: 87
        });
    }

    if (analysis.passions[0] && analysis.mission[0]) {
        analysis.recommendations.push({
            title: `Entrepreneur ${analysis.passions[0]} & ${analysis.mission[0]}`,
            description: `Créez votre entreprise alliant ${analysis.passions[0].toLowerCase()} et ${analysis.mission[0].toLowerCase()}.`,
            matchScore: 84
        });
    }

    while (analysis.recommendations.length < 3) {
        analysis.recommendations.push({
            title: 'Consultant Indépendant',
            description: 'Développez votre activité de conseil en exploitant votre expertise unique.',
            matchScore: 75
        });
    }

    return analysis;
}

// ============================================
// HANDLER PRINCIPAL
// ============================================

async function handleRequest(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    console.log(`📥 ${method} ${path}`);

    if (method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
        // Health check
        if (path === '/api/health') {
            return jsonResponse({
                success: true,
                status: 'ok',
                version: '3.0.0-STANDALONE',
                features: ['cv-analysis', 'claude-ai', 'supabase-auth', 'dashboards'],
                hasClaudeKey: !!(env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY),
                hasSupabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
                hasKV: !!env.IKIGAI_KV,
                timestamp: new Date().toISOString()
            });
        }

        // ============ DASHBOARD ENDPOINTS ============

        // GET /api/dashboard/client
        if (path === '/api/dashboard/client' && method === 'GET') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return errorResponse('Non authentifié', 401);
            }

            const token = authHeader.replace('Bearer ', '');
            const user = await supabaseAuth(env, token);

            if (!user) {
                return errorResponse('Token invalide', 401);
            }

            // Récupérer les questionnaires
            const questionnaires = await supabaseQuery(env, 'GET', 'questionnaires', {
                query: `?user_id=eq.${user.id}&order=created_at.desc`
            });

            return jsonResponse({
                success: true,
                analyses: questionnaires,
                latestAnalysis: questionnaires[0]?.analysis || null,
                totalAnalyses: questionnaires.length
            });
        }

        // GET /api/dashboard/coach
        if (path === '/api/dashboard/coach' && method === 'GET') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return errorResponse('Non authentifié', 401);
            }

            const token = authHeader.replace('Bearer ', '');
            const user = await supabaseAuth(env, token);

            if (!user) {
                return errorResponse('Token invalide', 401);
            }

            // Vérifier le rôle
            const profiles = await supabaseQuery(env, 'GET', 'profiles', {
                query: `?id=eq.${user.id}&select=role`
            });

            if (!profiles[0] || profiles[0].role !== 'coach') {
                return errorResponse('Accès refusé - rôle coach requis', 403);
            }

            // Récupérer les clients
            const relations = await supabaseQuery(env, 'GET', 'coach_clients', {
                query: `?coach_id=eq.${user.id}&select=client_id,added_at`
            });

            const clientsWithStats = [];
            for (const rel of relations) {
                const clientProfiles = await supabaseQuery(env, 'GET', 'profiles', {
                    query: `?id=eq.${rel.client_id}&select=id,email,name`
                });

                const questionnaires = await supabaseQuery(env, 'GET', 'questionnaires', {
                    query: `?user_id=eq.${rel.client_id}&select=id`
                });

                if (clientProfiles[0]) {
                    clientsWithStats.push({
                        ...clientProfiles[0],
                        added_at: rel.added_at,
                        analyses_count: questionnaires.length
                    });
                }
            }

            return jsonResponse({
                success: true,
                stats: {
                    totalClients: clientsWithStats.length,
                    totalAnalyses: clientsWithStats.reduce((sum, c) => sum + c.analyses_count, 0)
                },
                clients: clientsWithStats
            });
        }

        // POST /api/dashboard/coach/clients/add
        if (path === '/api/dashboard/coach/clients/add' && method === 'POST') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return errorResponse('Non authentifié', 401);
            }

            const token = authHeader.replace('Bearer ', '');
            const user = await supabaseAuth(env, token);

            if (!user) {
                return errorResponse('Token invalide', 401);
            }

            const { clientEmail } = await request.json();

            // Trouver le client
            const clientProfiles = await supabaseQuery(env, 'GET', 'profiles', {
                query: `?email=eq.${clientEmail.toLowerCase()}&select=id`
            });

            if (!clientProfiles[0]) {
                return errorResponse('Client non trouvé avec cet email');
            }

            // Créer la relation
            try {
                await supabaseQuery(env, 'POST', 'coach_clients', {
                    body: {
                        coach_id: user.id,
                        client_id: clientProfiles[0].id
                    }
                });
            } catch (e) {
                if (e.message.includes('duplicate') || e.message.includes('unique')) {
                    return errorResponse('Ce client est déjà dans votre liste');
                }
                throw e;
            }

            return jsonResponse({ success: true, message: 'Client ajouté avec succès' });
        }

        // GET /api/dashboard/admin/stats
        if (path === '/api/dashboard/admin/stats' && method === 'GET') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return errorResponse('Non authentifié', 401);
            }

            const token = authHeader.replace('Bearer ', '');
            const user = await supabaseAuth(env, token);

            if (!user) {
                return errorResponse('Token invalide', 401);
            }

            // Vérifier le rôle
            const profiles = await supabaseQuery(env, 'GET', 'profiles', {
                query: `?id=eq.${user.id}&select=role`
            });

            if (!profiles[0] || !['admin', 'super_admin'].includes(profiles[0].role)) {
                return errorResponse('Accès refusé - rôle admin requis', 403);
            }

            // Compter les utilisateurs et analyses
            const allProfiles = await supabaseQuery(env, 'GET', 'profiles', {
                query: '?select=id'
            });

            const allQuestionnaires = await supabaseQuery(env, 'GET', 'questionnaires', {
                query: '?select=id'
            });

            return jsonResponse({
                success: true,
                stats: {
                    totalUsers: allProfiles.length,
                    totalAnalyses: allQuestionnaires.length,
                    totalRevenue: 0
                }
            });
        }

        // GET /api/dashboard/admin/users
        if (path === '/api/dashboard/admin/users' && method === 'GET') {
            const authHeader = request.headers.get('Authorization');
            if (!authHeader) {
                return errorResponse('Non authentifié', 401);
            }

            const token = authHeader.replace('Bearer ', '');
            const user = await supabaseAuth(env, token);

            if (!user) {
                return errorResponse('Token invalide', 401);
            }

            // Vérifier le rôle
            const profiles = await supabaseQuery(env, 'GET', 'profiles', {
                query: `?id=eq.${user.id}&select=role`
            });

            if (!profiles[0] || !['admin', 'super_admin'].includes(profiles[0].role)) {
                return errorResponse('Accès refusé - rôle admin requis', 403);
            }

            // Récupérer tous les utilisateurs
            const users = await supabaseQuery(env, 'GET', 'profiles', {
                query: '?select=id,email,name,role,plan,created_at&order=created_at.desc'
            });

            return jsonResponse({
                success: true,
                users: users || []
            });
        }

        // ============ ENDPOINTS EXISTANTS ============

        // Submit questionnaire
        if (path === '/api/questionnaire/submit' && method === 'POST') {
            console.log('📝 POST /api/questionnaire/submit');

            const body = await request.json();
            const { answers, email, user_id } = body;

            if (!answers || Object.keys(answers).length === 0) {
                return errorResponse('Pas de réponses fournies');
            }

            const questionnaireId = 'ikigai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

            const emptyCvData = {
                skills: [],
                experiences: [],
                education: [],
                industries: [],
                yearsExperience: 0
            };

            const analysis = await generateRecommendationsWithClaude(answers, emptyCvData, env);

            // Stocker dans KV
            if (env.IKIGAI_KV) {
                try {
                    await env.IKIGAI_KV.put(questionnaireId, JSON.stringify({
                        answers, email, analysis, cvData: null, timestamp: Date.now()
                    }), { expirationTtl: 86400 });
                } catch (e) {
                    console.warn('⚠️ Erreur stockage KV:', e.message);
                }
            }

            // Stocker dans Supabase
            if (env.SUPABASE_URL) {
                try {
                    // Utiliser user_id du body si fourni, sinon chercher par email
                    let userId = user_id || null;

                    if (!userId && email) {
                        const profiles = await supabaseQuery(env, 'GET', 'profiles', {
                            query: `?email=eq.${email.toLowerCase()}&select=id`
                        });
                        userId = profiles[0]?.id || null;
                    }

                    console.log('💾 Saving questionnaire with user_id:', userId);

                    await supabaseQuery(env, 'POST', 'questionnaires', {
                        body: {
                            id: questionnaireId,
                            user_id: userId,
                            email: email || null,
                            answers,
                            cv_data: null,
                            analysis
                        }
                    });
                } catch (e) {
                    console.warn('⚠️ Erreur stockage Supabase:', e.message);
                }
            }

            return jsonResponse({
                success: true,
                questionnaireId,
                analysis,
                message: 'Questionnaire analysé avec succès'
            });
        }

        // Upload CV
        if (path === '/api/questionnaire/upload-cv' && method === 'POST') {
            console.log('📄 POST /api/questionnaire/upload-cv');

            const formData = await request.formData();
            const cvFile = formData.get('cv');
            const questionnaireId = formData.get('questionnaireId');

            if (!cvFile) {
                return errorResponse('Pas de CV fourni');
            }

            if (!questionnaireId) {
                return errorResponse('ID questionnaire manquant');
            }

            let storedData = null;

            // Essayer KV
            if (env.IKIGAI_KV) {
                try {
                    const stored = await env.IKIGAI_KV.get(questionnaireId);
                    if (stored) {
                        storedData = JSON.parse(stored);
                    }
                } catch (e) {
                    console.warn('⚠️ Erreur lecture KV:', e.message);
                }
            }

            // Essayer Supabase
            if (!storedData && env.SUPABASE_URL) {
                try {
                    const data = await supabaseQuery(env, 'GET', 'questionnaires', {
                        query: `?id=eq.${questionnaireId}`
                    });
                    if (data[0]) {
                        storedData = data[0];
                    }
                } catch (e) {
                    console.warn('⚠️ Erreur lecture Supabase:', e.message);
                }
            }

            if (!storedData) {
                return errorResponse('Questionnaire non trouvé ou expiré');
            }

            const cvText = await cvFile.text();

            if (cvText.length < 50) {
                return errorResponse('Le CV semble vide ou invalide');
            }

            const cvData = await analyzeCVWithClaude(cvText, env);
            const analysis = await generateRecommendationsWithClaude(storedData.answers, cvData, env);

            // Mettre à jour KV
            if (env.IKIGAI_KV) {
                try {
                    await env.IKIGAI_KV.put(questionnaireId, JSON.stringify({
                        ...storedData,
                        cvData,
                        analysis,
                        cvUploadedAt: Date.now()
                    }), { expirationTtl: 86400 });
                } catch (e) {
                    console.warn('⚠️ Erreur mise à jour KV:', e.message);
                }
            }

            // Mettre à jour Supabase
            if (env.SUPABASE_URL) {
                try {
                    await supabaseQuery(env, 'PATCH', 'questionnaires', {
                        query: `?id=eq.${questionnaireId}`,
                        body: { cv_data: cvData, analysis }
                    });
                } catch (e) {
                    console.warn('⚠️ Erreur mise à jour Supabase:', e.message);
                }
            }

            return jsonResponse({
                success: true,
                questionnaireId,
                cvData,
                analysis
            });
        }

        // Récupérer un questionnaire
        if (path.startsWith('/api/questionnaire/') && method === 'GET') {
            const id = path.split('/').pop();

            // Essayer KV
            if (env.IKIGAI_KV) {
                try {
                    const stored = await env.IKIGAI_KV.get(id);
                    if (stored) {
                        const data = JSON.parse(stored);
                        return jsonResponse({ success: true, ...data });
                    }
                } catch (e) {
                    console.warn('⚠️ Erreur lecture KV:', e.message);
                }
            }

            // Essayer Supabase
            if (env.SUPABASE_URL) {
                try {
                    const data = await supabaseQuery(env, 'GET', 'questionnaires', {
                        query: `?id=eq.${id}`
                    });

                    if (data[0]) {
                        return jsonResponse({ success: true, ...data[0] });
                    }
                } catch (e) {
                    return errorResponse('Questionnaire non trouvé', 404);
                }
            }

            return errorResponse('Stockage non configuré', 500);
        }

        return errorResponse('Route non trouvée: ' + path, 404);

    } catch (error) {
        console.error('💥 ERREUR:', error);
        return errorResponse('Erreur serveur: ' + error.message, 500);
    }
}

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    },
};
