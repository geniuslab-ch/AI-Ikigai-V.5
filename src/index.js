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

async function generateRecommendationsWithClaude(answers, cvData, env, userPlan = 'decouverte') {
    if (!env.ANTHROPIC_API_KEY && !env.CLAUDE_API_KEY) {
        console.warn('⚠️ Pas de clé API Claude, utilisation génération simple');
        return generateSimpleRecommendations(answers, cvData);
    }

    // Déterminer le nombre de recommandations selon le plan
    const recommendationCounts = {
        'decouverte': { career: 3, business: 0 },
        'essentiel': { career: 10, business: 5 },
        'premium': { career: 10, business: 5 }
    };

    const counts = recommendationCounts[userPlan] || recommendationCounts['decouverte'];
    console.log(`📊 Plan: ${userPlan} - Génération de ${counts.career} recommandations${counts.business > 0 ? ` + ${counts.business} idées business` : ''}`);

    try {
        console.log('🤖 Appel Claude API pour recommandations...');

        const apiKey = env.ANTHROPIC_API_KEY || env.CLAUDE_API_KEY;

        // Mapper le plan au pack level
        const packLevelMap = {
            'decouverte': 'CLARITY',
            // Upgrade coach plans to TRANSFORMATION (Full Access)
            'decouverte_coach': 'TRANSFORMATION',
            'essentiel': 'DIRECTION',
            'essentiel_coach': 'TRANSFORMATION',
            'premium': 'TRANSFORMATION',
            'premium_coach': 'TRANSFORMATION',
            'elite_coach': 'TRANSFORMATION'
        };
        const packLevel = packLevelMap[userPlan] || 'CLARITY';
        console.log(`📦 Pack Level: ${packLevel}`);

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 4000,
                messages: [{
                    role: 'user',
                    content: `You are Claude, an AI expert in career guidance, CV analysis, and Ikigai methodology.

CORE PRINCIPLES:
- Do NOT invent information not in inputs
- Explain reasoning briefly and clearly
- Prioritize realism and feasibility
- Be specific and actionable
- Concise responses

TONE: Professional, supportive, grounded. Not mystical or vague.

PACK_LEVEL = ${packLevel}

USER DATA:
A) Ikigai questionnaire:
${JSON.stringify(answers, null, 2)}

B) CV:
- Compétences: ${cvData.skills.join(', ') || 'Non spécifié'}
- Expériences: ${cvData.experiences.join(', ') || 'Non spécifié'}
- Formation: ${cvData.education.join(', ') || 'Non spécifié'}
- Industries: ${cvData.industries.join(', ') || 'Non spécifié'}
- Années: ${cvData.yearsExperience || 0}

C) Context: France/Europe, 6-12 months, medium career change tolerance

ANALYSIS STEPS (MANDATORY):
1. Ikigai: motivations, work environments, constraints, energy drivers
2. CV: skills, transferable skills, seniority, sectors
3. Market: growing job families, accessibility
4. Triangulation: explain how Ikigai + CV + market combined

OUTPUT (JSON ONLY, ALL IN FRENCH):

${packLevel === 'CLARITY' ? `Generate JSON:
{
  "profileSummary": "6 lignes max",
  "ikigaiSummary": "Résumé carte Ikigai",
  "passions": ["passion1", "passion2", "passion3"],
  "talents": ["talent1", "talent2", "talent3"],
  "mission": ["mission1", "mission2"],
  "vocation": ["vocation1", "vocation2"],
  "score": {"passion": 85, "mission": 90, "vocation": 80, "profession": 75},
  "careerRecommendations": [
    {
      "title": "Poste 1",
      "description": "Pourquoi correspond (2-3 lignes)",
      "matchScore": 85,
      "realism": "🟢",
      "realismLabel": "Accessible rapidement",
      "keyRisk": "Limitation"
    },
    {
      "title": "Poste 2",
      "description": "Pourquoi correspond (2-3 lignes)",
      "matchScore": 75,
      "realism": "🟠",
      "realismLabel": "Montée en compétences",
      "keyRisk": "Limitation"
    },
    {
      "title": "Poste 3",
      "description": "Pourquoi correspond (2-3 lignes)",
      "matchScore": 70,
      "realism": "🔴",
      "realismLabel": "Ambitieux/long terme",
      "keyRisk": "Limitation"
    }
  ]
}
RULES: Exactly 3 recommendations. realism 🟢/🟠/🔴. NO business ideas in CLARITY.` : packLevel === 'DIRECTION' ? `
CRITICAL REQUIREMENT FOR TRAJECTORIES:
- Each trajectory MUST be a complete object (NOT a string)
- ALL fields are MANDATORY: rank, label, title, description, jobTitles (array with 2-3 items), whyIkigai, whyCV, whyMarket, existingSkills (array), skillsToDevelop (array with 5 items), actionPlan30Days (array with 3 items)
- description must be 2-3 sentences minimum
- NO empty strings or empty arrays for these fields

Generate JSON:
{
  "profileSummary": "6 lignes max",
  "ikigaiSummary": "Résumé",
  "passions": [...],
  "talents": [...],
  "mission": [...],
  "vocation": [...],
  "score": {"passion": 85, "mission": 90, "vocation": 80, "profession": 75},
  "trajectories": [
    {
      "rank": 1,
      "label": "Trajectoire principale",
      "title": "Nom parcours",
      "description": "2-3 lignes",
      "jobTitles": ["Poste 1", "Poste 2", "Poste 3"],
      "whyIkigai": "Bref",
      "whyCV": "Bref",
      "whyMarket": "Bref",
      "existingSkills": ["skill1", "skill2"],
      "skillsToDevelop": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "actionPlan30Days": ["Action 1", "Action 2", "Action 3"]
    },
    {
      "rank": 2,
      "label": "Alternative crédible",
      "title": "Alternative",
      "description": "2-3 lignes",
      "jobTitles": ["Poste A", "Poste B"],
      "whyIkigai": "Bref",
      "whyCV": "Bref",
      "whyMarket": "Bref",
      "existingSkills": ["skill1"],
      "skillsToDevelop": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "actionPlan30Days": ["Action 1", "Action 2", "Action 3"]
    },
    {
      "rank": 3,
      "label": "Ambitieux (12-24 mois)",
      "title": "Ambitieux",
      "description": "2-3 lignes",
      "jobTitles": ["Poste X", "Poste Y"],
      "whyIkigai": "Bref",
      "whyCV": "Bref",
      "whyMarket": "Bref",
      "existingSkills": ["skill1"],
      "skillsToDevelop": ["skill1", "skill2", "skill3", "skill4", "skill5"],
      "actionPlan30Days": ["Action 1", "Action 2", "Action 3"]
    }
  ],
  "businessIdeas": [
    {"title": "Idée 1", "description": "2-3 lignes", "problem": "Problème", "target": "Cible", "whyFits": "Correspond", "viabilityScore": 75},
    {"title": "Idée 2", "description": "2-3 lignes", "problem": "Problème", "target": "Cible", "whyFits": "Correspond", "viabilityScore": 70},
    {"title": "Idée 3", "description": "2-3 lignes", "problem": "Problème", "target": "Cible", "whyFits": "Correspond", "viabilityScore": 68},
    {"title": "Idée 4", "description": "2-3 lignes", "problem": "Problème", "target": "Cible", "whyFits": "Correspond", "viabilityScore": 65},
    {"title": "Idée 5", "description": "2-3 lignes", "problem": "Problème", "target": "Cible", "whyFits": "Correspond", "viabilityScore": 63}
  ],
  "careerRecommendations": []
}
RULES: 3 trajectories, 5 business ideas, careerRecommendations EMPTY.` : `Generate JSON:
{
  "profileSummary": "6 lignes",
  "ikigaiSummary": "Résumé",
  "passions": [...],
  "talents": [...],
  "mission": [...],
  "vocation": [...],
  "score": {...},
  "trajectories": [same as DIRECTION],
  "businessIdeas": [same as DIRECTION],
  "coherenceDiagnosis": {
    "strengths": ["Force 1", "Force 2"],
    "misalignments": ["Écart 1", "Écart 2"],
    "keyRisks": ["Risque 1", "Risque 2"]
  },
  "finalTrajectory": {
    "choice": "Trajectoire 1/2/3",
    "justification": "3-4 lignes"
  },
  "positioning": {
    "statement": "1 phrase",
    "linkedinHeadline": "Max 120 chars",
    "pitch": "30 sec (3-4 phrases)"
  },
  "coachingPrep": {
    "keyQuestions": ["Q1", "Q2", "Q3", "Q4", "Q5"],
    "topicsToClarify": ["Topic 1", "Topic 2", "Topic 3"]
  },
  "careerRecommendations": []
}
RULES: Include ALL from DIRECTION + diagnosis + final trajectory + positioning + coaching prep.`}

CRITICAL: Return ONLY valid JSON. No text before/after. ALL in FRENCH.`
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

            // POST-PROCESSING: Convertir trajectories strings en objets si nécessaire
            if (analysis.trajectories && Array.isArray(analysis.trajectories)) {
                analysis.trajectories = analysis.trajectories.map((traj, index) => {
                    if (typeof traj === 'object' && traj !== null && traj.title) {
                        return traj;
                    }
                    if (typeof traj === 'string') {
                        const labels = ['Trajectoire Réaliste (6 mois)', 'Trajectoire Équilibrée (6-12 mois)', 'Trajectoire Ambitieuse (12-24 mois)'];
                        return {
                            rank: index + 1,
                            title: traj,
                            label: labels[index] || `Trajectoire ${index + 1}`,
                            description: '',
                            jobTitles: [],
                            whyIkigai: '',
                            whyCV: '',
                            whyMarket: '',
                            existingSkills: [],
                            skillsToDevelop: [],
                            actionPlan30Days: []
                        };
                    }
                    return traj;
                });
            }

            console.log('✅ Recommandations générées par Claude');

            // Calcul des scores si absents
            if (!analysis.score || typeof analysis.score !== 'object' || Object.keys(analysis.score).length === 0) {
                console.log('📊 Calcul scores depuis questionnaire...');
                const scores = { passion: 0, profession: 0, mission: 0, vocation: 0 };
                const allAnswers = [];
                for (const k in answers) {
                    const v = answers[k];
                    if (Array.isArray(v)) allAnswers.push(...v);
                    else if (v) allAnswers.push(String(v));
                }
                const m = { 'create': { c: 'passion', s: 25 }, 'analyze': { c: 'profession', s: 20 }, 'teach': { c: 'mission', s: 30 }, 'connect': { c: 'passion', s: 20 }, 'build': { c: 'profession', s: 25 }, 'explore': { c: 'passion', s: 20 }, 'tech': { c: 'profession', s: 20 }, 'art': { c: 'passion', s: 25 }, 'business': { c: 'vocation', s: 20 }, 'science': { c: 'profession', s: 20 }, 'social': { c: 'mission', s: 30 }, 'health': { c: 'mission', s: 25 }, 'challenge': { c: 'passion', s: 20 }, 'impact': { c: 'mission', s: 30 }, 'learn': { c: 'passion', s: 20 }, 'team': { c: 'profession', s: 15 }, 'freedom': { c: 'passion', s: 25 }, 'dev-perso': { c: 'passion', s: 15 }, 'creative': { c: 'passion', s: 25 }, 'culture': { c: 'passion', s: 15 }, 'advice': { c: 'profession', s: 20 }, 'organize': { c: 'profession', s: 20 }, 'mediate': { c: 'profession', s: 20 }, 'motivate': { c: 'mission', s: 25 }, 'communication': { c: 'profession', s: 20 }, 'analysis': { c: 'profession', s: 25 }, 'creativity': { c: 'passion', s: 25 }, 'leadership': { c: 'profession', s: 25 }, 'empathy': { c: 'mission', s: 25 }, 'execution': { c: 'profession', s: 20 }, 'practice': { c: 'profession', s: 20 }, 'read': { c: 'profession', s: 15 }, 'watch': { c: 'profession', s: 15 }, 'discuss': { c: 'profession', s: 15 }, 'leader': { c: 'profession', s: 25 }, 'analyst': { c: 'profession', s: 20 }, 'harmonizer': { c: 'mission', s: 25 }, 'executor': { c: 'profession', s: 20 }, 'challenger': { c: 'passion', s: 20 }, 'growth': { c: 'passion', s: 20 }, 'respect': { c: 'mission', s: 20 }, 'balance': { c: 'vocation', s: 15 }, 'startup': { c: 'vocation', s: 25 }, 'corporate': { c: 'vocation', s: 15 }, 'remote': { c: 'vocation', s: 15 }, 'freelance': { c: 'vocation', s: 25 }, 'wealth': { c: 'vocation', s: 25 }, 'recognition': { c: 'vocation', s: 20 }, 'mastery': { c: 'profession', s: 25 }, 'education': { c: 'mission', s: 30 }, 'environment': { c: 'mission', s: 30 }, 'equality': { c: 'mission', s: 30 }, 'innovation': { c: 'vocation', s: 25 }, 'community': { c: 'mission', s: 25 }, 'sustainability': { c: 'mission', s: 25 }, 'finance': { c: 'vocation', s: 20 } };
                allAnswers.forEach(a => { const l = String(a).toLowerCase().trim(); if (m[l]) scores[m[l].c] = Math.min(100, (scores[m[l].c] || 0) + m[l].s); });
                for (const k in scores) if (scores[k] === 0) scores[k] = 60;
                analysis.score = scores;
            }

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
    console.log('📊 Génération simple des recommandations (sans IA - Mode Fallback)');

    const analysis = {
        passions: [],
        talents: [],
        mission: [],
        vocation: [],
        careerRecommendations: [], // Updated key name
        businessIdeas: [], // V2 field
        trajectories: [], // V2 field
        coherenceDiagnosis: {
            strengths: ["Cohérence passions/compétences", "Motivation intrinsèque forte"],
            misalignments: ["Nécessité de clarifier le modèle économique"],
            keyRisks: ["Marché concurrentiel", "Besoin de montée en compétences techniques"]
        },
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

    // Helper to create detailed recommendation
    const createRec = (title, desc, score, realism, risk) => ({
        title,
        description: desc,
        matchScore: score,
        realism: realism, // 🟢, 🟠, 🔴
        realismLabel: realism === '🟢' ? 'Accessible' : (realism === '🟠' ? 'Challenge' : 'Ambitieux'),
        keyRisk: risk
    });

    if (dominant === 'passion' && analysis.passions[0]) {
        analysis.careerRecommendations.push(createRec(
            `Créateur ${analysis.passions[0]}`,
            `Exploitez votre passion pour ${analysis.passions[0].toLowerCase()} en créant des projets innovants qui vous inspirent.`,
            92, '🟢', 'Risque d\'épuisement professionnel'
        ));
    } else if (dominant === 'mission' && analysis.mission[0]) {
        analysis.careerRecommendations.push(createRec(
            `Responsable ${analysis.mission[0]}`,
            `Dirigez des initiatives dans ${analysis.mission[0].toLowerCase()} pour créer un impact durable.`,
            90, '🟢', 'Complexité organisationnelle'
        ));
    } else if (dominant === 'profession' && analysis.talents[0]) {
        analysis.careerRecommendations.push(createRec(
            `Expert ${analysis.talents[0]}`,
            `Devenez une référence en ${analysis.talents[0].toLowerCase()} grâce à votre expertise unique.`,
            88, '🟢', 'Niche de marché restreinte'
        ));
    } else {
        analysis.careerRecommendations.push(createRec(
            `Consultant Stratégique`,
            `Conseillez des organisations en combinant vos compétences et votre vision.`,
            85, '🟠', 'Cycle de vente long'
        ));
    }

    if (cvData.skills && cvData.skills.length > 0) {
        const mainSkill = cvData.skills[0];
        const expText = cvData.yearsExperience > 0 ? ` avec ${cvData.yearsExperience} ans d'expérience` : '';
        analysis.careerRecommendations.push(createRec(
            `Lead ${mainSkill}`,
            `Dirigez des équipes et projets en ${mainSkill.toLowerCase()}${expText} pour maximiser votre impact.`,
            87, '🟢', 'Responsabilité managériale élevée'
        ));
    }

    if (analysis.passions[0] && analysis.mission[0]) {
        analysis.careerRecommendations.push(createRec(
            `Entrepreneur ${analysis.passions[0]} & ${analysis.mission[0]}`,
            `Créez votre entreprise alliant ${analysis.passions[0].toLowerCase()} et ${analysis.mission[0].toLowerCase()}.`,
            84, '🔴', 'Incertitude financière initiale'
        ));
    }

    while (analysis.careerRecommendations.length < 3) {
        analysis.careerRecommendations.push(createRec(
            'Consultant Indépendant',
            'Développez votre activité de conseil en exploitant votre expertise unique.',
            75, '🟢', 'Isolement professionnel'
        ));
    }

    // Generate Mock Business Ideas
    analysis.businessIdeas = [
        {
            title: `Agence ${analysis.talents[0] || 'Conseil'}`,
            description: "Structure de conseil spécialisée.",
            viabilityScore: 85,
            problem: "Manque d'expertise pointue",
            target: "PME et Startups",
            whyFits: "Utilise vos compétences clés"
        },
        {
            title: `Formation ${analysis.passions[0] || 'En ligne'}`,
            description: "Programme de formation digital.",
            viabilityScore: 80,
            problem: "Besoin de montée en compétences",
            target: "Professionnels en reconversion",
            whyFits: "Transmet votre passion"
        },
        {
            title: "Plateforme de Mise en Relation",
            description: "Connecter experts et clients.",
            viabilityScore: 75,
            problem: "Difficulté à trouver les bons profils",
            target: "Marché B2B",
            whyFits: "Répond à un besoin marché"
        }
    ];

    // Generate Mock Trajectories
    analysis.trajectories = [
        {
            rank: 1,
            label: "Trajectoire Réaliste (6 mois)",
            title: `Expert ${analysis.talents[0] || 'Junior'}`,
            description: "Capitalisez sur vos acquis pour une transition douce.",
            jobTitles: ["Consultant", "Chef de projet"],
            actionPlan30Days: ["Mettre à jour LinkedIn", "Contacter 5 recruteurs", "Suivre une formation courte"]
        },
        {
            rank: 2,
            label: "Trajectoire Équilibrée (6-12 mois)",
            title: `Manager ${analysis.passions[0] || 'd\'équipe'}`,
            description: "Prenez des responsabilités tout en explorant vos passions.",
            jobTitles: ["Manager", "Product Owner"],
            actionPlan30Days: ["Définir son offre", "Netwroking actif", "Bilan de compétences"]
        },
        {
            rank: 3,
            label: "Trajectoire Ambitieuse (12-24 mois)",
            title: "Fondateur / CEO",
            description: "Lancez votre propre structure alignée avec votre mission.",
            jobTitles: ["Entrepreneur", "CEO"],
            actionPlan30Days: ["Étude de marché", "Business Plan", "Recherche d'associés"]
        }
    ];

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

        // POST /api/send-invitation
        if (path === '/api/send-invitation' && method === 'POST') {
            try {
                const { to, clientName, coachName, personalMessage, inviteLink, coachId, invitationToken } = await request.json();

                // Validation simple
                if (!to || !clientName || !inviteLink) {
                    return errorResponse('Champs manquants (to, clientName, inviteLink)', 400);
                }

                const emailHTML = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: 'Segoe UI', sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 2.5rem; font-weight: bold; background: linear-gradient(90deg, #00d4ff, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 10px; }
        .content { line-height: 1.8; color: #334155; }
        .personal-message { background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); padding: 20px; border-radius: 12px; border-left: 4px solid #8b5cf6; font-style: italic; margin: 25px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #00d4ff, #8b5cf6); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; margin: 30px 0; font-weight: 600; font-size: 1.1rem; }
        .footer { text-align: center; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">AI-Ikigai</div>
            <div>Découvrez votre raison d'être</div>
        </div>
        <div class="content">
            <h2>Bonjour ${clientName} 👋</h2>
            <p><strong>${coachName || 'Votre Coach'}</strong> vous invite à découvrir votre Ikigai avec AI-Ikigai !</p>
            ${personalMessage ? `<div class="personal-message">"${personalMessage}"</div>` : ''}
            <div style="text-align: center;">
                <a href="${inviteLink}" class="cta-button">✨ Créer mon compte gratuitement</a>
            </div>
            <p style="text-align: center; color: #94a3b8;">Ce lien est valide pendant 7 jours</p>
        </div>
        <div class="footer">
            <p>© 2026 AI-Ikigai</p>
        </div>
    </div>
</body>
</html>`;

                // Envoi via MailChannels
                const mailResponse = await fetch('https://api.mailchannels.net/tx/v1/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        personalizations: [{
                            to: [{ email: to, name: clientName }]
                        }],
                        from: {
                            email: 'coach@ai-ikigai.com',
                            name: 'AI-Ikigai Coach'
                        },
                        subject: `${coachName || 'Votre Coach'} vous invite à découvrir votre Ikigai ✨`,
                        content: [{
                            type: 'text/html',
                            value: emailHTML
                        }]
                    })
                });

                if (!mailResponse.ok) {
                    const errText = await mailResponse.text();
                    console.error('MailChannels Error:', errText);
                    return errorResponse('Erreur envoi email: ' + errText, 500);
                }

                return jsonResponse({ success: true, message: 'Email envoyé' });

            } catch (e) {
                return errorResponse('Erreur serveur: ' + e.message, 500);
            }
        }

        // ============ ENDPOINTS EXISTANTS ============

        // Submit questionnaire
        if (path === '/api/questionnaire/submit' && method === 'POST') {
            console.log('📝 POST /api/questionnaire/submit');

            const body = await request.json();
            const { answers, email, user_id, user_plan } = body;

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

            // Utiliser user_plan du body en priorité, sinon récupérer depuis Supabase
            let userPlan = user_plan || 'decouverte';
            console.log('📋 User plan from body:', userPlan);

            // Si pas de plan dans body, récupérer depuis Supabase si user_id ou email dispo
            if (env.SUPABASE_URL) {
                try {
                    let uid = user_id;
                    // Trouver l'ID si on a que l'email
                    if (!uid && email) {
                        const profiles = await supabaseQuery(env, 'GET', 'profiles', {
                            query: `?email=eq.${email.toLowerCase()}&select=id`
                        });
                        uid = profiles[0]?.id;
                    }

                    if (uid) {
                        // 1. Vérifier si l'utilisateur a un coach (Upgrade prioritaire)
                        try {
                            const coachRel = await supabaseQuery(env, 'GET', 'coach_clients', {
                                query: `?client_id=eq.${uid}&select=id`
                            });

                            if (coachRel && coachRel.length > 0) {
                                console.log('👨‍🏫 Coach détecté côté backend - Upgrade vers TRANSFORMATION');
                                userPlan = 'decouverte_coach'; // Force upgrade
                            } else if (!user_plan) {
                                // 2. Sinon récupérer le plan du profil (si pas fourni dans body)
                                const profiles = await supabaseQuery(env, 'GET', 'profiles', {
                                    query: `?id=eq.${uid}&select=plan`
                                });
                                if (profiles[0]) {
                                    userPlan = profiles[0].plan || 'decouverte';
                                    console.log(`✅ Plan récupéré depuis Supabase: ${userPlan}`);
                                }
                            }
                        } catch (err) {
                            console.warn('⚠️ Erreur vérification coach/plan:', err.message);
                        }
                    }
                } catch (e) {
                    console.warn('⚠️ Erreur récupération infos utilisateur:', e.message);
                }
            }

            const analysis = await generateRecommendationsWithClaude(answers, emptyCvData, env, userPlan);

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

                    // 1. Sauvegarder dans 'analyses' (nouvelle table)
                    try {
                        const analysisData = {
                            user_id: userId,
                            answers: answers || {},
                            passions: analysis.passions || [],
                            talents: analysis.talents || [],
                            mission: analysis.mission || [],
                            vocation: analysis.vocation || [],
                            score: analysis.score || {},
                            // Ensure backward compatibility columns are also populated if needed
                            passion_score: analysis.score?.passion || 0,
                            profession_score: analysis.score?.profession || 0,
                            mission_score: analysis.score?.mission || 0,
                            vocation_score: analysis.score?.vocation || 0,
                            profile_summary: analysis.profileSummary || null,
                            ikigai_summary: analysis.ikigaiSummary || null,
                            career_recommendations: analysis.careerRecommendations || [],
                            business_ideas: analysis.businessIdeas || [],
                            trajectories: analysis.trajectories || null,
                            coherence_diagnosis: analysis.coherenceDiagnosis || null,
                            final_trajectory: analysis.finalTrajectory || null,
                            positioning: analysis.positioning || null,
                            coaching_prep: analysis.coachingPrep || null,
                            status: 'completed',
                            created_at: new Date().toISOString()
                        };

                        await supabaseQuery(env, 'POST', 'analyses', {
                            body: analysisData
                        });
                        console.log('✅ Analyse sauvegardée dans la table analyses');
                    } catch (e) {
                        console.error('❌ Erreur stockage table analyses:', e.message);
                    }

                    // 2. Sauvegarder dans 'questionnaires' (backup / legacy)
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
