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
		console.warn('⚠️ Pas de clé API Claude, tentative avec OpenAI...');
		return generateRecommendationsWithOpenAI(answers, cvData, env, userPlan);
	}

	// Déterminer le nombre de recommandations selon le plan
	const recommendationCounts = {
		'decouverte': { career: 3, business: 0 },
		'decouverte_coach': { career: 3, business: 5 }, // Coach clients need business ideas
		'essentiel': { career: 10, business: 5 },
		'essentiel_coach': { career: 10, business: 5 },
		'premium': { career: 10, business: 5 },
		'premium_coach': { career: 10, business: 5 },
		'elite_coach': { career: 10, business: 10 },
		'transformation': { career: 10, business: 10 }
	};

	const counts = recommendationCounts[userPlan] || recommendationCounts['decouverte'];
	console.log(`📊 Plan: ${userPlan} - Génération de ${counts.career} recommandations${counts.business > 0 ? ` + ${counts.business} idées business` : ''}`);

	try {
		console.log('🤖 Appel Claude API pour recommandations...');

		// Mapper le plan au pack level
		const packLevelMap = {
			'decouverte': 'CLARITY',
			'decouverte_coach': 'TRANSFORMATION',
			'essentiel': 'DIRECTION',
			'essentiel_coach': 'TRANSFORMATION',
			'premium': 'TRANSFORMATION',
			'premium_coach': 'TRANSFORMATION',
			'elite_coach': 'TRANSFORMATION'
		};
		const packLevel = packLevelMap[userPlan] || 'CLARITY';
		console.log(`📦 Pack Level: ${packLevel}`);

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
      "description": "Concept entrepreneurial align é avec les forces et le marché",
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
      "realism": "🟢",
      "realismLabel": "Accessible",
      "keyRisk": "Point d'attention majeur",
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
  "trajectories": [
    {
      "rank": 1,
      "label": "Trajectoire principale",
      "title": "Nom parcours",
      "description": "2-3 lignes",
      "realism": "🟢",
      "realismLabel": "Accessible",
      "keyRisk": "Point d'attention majeur",
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
			console.log('🔄 Bascule vers le plan de secours OpenAI...');
			return generateRecommendationsWithOpenAI(answers, cvData, env, userPlan);
		}

		const content = data.content[0].text;
		const jsonMatch = content.match(/\{[\s\S]*\}/);

		if (jsonMatch) {
			const analysis = JSON.parse(jsonMatch[0]);
			analysis._debug = {
				method: 'claude',
				plan: userPlan,
				pack: packLevel,
				counts: counts
			};

			// POST-PROCESSING: Convertir trajectories strings en objets si nécessaire
			if (analysis.trajectories && Array.isArray(analysis.trajectories)) {
				analysis.trajectories = analysis.trajectories.map((traj, index) => {
					// Si déjà un objet, le garder tel quel
					if (typeof traj === 'object' && traj !== null && traj.title) {
						return traj;
					}
					// Si c'est un string, le convertir en objet
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
			console.log('🔍 DEBUG businessIdeas:', analysis.businessIdeas ? `${analysis.businessIdeas.length} idées` : 'ABSENT');
			console.log('🔍 DEBUG trajectories:', analysis.trajectories ? `${analysis.trajectories.length} trajectoires` : 'ABSENT');

			// CRITIQUE: Claude ne génère PAS les scores - calcul depuis les réponses
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
				console.log('✅ Scores calculés:', scores);
			}
			return analysis;
		}

		console.warn('⚠️ Pas de JSON trouvé dans la réponse Claude');
		console.log('🔄 Bascule vers le plan de secours OpenAI...');
		return generateRecommendationsWithOpenAI(answers, cvData, env, userPlan);

	} catch (error) {
		console.error('❌ Erreur génération Claude:', error.message);
		console.log('🔄 Bascule vers le plan de secours OpenAI...');
		return generateRecommendationsWithOpenAI(answers, cvData, userPlan);
	}
}

// ============================================
// GÉNÉRATION SIMPLE (sans Claude)
// ============================================

function generateSimpleRecommendations(answers, cvData, userPlan = 'decouverte') {
	console.log('🚨🚨🚨 DÉBUT generateSimpleRecommendations - answers:', JSON.stringify(answers));
	console.log(`📊 Génération simple des recommandations (sans IA) - Plan: ${userPlan}`);

	// Déterminer le nombre de recommandations selon le plan
	const recommendationCounts = {
		'decouverte': { career: 3, business: 0 },
		'decouverte_coach': { career: 10, business: 5 },
		'clarity': { career: 3, business: 0 },
		'essentiel': { career: 10, business: 5 },
		'essentiel_coach': { career: 10, business: 5 },
		'direction': { career: 10, business: 5 },
		'premium': { career: 10, business: 5 },
		'premium_coach': { career: 10, business: 5 },
		'elite_coach': { career: 10, business: 5 },
		'transformation': { career: 10, business: 5 }
	};

	// Normaliser le plan (lowercase + trim) pour match case-insensitive
	const normalizedPlan = (userPlan || 'decouverte').toLowerCase().trim();
	const counts = recommendationCounts[normalizedPlan] || recommendationCounts['decouverte'];

	const analysis = {
		_debug: {
			method: 'simple',
			reason: 'Fallback or API key missing',
			plan: userPlan,
			normalizedPlan: normalizedPlan
		},
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
		// Question 4: Contenu (multi-select)
		'dev-perso': { label: 'Développement personnel', category: 'passion', score: 15 },
		'creative': { label: 'Créatif', category: 'passion', score: 25 },
		'culture': { label: 'Culture', category: 'passion', score: 15 },
		// Question 5: Aide demandée (multi-select)
		'advice': { label: 'Conseils', category: 'profession', score: 20 },
		'organize': { label: 'Organisation', category: 'profession', score: 20 },
		'mediate': { label: 'Médiation', category: 'profession', score: 20 },
		'motivate': { label: 'Motivation', category: 'mission', score: 25 },
		// Question 6: Compétence naturelle
		'analysis': { label: 'Analyse', category: 'profession', score: 25 },
		'empathy': { label: 'Empathie', category: 'mission', score: 25 },
		'execution': { label: 'Exécution', category: 'profession', score: 20 },
		// Question 7: Style d'apprentissage
		'practice': { label: 'Pratique', category: 'profession', score: 20 },
		'read': { label: 'Lecture', category: 'profession', score: 15 },
		'watch': { label: 'Observation', category: 'profession', score: 15 },
		'discuss': { label: 'Discussion', category: 'profession', score: 15 },
		// Question 8: Rôle en équipe
		'leader': { label: 'Leader', category: 'profession', score: 25 },
		'analyst': { label: 'Analyste', category: 'profession', score: 20 },
		'harmonizer': { label: 'Médiateur', category: 'mission', score: 25 },
		'executor': { label: 'Exécutant', category: 'profession', score: 20 },
		'challenger': { label: 'Challenger', category: 'passion', score: 20 },
		// Question 9 & 10: Valeurs et environnement
		'team': { label: 'Équipe', category: 'profession', score: 15 },
		'growth': { label: 'Croissance', category: 'passion', score: 20 },
		'respect': { label: 'Respect', category: 'mission', score: 20 },
		'balance': { label: 'Équilibre', category: 'vocation', score: 15 },
		'corporate': { label: 'Grande entreprise', category: 'vocation', score: 15 },
		// Question 11: Définition du succès
		'wealth': { label: 'Liberté financière', category: 'vocation', score: 25 },
		'recognition': { label: 'Reconnaissance', category: 'vocation', score: 20 },
		'mastery': { label: 'Excellence', category: 'profession', score: 25 },
		// Question 12: Causes
		'equality': { label: 'Égalité', category: 'mission', score: 30 },
		'community': { label: 'Communauté', category: 'mission', score: 25 },
		// Question 13: Secteur
		'sustainability': { label: 'Durable', category: 'mission', score: 25 },
		'finance': { label: 'Finance', category: 'vocation', score: 20 }
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
			title: `Entrepreneur dans l'innovation`,
			description: `Exploitez votre passion pour ${analysis.passions[0].toLowerCase()} en créant des projets innovants qui vous inspirent.`,
			matchScore: 92,
			realism: '🟢',
			realismLabel: 'Accessible',
			keyRisk: 'Aucun'
		});
	} else if (dominant === 'mission' && analysis.mission[0]) {
		analysis.careerRecommendations.push({
			title: `Responsable ${analysis.mission[0]}`,
			description: `Dirigez des initiatives dans ${analysis.mission[0].toLowerCase()} pour créer un impact durable.`,
			matchScore: 90,
			realism: '🟢',
			realismLabel: 'Accessible', // Label absent dans le code d'origine pour cette entrée
			keyRisk: 'Aucun'
		});
	} else if (dominant === 'profession' && analysis.talents[0]) {
		analysis.careerRecommendations.push({
			title: `Expert ${analysis.talents[0]}`,
			description: `Devenez une référence en ${analysis.talents[0].toLowerCase()} grâce à votre expertise unique.`,
			matchScore: 88,
			realism: '🟢',
			realismLabel: 'Accessible',
			keyRisk: 'Aucun'
		});
	} else {
		analysis.careerRecommendations.push({
			title: `Consultant Stratégique`,
			description: `Conseillez des organisations en combinant vos compétences et votre vision.`,
			matchScore: 85,
			realism: '🟠',
			realismLabel: 'Intéressant',
			keyRisk: 'Aucun'
		});
	}

	if (cvData.skills && cvData.skills.length > 0) {
		const mainSkill = cvData.skills[0];
		const expText = cvData.yearsExperience > 0 ? ` avec ${cvData.yearsExperience} ans d'expérience` : '';
		analysis.careerRecommendations.push({
			title: `Lead ${mainSkill}`,
			description: `Dirigez des équipes et projets en ${mainSkill.toLowerCase()}${expText} pour maximiser votre impact.`,
			matchScore: 87,
			realism: '🟢',
			realismLabel: 'Excellente opportunité',
			keyRisk: 'Aucun'
		});
	}

	if (analysis.passions[0] && analysis.mission[0]) {
		analysis.careerRecommendations.push({
			title: `Manager ${analysis.passions[0]} & ${analysis.mission[0]}`,
			description: `Combinez ${analysis.passions[0].toLowerCase()} et ${analysis.mission[0].toLowerCase()} dans un rôle de management.`,
			matchScore: 84,
			realism: '🟠',
			realismLabel: 'Potentiel',
			keyRisk: 'Aucun'
		});
	}

	// Compléter jusqu'au nombre requis
	while (analysis.careerRecommendations.length < counts.career) {
		analysis.careerRecommendations.push({
			title: `Consultant ${analysis.vocation[0] || 'Indépendant'}`,
			description: 'Développez votre activité de conseil en exploitant votre expertise unique.',
			matchScore: 75 - analysis.careerRecommendations.length,
			realism: '🟢',
			realismLabel: 'Accessible',
			keyRisk: 'Aucun'
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

	// ============================================
	// GARANTIE DE SCORES MINIMUMS
	// Si aucune réponse n'a matché, assigner des scores minimums
	// ============================================
	const hasAnyScore = Object.values(analysis.score).some(s => s > 0);

	if (!hasAnyScore || Object.keys(answers).length > 0) {
		// Calculer des scores basés sur le nombre de réponses
		const answerCount = Object.keys(answers).length;
		const baseScore = Math.min(60, 30 + answerCount * 5); // Score de base entre 30-60

		// Si les scores sont toujours à 0, appliquer des scores minimums
		if (analysis.score.passion === 0) analysis.score.passion = baseScore + Math.floor(Math.random() * 15);
		if (analysis.score.profession === 0) analysis.score.profession = baseScore + Math.floor(Math.random() * 15);
		if (analysis.score.mission === 0) analysis.score.mission = baseScore + Math.floor(Math.random() * 15);
		if (analysis.score.vocation === 0) analysis.score.vocation = baseScore + Math.floor(Math.random() * 15);

		console.log('⚠️ Scores minimums appliqués car mapping fail:', analysis.score);
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
			const { data: analyses, error } = await supabase
				.from('analyses')
				.select('*')
				.eq('user_id', user.id)
				.order('created_at', { ascending: false });

			if (error) {
				return errorResponse('Erreur récupération données: ' + error.message, 500);
			}

			return jsonResponse({
				success: true,
				analyses: analyses || [],
				latestAnalysis: analyses?.[0] || null,
				totalAnalyses: analyses?.length || 0
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
						.from('analyses')
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
			const { data: analyses } = await supabase
				.from('analyses')
				.select('*')
				.eq('user_id', clientId)
				.order('created_at', { ascending: false });

			return jsonResponse({
				success: true,
				latestAnalysis: analyses[0] || null,
				history: analyses
			});
		}

		// ============ INVITATION ENDPOINT ============

		// POST /api/send-invitation
		if (path === '/api/send-invitation' && method === 'POST') {
			try {
				const { to, clientName, personalMessage, coachId, inviteBaseUrl } = await request.json();

				if (!to || !clientName || !coachId) {
					return errorResponse('Champs requis manquants: to, clientName, coachId', 400);
				}

				if (!env.RESEND_API_KEY) {
					console.error('❌ RESEND_API_KEY non configurée');
					return errorResponse('Service d\'envoi d\'email non configuré', 500);
				}

				const supabase = getSupabaseClient(env);

				// Récupérer les infos du coach
				const { data: coach, error: coachError } = await supabase
					.from('profiles')
					.select('id, name, email')
					.eq('id', coachId)
					.single();

				if (coachError || !coach) {
					return errorResponse('Coach non trouvé', 404);
				}

				const coachName = coach.name || coach.email.split('@')[0];

				// Vérifier si un compte existe déjà pour cet email
				const { data: existingProfile } = await supabase
					.from('profiles')
					.select('id')
					.eq('email', to.toLowerCase())
					.single();

				let clientId = null;
				if (existingProfile) {
					clientId = existingProfile.id;
					console.log('👤 Client existe déjà:', to);

					// Vérifier si la relation existe déjà
					const { data: existingRelation } = await supabase
						.from('coach_clients')
						.select('id')
						.eq('coach_id', coachId)
						.eq('client_id', clientId)
						.single();

					if (existingRelation) {
						return errorResponse('Ce client est déjà invité', 400);
					}
				}

				// Créer une invitation en attente
				let invitationId = null;
				if (clientId) {
					// Client existe → créer la relation directement
					const { data: relation, error: relationError } = await supabase
						.from('coach_clients')
						.insert({
							coach_id: coachId,
							client_id: clientId,
							status: 'active',
							invitation_email: to.toLowerCase()
						})
						.select()
						.single();

					if (relationError) {
						console.error('❌ Erreur création relation:', relationError);
						return errorResponse('Erreur création relation: ' + relationError.message);
					}

					invitationId = relation.id;
					console.log('✅ Relation créée pour client existant');
				} else {
					// Client n'existe pas encore → créer invitation en attente
					const { data: invitation, error: inviteError } = await supabase
						.from('coach_clients')
						.insert({
							coach_id: coachId,
							client_id: null,
							status: 'pending',
							invitation_email: to.toLowerCase()
						})
						.select()
						.single();

					if (inviteError) {
						console.error('❌ Erreur création invitation:', inviteError);
						return errorResponse('Erreur création invitation: ' + inviteError.message);
					}

					invitationId = invitation.id;
					console.log('✅ Invitation créée en attente:', invitationId);
				}

				// Générer le lien d'invitation avec l'ID du coach
				// Utiliser inviteBaseUrl si fourni (pour support local/prod), sinon fallback
				const baseUrl = inviteBaseUrl || 'https://ai-ikigai.com/auth.html';
				const inviteLink = `${baseUrl}?role=client&coach_id=${coachId}&invitation_id=${invitationId}`;

				const emailHTML = generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink);

				const emailFrom = env.EMAIL_FROM || 'onboarding@resend.dev';

				const resendPayload = {
					from: `${coachName} via AI-Ikigai <${emailFrom}>`,
					to: [to],
					reply_to: 'contact@ai-ikigai.com',
					subject: `${coachName} vous invite à découvrir votre Ikigai ✨`,
					html: emailHTML
				};

				console.log('📧 Envoi email invitation via Resend:', to);

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
					console.error('❌ Erreur Resend:', result);
					const errorMessage = result.message || result.error || 'Échec envoi email';
					return errorResponse(`Erreur Resend: ${errorMessage}`, 500);
				}

				console.log('✅ Email envoyé via Resend:', result.id);

				return jsonResponse({
					success: true,
					message: 'Invitation envoyée avec succès',
					emailId: result.id,
					invitationId: invitationId
				});

			} catch (error) {
				console.error('❌ Erreur endpoint send-invitation:', error);
				return errorResponse(error.message, 500);
			}
		}

		// ============ PDF GENERATION ENDPOINT ============

		// POST /api/generate-pdf
		if (path === '/api/generate-pdf' && method === 'POST') {
			try {
				const { clientId, coachId } = await request.json();

				if (!clientId || !coachId) {
					return errorResponse('Missing clientId or coachId', 400);
				}

				const supabase = getSupabaseClient(env);

				const { data: client, error: clientError } = await supabase
					.from('profiles')
					.select('*')
					.eq('id', clientId)
					.single();

				if (clientError) {
					return errorResponse('Client non trouvé', 404);
				}

				const { data: analysis, error: analysisError } = await supabase
					.from('analyses')
					.select('*')
					.eq('user_id', clientId)
					.order('created_at', { ascending: false })
					.limit(1)
					.maybeSingle();

				if (analysisError || !analysis) {
					return errorResponse('Aucune analyse Ikigai trouvée', 404);
				}

				const pdfHTML = generatePDFHTML(client, analysis);

				return new Response(pdfHTML, {
					headers: {
						...corsHeaders,
						'Content-Type': 'text/html',
					}
				});

			} catch (error) {
				console.error('❌ Erreur génération PDF:', error);
				return errorResponse(error.message, 500);
			}
		}

		// ============ GOOGLE CALENDAR ENDPOINTS ============

		// GET /api/google/oauth/init
		if (path === '/api/google/oauth/init' && method === 'GET') {
			try {
				if (!env.GOOGLE_CLIENT_ID) {
					return errorResponse('Google OAuth non configuré', 500);
				}

				const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
					`client_id=${env.GOOGLE_CLIENT_ID}` +
					`&redirect_uri=${encodeURIComponent('https://ai-ikigai.ai-ikigai.workers.dev/api/google/oauth/callback')}` +
					`&response_type=code` +
					`&scope=${encodeURIComponent('https://www.googleapis.com/auth/calendar.events')}` +
					`&access_type=offline` +
					`&prompt=consent`;

				return Response.redirect(authUrl, 302);
			} catch (error) {
				return errorResponse(error.message, 500);
			}
		}

		// GET /api/google/oauth/callback
		if (path === '/api/google/oauth/callback' && method === 'GET') {
			try {
				const code = url.searchParams.get('code');

				if (!code) {
					return errorResponse('No code provided', 400);
				}

				if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
					return errorResponse('Google OAuth non configuré', 500);
				}

				const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						code,
						client_id: env.GOOGLE_CLIENT_ID,
						client_secret: env.GOOGLE_CLIENT_SECRET,
						redirect_uri: 'https://ai-ikigai.ai-ikigai.workers.dev/api/google/oauth/callback',
						grant_type: 'authorization_code'
					})
				});

				const tokens = await tokenResponse.json();

				if (!tokenResponse.ok) {
					return errorResponse(`Google OAuth error: ${JSON.stringify(tokens)}`, 400);
				}

				return new Response(`
<!DOCTYPE html>
<html>
<head>
	<title>Google Calendar Connected</title>
	<style>
		body { font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
		.container { text-align: center; background: white; padding: 40px; border-radius: 12px; }
		h1 { color: #667eea; }
	</style>
</head>
<body>
	<div class="container">
		<h1>✅ Connexion Google Calendar réussie !</h1>
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

			} catch (error) {
				return errorResponse(error.message, 500);
			}
		}

		// POST /api/google/create-event
		if (path === '/api/google/create-event' && method === 'POST') {
			try {
				const { accessToken, event } = await request.json();

				if (!accessToken || !event) {
					return errorResponse('Missing accessToken or event', 400);
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

				return jsonResponse(result);

			} catch (error) {
				return errorResponse(error.message, 500);
			}
		}

		// ============ BREVO NOTIFICATION ENDPOINT ============

		// POST /api/notify/new-client
		if (path === '/api/notify/new-client' && method === 'POST') {
			try {
				const { coachId, clientName, clientEmail } = await request.json();

				if (!coachId || !clientName || !clientEmail) {
					return errorResponse('Missing required fields', 400);
				}

				const supabase = getSupabaseClient(env);

				const { data: coach, error } = await supabase
					.from('profiles')
					.select('email, name, notification_new_clients')
					.eq('id', coachId)
					.single();

				if (error || !coach) {
					return errorResponse('Coach not found', 404);
				}

				if (!coach.notification_new_clients) {
					return jsonResponse({
						success: true,
						message: 'Notifications disabled'
					});
				}

				await sendBrevoEmail(env, 1, coach.email, {
					coach_name: coach.name,
					client_name: clientName,
					client_email: clientEmail
				});

				console.log(`✅ Notification sent to ${coach.email}`);

				return jsonResponse({ success: true });

			} catch (error) {
				return errorResponse(error.message, 500);
			}
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
				.from('analyses')
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

		// POST /api/invitation/accept
		if (path === '/api/invitation/accept' && method === 'POST') {
			try {
				const { invitationId, coachId } = await request.json();
				const authHeader = request.headers.get('Authorization');

				if (!authHeader) return errorResponse('Non authentifié', 401);
				if (!invitationId || !coachId) return errorResponse('Paramètres manquants', 400);

				const token = authHeader.replace('Bearer ', '');
				const supabase = getSupabaseClient(env);
				const { data: { user }, error: authError } = await supabase.auth.getUser(token);

				if (authError || !user) return errorResponse('Token invalide', 401);

				console.log(`🔗 Linking user ${user.id} to invitation ${invitationId} (coach: ${coachId})`);

				// 1. Update the invitation with the real user ID
				// Using service role key bypasses RLS for this specific operation if needed,
				// but here we use the user's token. If RLS fails, we might need admin client.
				// Let's try regular client first.
				const { data, error } = await supabase
					.from('coach_clients')
					.update({
						client_id: user.id,
						status: 'active'
					})
					.eq('id', invitationId)
					.eq('coach_id', coachId)
					.eq('status', 'pending')
					.select()
					.single();

				if (error) {
					console.error('❌ Failed to link invitation:', error);
					// Fallback: If RLS blocked it, maybe try to insert a NEW active row?
					// Or just return error.
					return errorResponse('Erreur activation: ' + error.message, 500);
				}

				return jsonResponse({ success: true, relation: data });

			} catch (error) {
				return errorResponse(error.message, 500);
			}
		}

		// Submit questionnaire + Analyse immédiate (SANS CV)
		if (path === '/api/questionnaire/submit' && method === 'POST') {
			console.log('📝 POST /api/questionnaire/submit');

			const body = await request.json();
			const { answers, email, user_plan: bodyUserPlan } = body;

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

			// Utiliser user_plan du body comme base
			let userPlan = bodyUserPlan || 'decouverte';
			console.log('📋 User plan from body:', bodyUserPlan);

			// TOUJOURS vérifier Supabase pour upgrader le plan si coach présent
			const authHeader = request.headers.get('Authorization');
			if (authHeader && env.SUPABASE_URL) {
				try {
					const token = authHeader.replace('Bearer ', '');
					const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY, {
						global: { headers: { Authorization: `Bearer ${token}` } }
					});
					const { data: { user }, error: userError } = await supabase.auth.getUser();

					if (user) {
						// 1. Si pas de plan dans le body, prendre celui du profil
						if (!bodyUserPlan) {
							const { data: profile } = await supabase
								.from('profiles')
								.select('plan')
								.eq('id', user.id)
								.single();
							if (profile?.plan) userPlan = profile.plan;
						}

						// 2. CRITIQUE: Vérifier si l'utilisateur a un coach (FORCE UPGRADE - Method Count)
						const { count, error: coachError } = await supabase
							.from('coach_clients')
							.select('id', { count: 'exact', head: true })
							.eq('client_id', user.id);

						if (coachError) {
							console.warn('⚠️ Erreur check coach:', coachError.message);
						} else {
							console.log(`🔍 Check coach pour ${user.id} -> Count: ${count}`);
						}

						if (count && count > 0) {
							console.log('👨‍🏫 Coach found (count > 0) -> Forcing plan upgrade to decouverte_coach');
							// Upgrade uniquement si le plan actuel est inférieur
							if (userPlan === 'decouverte' || userPlan === 'clarity') {
								userPlan = 'decouverte_coach';
							}
						}
						console.log(`✅ Plan final validé: ${userPlan}`);
					}
				} catch (error) {
					console.warn('⚠️ Erreur vérification plan backend:', error.message);
				}
			}

			console.log(`🎯 Final user plan for analysis: ${userPlan}`);

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

			// NOUVEAU: Stocker dans Supabase table analyses (permanent)
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

					// DEBUG: Log complet de l'objet analysis avant insertion
					console.log('🔍 DEBUG - Analysis object before Supabase insert:');
					console.log('  - score:', JSON.stringify(analysis.score));
					console.log('  - passions:', JSON.stringify(analysis.passions));
					console.log('  - talents:', JSON.stringify(analysis.talents));
					console.log('  - mission:', JSON.stringify(analysis.mission));
					console.log('  - vocation:', JSON.stringify(analysis.vocation));
					console.log('  - careerRecommendations:', analysis.careerRecommendations?.length || 0);
					console.log('  - businessIdeas:', analysis.businessIdeas?.length || 0);

					// Sauvegarder dans table analyses avec tous les champs
					const { error: insertError } = await supabase.from('analyses').insert({
						user_id: userId,
						answers: answers || {},
						passions: analysis.passions || [],
						talents: analysis.talents || [],
						mission: analysis.mission || [],
						vocation: analysis.vocation || [],
						career_recommendations: analysis.careerRecommendations || [],
						business_ideas: analysis.businessIdeas || [],
						coherence_diagnosis: analysis.coherenceDiagnosis || null,
						score: analysis.score || {},
						// BACKWARD COMPATIBILITY: Colonnes individuelles pour ancien dashboard
						passion_score: analysis.score?.passion || 0,
						profession_score: analysis.score?.profession || 0,
						mission_score: analysis.score?.mission || 0,
						vocation_score: analysis.score?.vocation || 0,
						profile_summary: analysis.profileSummary || null,
						ikigai_summary: analysis.ikigaiSummary || null,
						trajectories: analysis.trajectories || null,
						final_trajectory: analysis.finalTrajectory || null,
						positioning: analysis.positioning || null,
						coaching_prep: analysis.coachingPrep || null
					});

					if (insertError) {
						console.error('❌ Erreur insertion Supabase:', insertError.message);
					} else {
						console.log('✅ Analyse sauvegardée dans Supabase table analyses');
					}
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
						.from('analyses')
						.select('*')
						.eq('id', id)
						.single();

					if (error) throw error;

					if (data) {
						return jsonResponse({
							success: true,
							analysis: data
						});
					}
				} catch (e) {
					console.warn('⚠️ Erreur lecture Supabase:', e.message);
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


// ============================================
// EMAIL TEMPLATE: Invitation Client
// ============================================

function generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink) {
	return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<style>
		body { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
		.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
		.logo { font-size: 2.5rem; font-weight: bold; background: linear-gradient(90deg, #00d4ff, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; }
		.personal-message { background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); padding: 20px; border-radius: 12px; margin: 25px 0; font-style: italic; border-left: 4px solid #8b5cf6; }
		.cta-button { display: inline-block; background: linear-gradient(135deg, #00d4ff, #8b5cf6); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
	</style>
</head>
<body>
	<div class="container">
		<div class="logo">AI-Ikigai</div>
		<h2>Bonjour ${clientName} 👋</h2>
		<p><strong>${coachName}</strong> vous invite à découvrir votre Ikigai avec AI-Ikigai !</p>
		${personalMessage ? `<div class="personal-message">"${personalMessage}"<div style="text-align: right; margin-top: 10px; font-style: normal; color: #64748b;">— ${coachName}</div></div>` : ''}
		<div style="margin: 30px 0;">
			<div style="margin: 15px 0;"><span style="font-size: 1.5rem; margin-right: 12px;">🎯</span><strong>Analyse personnalisée</strong><br>Découvrez les 4 dimensions de votre Ikigai</div>
			<div style="margin: 15px 0;"><span style="font-size: 1.5rem; margin-right: 12px;">📊</span><strong>Dashboard interactif</strong><br>Suivez votre progression</div>
			<div style="margin: 15px 0;"><span style="font-size: 1.5rem; margin-right: 12px;">🤝</span><strong>Accompagnement coach</strong><br>Bénéficiez de l'expertise de ${coachName}</div>
		</div>
		<div style="text-align: center;">
			<a href="${inviteLink}" class="cta-button">✨ Créer mon compte gratuitement</a>
		</div>
		<p style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-top: 30px;">Ce lien est valide pendant 7 jours</p>
	</div>
</body>
</html>
	`;
}

// ============================================
// PDF TEMPLATE: Rapport Ikigai
// ============================================

function generatePDFHTML(client, analysis) {
	const date = new Date().toLocaleDateString('fr-FR');

	// Support both legacy and new structures
	const score = analysis.score || analysis.ikigai_dimensions || {};
	const passionScore = score.passion_score || score.passion || 0;
	const professionScore = score.profession_score || score.profession || 0;
	const missionScore = score.mission_score || score.mission || 0;
	const vocationScore = score.vocation_score || score.vocation || 0;

	const globalScore = Math.round((passionScore + professionScore + missionScore + vocationScore) / 4);

	return `
<!DOCTYPE html>
<html lang="fr">
<head>
	<meta charset="UTF-8">
	<title>Rapport Ikigai - ${client.name}</title>
	<style>
		body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
		.header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
		.logo { font-size: 2.5rem; font-weight: bold; color: #8b5cf6; }
		.dimension { margin: 25px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #8b5cf6; }
		.score-value { font-size: 4rem; font-weight: bold; color: #8b5cf6; }
		.dimension-score { font-size: 2rem; color: #8b5cf6; }
		.progress-bar { width: 100%; height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
		.progress- fill { height: 100%; background: linear-gradient(90deg, #00d4ff, #8b5cf6); }
		@media print { .no-print { display: none; } }
	</style>
</head>
<body>
	<div class="header">
		<div class="logo">AI-Ikigai</div>
		<h1>Rapport d'Analyse Ikigai</h1>
	</div>
	<div style="margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 8px;">
		<h2>${client.name}</h2>
		<p><strong>Email:</strong> ${client.email}</p>
		<p><strong>Date:</strong> ${date}</p>
	</div>
	<div style="text-align: center; margin: 40px 0;">
		<h2>Score Global</h2>
		<div class="score-value">${globalScore}%</div>
	</div>
	<h2>Les 4 Dimensions</h2>
	<div class="dimension">
		<h3>🎯 Passion</h3>
		<div class="dimension-score">${passionScore}%</div>
		<div class="progress-bar"><div class="progress-fill" style="width: ${passionScore}%"></div></div>
	</div>
	<div class="dimension">
		<h3>⭐ Profession</h3>
		<div class="dimension-score">${professionScore}%</div>
		<div class="progress-bar"><div class="progress-fill" style="width: ${professionScore}%"></div></div>
	</div>
	<div class="dimension">
		<h3>🌍 Mission</h3>
		<div class="dimension-score">${missionScore}%</div>
		<div class="progress-bar"><div class="progress-fill" style="width: ${missionScore}%"></div></div>
	</div>
	<div class="dimension">
		<h3>💰 Vocation</h3>
		<div class="dimension-score">${vocationScore}%</div>
		<div class="progress-bar"><div class="progress-fill" style="width: ${vocationScore}%"></div></div>
	</div>
	<div class="no-print" style="text-align: center; margin: 40px 0;">
		<button onclick="window.print()" style="padding: 12px 30px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer;">
			📄 Imprimer / Sauvegarder PDF
		</button>
	</div>
</body>
</html>
	`;
}

// ============================================
// BREVO EMAIL: Envoi via API
// ============================================

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

export default {
	async fetch(request, env, ctx) {
		try {
			return await handleRequest(request, env);
		} catch (e) {
			console.error('🔥 Critical Worker Error:', e);
			return new Response(JSON.stringify({ error: e.message, stack: e.stack }), {
				status: 500,
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
					'Access-Control-Allow-Headers': 'Content-Type, Authorization'
				}
			});
		}
	},
};

