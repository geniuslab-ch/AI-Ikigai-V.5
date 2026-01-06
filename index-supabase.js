/**
 * AI-IKIGAI Backend - VERSION AVEC SUPABASE
 * Combine CV + Questionnaire avec Claude AI + Supabase Auth
 */

import { createClient } from '@supabase/supabase-js';

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
// SUPABASE CLIENT
// ============================================

function getSupabaseClient(env) {
	if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
		throw new Error('Supabase not configured');
	}
	return createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
}

// ============================================
// EXTRACTION CV - Parse le texte du PDF/DOCX
// ============================================

function extractCVText(file) {
	return file.text || file.content || '';
}

// ============================================
// ANALYSE CV avec Claude AI
// ============================================

async function analyzeCVWithClaude(cvText, env) {
	if (!env.ANTHROPIC_API_KEY) {
		console.warn('⚠️ Pas de clé API Claude, utilisation analyse simple');
		return analyzeSimpleCV(cvText);
	}

	try {
		console.log('🤖 Appel Claude API pour analyse CV...');

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': env.ANTHROPIC_API_KEY,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: 'claude-3-haiku-20240307',
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

// ============================================
// ANALYSE SIMPLE CV (sans Claude)
// ============================================

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
	if (!env.ANTHROPIC_API_KEY) {
		console.warn('⚠️ Pas de clé API Claude, utilisation génération simple');
		return generateSimpleRecommendations(answers, cvData, userPlan);
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

		// Construire les exemples de recommandations dans le prompt
		const careerRecsExample = Array.from({ length: counts.career }, (_, i) => `    {
      "title": "Poste recommandé ${i + 1}",
      "description": "Description personnalisée basée sur le profil réel",
      "matchScore": ${95 - i * 3}
    }`).join(',\n');

		const businessIdeasExample = counts.business > 0 ? `,
  "businessIdeas": [
${Array.from({ length: counts.business }, (_, i) => `    {
      "title": "Idée business ${i + 1}",
      "description": "Concept entrepreneurial aligné avec les forces et le marché",
      "viabilityScore": ${90 - i * 4}
    }`).join(',\n')}
  ]` : '';

		const response = await fetch('https://api.anthropic.com/v1/messages', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'x-api-key': env.ANTHROPIC_API_KEY,
				'anthropic-version': '2023-06-01'
			},
			body: JSON.stringify({
				model: 'claude-3-5-sonnet-20240620',
				max_tokens: 4000,
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
  "careerRecommendations": [
${careerRecsExample}
  ]${businessIdeasExample},
  "score": {
    "passion": 85,
    "profession": 75,
    "mission": 90,
    "vocation": 80
  }
}

IMPORTANT: 
- Génère EXACTEMENT ${counts.career} recommandations de carrière${counts.business > 0 ? ` ET ${counts.business} idées business` : ''}.
- Base-toi sur les VRAIES réponses et le VRAI CV pour personnaliser.
- Sois spécifique et pertinent.
- Retourne UNIQUEMENT le JSON valide.`
				}]
			})
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('❌ Erreur Claude API:', data);
			return generateSimpleRecommendations(answers, cvData, userPlan);
		}

		const content = data.content[0].text;
		const jsonMatch = content.match(/\{[\s\S]*\}/);

		if (jsonMatch) {
			const analysis = JSON.parse(jsonMatch[0]);
			console.log('✅ Recommandations générées par Claude');
			return analysis;
		}

		console.warn('⚠️ Pas de JSON trouvé dans la réponse Claude');
		return generateSimpleRecommendations(answers, cvData, userPlan);

	} catch (error) {
		console.error('❌ Erreur génération Claude:', error.message);
		return generateSimpleRecommendations(answers, cvData, userPlan);
	}
}

// ============================================
// GÉNÉRATION SIMPLE (sans Claude)
// ============================================

function generateSimpleRecommendations(answers, cvData, userPlan = 'decouverte') {
	console.log(`📊 Génération simple des recommandations (sans IA) - Plan: ${userPlan}`);

	// Déterminer le nombre de recommandations selon le plan
	const recommendationCounts = {
		'decouverte': { career: 3, business: 0 },
		'essentiel': { career: 10, business: 5 },
		'premium': { career: 10, business: 5 }
	};

	const counts = recommendationCounts[userPlan] || recommendationCounts['decouverte'];

	const analysis = {
		passions: [],
		talents: [],
		mission: [],
		vocation: [],
		careerRecommendations: [],
		businessIdeas: [],
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

	// Générer les recommandations de carrière
	if (dominant === 'passion' && analysis.passions[0]) {
		analysis.careerRecommendations.push({
			title: `Créateur ${analysis.passions[0]}`,
			description: `Exploitez votre passion pour ${analysis.passions[0].toLowerCase()} en créant des projets innovants qui vous inspirent.`,
			matchScore: 92
		});
	} else if (dominant === 'mission' && analysis.mission[0]) {
		analysis.careerRecommendations.push({
			title: `Responsable ${analysis.mission[0]}`,
			description: `Dirigez des initiatives dans ${analysis.mission[0].toLowerCase()} pour créer un impact durable.`,
			matchScore: 90
		});
	} else if (dominant === 'profession' && analysis.talents[0]) {
		analysis.careerRecommendations.push({
			title: `Expert ${analysis.talents[0]}`,
			description: `Devenez une référence en ${analysis.talents[0].toLowerCase()} grâce à votre expertise unique.`,
			matchScore: 88
		});
	} else {
		analysis.careerRecommendations.push({
			title: `Consultant Stratégique`,
			description: `Conseillez des organisations en combinant vos compétences et votre vision.`,
			matchScore: 85
		});
	}

	if (cvData.skills && cvData.skills.length > 0) {
		const mainSkill = cvData.skills[0];
		const expText = cvData.yearsExperience > 0 ? ` avec ${cvData.yearsExperience} ans d'expérience` : '';
		analysis.careerRecommendations.push({
			title: `Lead ${mainSkill}`,
			description: `Dirigez des équipes et projets en ${mainSkill.toLowerCase()}${expText} pour maximiser votre impact.`,
			matchScore: 87
		});
	}

	if (analysis.passions[0] && analysis.mission[0]) {
		analysis.careerRecommendations.push({
			title: `Manager ${analysis.passions[0]} & ${analysis.mission[0]}`,
			description: `Combinez ${analysis.passions[0].toLowerCase()} et ${analysis.mission[0].toLowerCase()} dans un rôle de management.`,
			matchScore: 84
		});
	}

	// Compléter jusqu'au nombre requis
	while (analysis.careerRecommendations.length < counts.career) {
		analysis.careerRecommendations.push({
			title: `Consultant ${analysis.vocation[0] || 'Indépendant'}`,
			description: 'Développez votre activité de conseil en exploitant votre expertise unique.',
			matchScore: 75 - analysis.careerRecommendations.length
		});
	}

	// Limiter au nombre exact requis
	analysis.careerRecommendations = analysis.careerRecommendations.slice(0, counts.career);

	// Générer les idées business si applicable
	if (counts.business > 0) {
		if (analysis.passions[0] && analysis.mission[0]) {
			analysis.businessIdeas.push({
				title: `Startup ${analysis.passions[0]} & ${analysis.mission[0]}`,
				description: `Créez une entreprise alliant ${analysis.passions[0].toLowerCase()} et ${analysis.mission[0].toLowerCase()}.`,
				viabilityScore: 88
			});
		}

		if (cvData.skills && cvData.skills[0]) {
			analysis.businessIdeas.push({
				title: `Agence de services ${cvData.skills[0]}`,
				description: `Lancez une agence spécialisée en ${cvData.skills[0].toLowerCase()} pour accompagner les entreprises.`,
				viabilityScore: 85
			});
		}

		if (analysis.vocation[0]) {
			analysis.businessIdeas.push({
				title: `Plateforme ${analysis.vocation[0]}`,
				description: `Développez une plateforme digitale dans le secteur ${analysis.vocation[0].toLowerCase()}.`,
				viabilityScore: 82
			});
		}

		// Compléter jusqu'au nombre requis
		while (analysis.businessIdeas.length < counts.business) {
			analysis.businessIdeas.push({
				title: `Consulting ${analysis.talents[0] || 'Expertise'}`,
				description: 'Proposez vos services de conseil aux PME et startups.',
				viabilityScore: 78 - analysis.businessIdeas.length * 2
			});
		}

		// Limiter au nombre exact requis
		analysis.businessIdeas = analysis.businessIdeas.slice(0, counts.business);
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
				version: '3.0.0-SUPABASE',
				features: ['cv-analysis', 'claude-ai', 'supabase-auth', 'dashboards'],
				hasClaudeKey: !!env.ANTHROPIC_API_KEY,
				hasSupabase: !!(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
				hasKV: !!env.IKIGAI_KV,
				timestamp: new Date().toISOString()
			});
		}

		// ============ NOUVEAUX ENDPOINTS DASHBOARD ============

		// GET /api/dashboard/client
		if (path === '/api/dashboard/client' && method === 'GET') {
			const authHeader = request.headers.get('Authorization');
			if (!authHeader) {
				return errorResponse('Non authentifié', 401);
			}

			const token = authHeader.replace('Bearer ', '');
			const supabase = getSupabaseClient(env);

			// Vérifier le token et récupérer l'utilisateur
			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			// Récupérer toutes les analyses de l'utilisateur
			const { data: questionnaires, error } = await supabase
				.from('questionnaires')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) {
				return errorResponse('Erreur récupération données: ' + error.message, 500);
			}

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
			const supabase = getSupabaseClient(env);

			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			// Vérifier que l'utilisateur est coach
			const { data: profile } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			if (profile?.role !== 'coach') {
				return errorResponse('Accès refusé - rôle coach requis', 403);
			}

			// Récupérer les clients du coach
			const { data: relations } = await supabase
				.from('coach_clients')
				.select(`
					client_id,
					added_at,
					profiles!coach_clients_client_id_fkey (id, email, name)
				`)
				.eq('coach_id', user.id);

			// Pour chaque client, compter ses analyses
			const clientsWithStats = await Promise.all(
				(relations || []).map(async (rel) => {
					const { count } = await supabase
						.from('questionnaires')
						.select('*', { count: 'exact', head: true })
						.eq('user_id', rel.client_id);

					return {
						...rel.profiles,
						added_at: rel.added_at,
						analyses_count: count || 0
					};
				})
			);

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
			const supabase = getSupabaseClient(env);

			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			const { clientEmail } = await request.json();

			// Trouver le client par email
			const { data: clientProfile } = await supabase
				.from('profiles')
				.select('id')
				.eq('email', clientEmail.toLowerCase())
				.single();

			if (!clientProfile) {
				return errorResponse('Client non trouvé avec cet email');
			}

			// Créer la relation
			const { error: insertError } = await supabase
				.from('coach_clients')
				.insert({
					coach_id: user.id,
					client_id: clientProfile.id
				});

			if (insertError) {
				if (insertError.code === '23505') { // Duplicate
					return errorResponse('Ce client est déjà dans votre liste');
				}
				return errorResponse('Erreur ajout client: ' + insertError.message);
			}

			return jsonResponse({ success: true, message: 'Client ajouté avec succès' });
		}

		// GET /api/dashboard/coach/clients/:clientId
		if (path.match(/^\/api\/dashboard\/coach\/clients\/[^/]+$/) && method === 'GET') {
			const authHeader = request.headers.get('Authorization');
			if (!authHeader) {
				return errorResponse('Non authentifié', 401);
			}

			const token = authHeader.replace('Bearer ', '');
			const supabase = getSupabaseClient(env);

			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			const clientId = path.split('/').pop();

			// Vérifier que le coach a accès à ce client
			const { data: relation } = await supabase
				.from('coach_clients')
				.select('id')
				.eq('coach_id', user.id)
				.eq('client_id', clientId)
				.single();

			if (!relation) {
				return errorResponse('Accès refusé à ce client', 403);
			}

			// Récupérer les analyses du client
			const { data: questionnaires } = await supabase
				.from('questionnaires')
				.select('*')
				.eq('user_id', clientId)
				.order('created_at', { ascending: false });

			return jsonResponse({
				success: true,
				latestAnalysis: questionnaires[0]?.analysis || null,
				history: questionnaires
			});
		}

		// GET /api/dashboard/admin/stats
		if (path === '/api/dashboard/admin/stats' && method === 'GET') {
			const authHeader = request.headers.get('Authorization');
			if (!authHeader) {
				return errorResponse('Non authentifié', 401);
			}

			const token = authHeader.replace('Bearer ', '');
			const supabase = getSupabaseClient(env);

			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			// Vérifier que l'utilisateur est admin
			const { data: profile } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			if (!['admin', 'super_admin'].includes(profile?.role)) {
				return errorResponse('Accès refusé - rôle admin requis', 403);
			}

			// Récupérer les statistiques
			const { count: totalUsers } = await supabase
				.from('profiles')
				.select('*', { count: 'exact', head: true });

			const { count: totalAnalyses } = await supabase
				.from('questionnaires')
				.select('*', { count: 'exact', head: true });

			return jsonResponse({
				success: true,
				stats: {
					totalUsers: totalUsers || 0,
					totalAnalyses: totalAnalyses || 0,
					totalRevenue: 0 // À implémenter avec Stripe
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
			const supabase = getSupabaseClient(env);

			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			// Vérifier que l'utilisateur est admin
			const { data: profile } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			if (!['admin', 'super_admin'].includes(profile?.role)) {
				return errorResponse('Accès refusé - rôle admin requis', 403);
			}

			// Récupérer tous les utilisateurs
			const { data: users } = await supabase
				.from('profiles')
				.select('id, email, name, role, plan, created_at')
				.order('created_at', { ascending: false });

			return jsonResponse({
				success: true,
				users: users || []
			});
		}

		// PUT /api/dashboard/admin/users/:userId
		if (path.match(/^\/api\/dashboard\/admin\/users\/[^/]+$/) && method === 'PUT') {
			const authHeader = request.headers.get('Authorization');
			if (!authHeader) {
				return errorResponse('Non authentifié', 401);
			}

			const token = authHeader.replace('Bearer ', '');
			const supabase = getSupabaseClient(env);

			const { data: { user }, error: authError } = await supabase.auth.getUser(token);
			if (authError || !user) {
				return errorResponse('Token invalide', 401);
			}

			// Vérifier que l'utilisateur est super_admin
			const { data: profile } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();

			if (profile?.role !== 'super_admin') {
				return errorResponse('Accès refusé - rôle super_admin requis', 403);
			}

			const userId = path.split('/').pop();
			const updates = await request.json();

			// Mettre à jour l'utilisateur
			const { error: updateError } = await supabase
				.from('profiles')
				.update(updates)
				.eq('id', userId);

			if (updateError) {
				return errorResponse('Erreur mise à jour: ' + updateError.message);
			}

			return jsonResponse({ success: true, message: 'Utilisateur mis à jour' });
		}

		// ============ ENDPOINTS EXISTANTS (modifiés pour Supabase) ============

		// Submit questionnaire + Analyse immédiate (SANS CV)
		if (path === '/api/questionnaire/submit' && method === 'POST') {
			console.log('📝 POST /api/questionnaire/submit');

			const body = await request.json();
			const { answers, email } = body;

			if (!answers || Object.keys(answers).length === 0) {
				return errorResponse('Pas de réponses fournies');
			}

			const questionnaireId = 'ikigai-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

			console.log('📊 Analyse sans CV...');

			const emptyCvData = {
				skills: [],
				experiences: [],
				education: [],
				industries: [],
				yearsExperience: 0
			};

			// Récupérer le plan de l'utilisateur depuis Supabase si authentifié
			let userPlan = 'decouverte'; // par défaut
			const authHeader = request.headers.get('Authorization');
			console.log('🔍 Authorization header:', authHeader ? 'Présent' : 'Absent');

			if (authHeader && env.SUPABASE_URL) {
				try {
					const token = authHeader.replace('Bearer ', '');
					const supabase = getSupabaseClient(env);
					const { data: { user }, error: userError } = await supabase.auth.getUser(token);

					console.log('👤 User from token:', user ? user.email : 'null', 'Error:', userError?.message || 'none');

					if (user) {
						const { data: profile, error: profileError } = await supabase
							.from('profiles')
							.select('plan')
							.eq('id', user.id)
							.single();

						console.log('📊 Profile data:', profile, 'Error:', profileError?.message || 'none');
						userPlan = profile?.plan || 'decouverte';
						console.log(`✅ Plan récupéré: ${userPlan}`);
					}
				} catch (error) {
					console.warn('⚠️ Erreur récupération plan utilisateur:', error.message);
				}
			}

			const analysis = await generateRecommendationsWithClaude(answers, emptyCvData, env, userPlan);

			// Stocker dans KV (temporaire - 24h)
			if (env.IKIGAI_KV) {
				try {
					await env.IKIGAI_KV.put(questionnaireId, JSON.stringify({
						answers,
						email,
						analysis,
						cvData: null,
						timestamp: Date.now()
					}), { expirationTtl: 86400 });
					console.log('✅ Données stockées dans KV');
				} catch (e) {
					console.warn('⚠️ Erreur stockage KV:', e.message);
				}
			}

			// NOUVEAU: Stocker dans Supabase (permanent)
			if (env.SUPABASE_URL) {
				try {
					const supabase = getSupabaseClient(env);

					// Récupérer l'utilisateur par email si fourni
					let userId = null;
					if (email) {
						const { data: profile } = await supabase
							.from('profiles')
							.select('id')
							.eq('email', email.toLowerCase())
							.single();
						userId = profile?.id || null;
					}

					// Sauvegarder le questionnaire
					await supabase.from('questionnaires').insert({
						id: questionnaireId,
						user_id: userId,
						email: email || null,
						answers,
						cv_data: null,
						analysis
					});

					console.log('✅ Données stockées dans Supabase');
				} catch (e) {
					console.warn('⚠️ Erreur stockage Supabase:', e.message);
				}
			}

			console.log('✅ Questionnaire analysé:', questionnaireId);

			return jsonResponse({
				success: true,
				questionnaireId,
				analysis,
				message: 'Questionnaire analysé avec succès'
			});
		}

		// Upload CV + Ré-analyse complète
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

			// Récupérer les données stockées (KV ou Supabase)
			let storedData = null;

			// Essayer KV d'abord
			if (env.IKIGAI_KV) {
				try {
					const stored = await env.IKIGAI_KV.get(questionnaireId);
					if (stored) {
						storedData = JSON.parse(stored);
						console.log('✅ Données récupérées depuis KV');
					}
				} catch (e) {
					console.warn('⚠️ Erreur lecture KV:', e.message);
				}
			}

			// Sinon essayer Supabase
			if (!storedData && env.SUPABASE_URL) {
				try {
					const supabase = getSupabaseClient(env);
					const { data } = await supabase
						.from('questionnaires')
						.select('*')
						.eq('id', questionnaireId)
						.single();

					if (data) {
						storedData = data;
						console.log('✅ Données récupérées depuis Supabase');
					}
				} catch (e) {
					console.warn('⚠️ Erreur lecture Supabase:', e.message);
				}
			}

			if (!storedData) {
				return errorResponse('Questionnaire non trouvé ou expiré. Veuillez recommencer.');
			}

			// Extraire texte du CV
			const cvText = await cvFile.text();
			console.log('📄 CV reçu, taille:', cvText.length, 'caractères');

			if (cvText.length < 50) {
				return errorResponse('Le CV semble vide ou invalide');
			}

			// Analyser le CV
			const cvData = await analyzeCVWithClaude(cvText, env);

			// Ré-générer recommandations avec CV
			const analysis = await generateRecommendationsWithClaude(storedData.answers, cvData, env);

			// Mettre à jour dans KV
			if (env.IKIGAI_KV) {
				try {
					await env.IKIGAI_KV.put(questionnaireId, JSON.stringify({
						...storedData,
						cvData,
						analysis,
						cvUploadedAt: Date.now()
					}), { expirationTtl: 86400 });
					console.log('✅ Données mises à jour dans KV');
				} catch (e) {
					console.warn('⚠️ Erreur mise à jour KV:', e.message);
				}
			}

			// Mettre à jour dans Supabase
			if (env.SUPABASE_URL) {
				try {
					const supabase = getSupabaseClient(env);
					await supabase
						.from('questionnaires')
						.update({ cv_data: cvData, analysis })
						.eq('id', questionnaireId);
					console.log('✅ Données mises à jour dans Supabase');
				} catch (e) {
					console.warn('⚠️ Erreur mise à jour Supabase:', e.message);
				}
			}

			console.log('✅ Analyse complète avec CV terminée!');

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

			// Essayer KV d'abord
			if (env.IKIGAI_KV) {
				try {
					const stored = await env.IKIGAI_KV.get(id);
					if (stored) {
						const data = JSON.parse(stored);
						return jsonResponse({
							success: true,
							...data
						});
					}
				} catch (e) {
					console.warn('⚠️ Erreur lecture KV:', e.message);
				}
			}

			// Sinon essayer Supabase
			if (env.SUPABASE_URL) {
				try {
					const supabase = getSupabaseClient(env);
					const { data, error } = await supabase
						.from('questionnaires')
						.select('*')
						.eq('id', id)
						.single();

					if (error) throw error;

					return jsonResponse({
						success: true,
						...data
					});
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