// ============================================
// FALLBACK: GÉNÉRATION AVEC OPENAI (GPT-4o)
// ============================================

async function generateRecommendationsWithOpenAI(answers, cvData, env, userPlan) {
	if (!env.OPENAI_API_KEY) {
		console.warn('⚠️ Pas de clé API OpenAI, utilisation génération simple');
		return generateSimpleRecommendations(answers, cvData, userPlan);
	}

	console.log('🤖⚠️ Bascule vers OpenAI (GPT-4o) pour recommandations...');

	try {
		const packLevelMap = {
			'decouverte': 'CLARITY',
			'decouverte_coach': 'TRANSFORMATION',
			'essentiel': 'DIRECTION',
			'essentiel_coach': 'TRANSFORMATION',
			'premium': 'TRANSFORMATION',
			'premium_coach': 'TRANSFORMATION',
			'elite_coach': 'TRANSFORMATION'
		};
		const packLevel = packLevelMap[userPlan] || 'CLARITY';

		const systemPrompt = `You are an expert career coach using the Ikigai methodology.
CORE PRINCIPLES:
- Do NOT invent information
- Be specific and actionable
- Output JSON ONLY (no markdown code blocks)
- Language: FRENCH

PACK_LEVEL = ${packLevel}

USER DATA:
A) Ikigai questionnaire:
${JSON.stringify(answers, null, 2)}

B) CV:
Skills: ${cvData.skills.join(', ') || 'Non spécifié'}
Experience: ${cvData.experiences.join(', ') || 'Non spécifié'}
Years: ${cvData.yearsExperience || 0}

OUTPUT JSON STRUCTURE (Must match exactly):
${packLevel === 'CLARITY' ? `
{
  "profileSummary": "6 lines max",
  "ikigaiSummary": "Summary",
  "passions": ["p1", "p2", "p3"],
  "talents": ["t1", "t2", "t3"],
  "mission": ["m1", "m2"],
  "vocation": ["v1", "v2"],
  "score": {"passion": 85, "mission": 90, "vocation": 80, "profession": 75},
  "careerRecommendations": [
    { "title": "Job Title", "description": "Why it fits", "matchScore": 90, "realism": "🟢", "realismLabel": "Accessible", "keyRisk": "None" },
    { "title": "Job Title", "description": "Why it fits", "matchScore": 80, "realism": "🟠", "realismLabel": "Growth", "keyRisk": "None" },
    { "title": "Job Title", "description": "Why it fits", "matchScore": 70, "realism": "🔴", "realismLabel": "Ambitious", "keyRisk": "None" }
  ]
}` : `
{
  "profileSummary": "6 lines",
  "ikigaiSummary": "Summary",
  "passions": [...], "talents": [...], "mission": [...], "vocation": [...],
  "score": {...},
  "trajectories": [
    {
      "rank": 1, "label": "Main Path", "title": "Title", "description": "Desc",
      "realism": "🟢", "realismLabel": "Accessible", "keyRisk": "Attention Point",
      "jobTitles": ["Job1", "Job2"], "whyIkigai": "Reason", "whyCV": "Reason", "whyMarket": "Reason",
      "existingSkills": ["s1"], "skillsToDevelop": ["s1", "s2"], "actionPlan30Days": ["a1", "a2"]
    },
    { "rank": 2, "label": "Alternative", ... },
    { "rank": 3, "label": "Ambitious", ... }
  ],
  "businessIdeas": [
    { "title": "Idea", "description": "Desc", "problem": "Prob", "target": "Target", "whyFits": "Reason", "viabilityScore": 80 },
    ... (5 ideas total)
  ],
  "coherenceDiagnosis": { "strengths": [], "misalignments": [], "keyRisks": [] },
  "finalTrajectory": { "choice": "Path 1", "justification": "Because..." },
  "positioning": { "statement": "I am...", "linkedinHeadline": "Head", "pitch": "Pitch" },
  "coachingPrep": { "keyQuestions": [], "topicsToClarify": [] },
  "careerRecommendations": []
}`}`;

		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${env.OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'gpt-4o',
				messages: [
					{ role: 'system', content: systemPrompt },
					{ role: 'user', content: 'Generate the Ikigai analysis JSON.' }
				],
				temperature: 0.7,
				response_format: { type: "json_object" }
			})
		});

		const data = await response.json();

		if (!response.ok) {
			console.error('❌ OpenAI API Error:', data);
			return generateSimpleRecommendations(answers, cvData, userPlan);
		}

		const content = data.choices[0].message.content;
		const analysis = JSON.parse(content);
		analysis._debug = {
			method: 'openai',
			plan: userPlan,
			pack: packLevel
		};

		console.log('✅ Recommandations générées par OpenAI (GPT-4o)');

		// Ensure score exists
		if (!analysis.score) {
			analysis.score = { passion: 75, profession: 75, mission: 75, vocation: 75 };
		}

		return analysis;

	} catch (error) {
		console.error('❌ Erreur génération OpenAI:', error);
		return generateSimpleRecommendations(answers, cvData, userPlan);
	}
}
