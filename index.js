/**
 * AI-IKIGAI Backend - Cloudflare Worker
 * 
 * This worker handles:
 * - User authentication
 * - Questionnaire submissions
 * - CV upload and analysis
 * - Ikigai report generation
 * - Payment processing (Stripe)
 * - Email notifications
 */

// ============================================
// CORS Headers
// ============================================
const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
	'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
	'Access-Control-Max-Age': '86400',
};

// ============================================
// Helper Functions
// ============================================

function jsonResponse(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders,
		},
	});
}

function errorResponse(message, status = 400) {
	return jsonResponse({ success: false, error: message }, status);
}

function generateId() {
	return crypto.randomUUID();
}

async function hashPassword(password) {
	const encoder = new TextEncoder();
	const data = encoder.encode(password);
	const hash = await crypto.subtle.digest('SHA-256', data);
	return btoa(String.fromCharCode(...new Uint8Array(hash)));
}

async function generateToken(userId, env) {
	const payload = {
		userId,
		exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
	};
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(env.JWT_SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign(
		'HMAC',
		key,
		encoder.encode(JSON.stringify(payload))
	);
	return btoa(JSON.stringify(payload)) + '.' + btoa(String.fromCharCode(...new Uint8Array(signature)));
}

async function verifyToken(token, env) {
	try {
		const [payloadB64, signatureB64] = token.split('.');
		const payload = JSON.parse(atob(payloadB64));
		
		if (payload.exp < Date.now()) {
			return null;
		}
		
		const encoder = new TextEncoder();
		const key = await crypto.subtle.importKey(
			'raw',
			encoder.encode(env.JWT_SECRET),
			{ name: 'HMAC', hash: 'SHA-256' },
			false,
			['verify']
		);
		
		const signature = Uint8Array.from(atob(signatureB64), c => c.charCodeAt(0));
		const valid = await crypto.subtle.verify(
			'HMAC',
			key,
			signature,
			encoder.encode(JSON.stringify(payload))
		);
		
		return valid ? payload : null;
	} catch {
		return null;
	}
}

async function getAuthUser(request, env) {
	const authHeader = request.headers.get('Authorization');
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return null;
	}
	const token = authHeader.substring(7);
	const payload = await verifyToken(token, env);
	if (!payload) {
		return null;
	}
	const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(payload.userId).first();
	return user;
}

// ============================================
// Ikigai Analysis Engine
// ============================================

function analyzeIkigai(answers, cvData = null) {
	// Mapping des réponses aux catégories Ikigai
	const analysis = {
		passions: [],
		talents: [],
		mission: [],
		vocation: [],
		recommendations: [],
		businessIdeas: [],
		score: {
			passion: 0,
			profession: 0,
			mission: 0,
			vocation: 0,
		}
	};

	// Analyse des passions (questions 1-4)
	const passionAnswers = [answers[1], answers[2], answers[3], answers[4]].flat().filter(Boolean);
	const passionMapping = {
		'create': { label: 'Créativité', category: 'passion', score: 20 },
		'analyze': { label: 'Analyse', category: 'profession', score: 20 },
		'teach': { label: 'Transmission', category: 'mission', score: 20 },
		'connect': { label: 'Connexion humaine', category: 'mission', score: 15 },
		'build': { label: 'Construction', category: 'vocation', score: 20 },
		'explore': { label: 'Exploration', category: 'passion', score: 15 },
		'tech': { label: 'Technologie', category: 'profession', score: 20 },
		'art': { label: 'Art & Design', category: 'passion', score: 20 },
		'business': { label: 'Business', category: 'vocation', score: 20 },
		'science': { label: 'Sciences', category: 'profession', score: 15 },
		'social': { label: 'Impact social', category: 'mission', score: 25 },
		'health': { label: 'Santé & Bien-être', category: 'mission', score: 20 },
		'challenge': { label: 'Défis', category: 'profession', score: 15 },
		'impact': { label: 'Impact', category: 'mission', score: 25 },
		'learn': { label: 'Apprentissage', category: 'passion', score: 15 },
		'team': { label: 'Travail d\'équipe', category: 'mission', score: 15 },
		'freedom': { label: 'Liberté', category: 'vocation', score: 20 },
	};

	passionAnswers.forEach(answer => {
		if (passionMapping[answer]) {
			const mapping = passionMapping[answer];
			analysis.passions.push(mapping.label);
			analysis.score[mapping.category] += mapping.score;
		}
	});

	// Analyse des talents (questions 5-8)
	const talentAnswers = [answers[5], answers[6], answers[7], answers[8]].flat().filter(Boolean);
	const talentMapping = {
		'advice': { label: 'Conseil', skills: ['Communication', 'Écoute'] },
		'organize': { label: 'Organisation', skills: ['Planification', 'Gestion de projet'] },
		'tech': { label: 'Technique', skills: ['Problem-solving', 'Analyse'] },
		'creative': { label: 'Créativité', skills: ['Innovation', 'Design thinking'] },
		'mediate': { label: 'Médiation', skills: ['Négociation', 'Diplomatie'] },
		'motivate': { label: 'Motivation', skills: ['Leadership', 'Coaching'] },
		'communication': { label: 'Communication', skills: ['Expression', 'Présentation'] },
		'analysis': { label: 'Analyse', skills: ['Stratégie', 'Résolution de problèmes'] },
		'creativity': { label: 'Créativité', skills: ['Innovation', 'Imagination'] },
		'leadership': { label: 'Leadership', skills: ['Influence', 'Vision'] },
		'empathy': { label: 'Empathie', skills: ['Écoute active', 'Intelligence émotionnelle'] },
		'execution': { label: 'Exécution', skills: ['Rigueur', 'Efficacité'] },
		'leader': { label: 'Leader', skills: ['Direction', 'Prise de décision'] },
		'analyst': { label: 'Analyste', skills: ['Réflexion', 'Data'] },
		'harmonizer': { label: 'Harmonisateur', skills: ['Cohésion', 'Facilitation'] },
		'executor': { label: 'Exécutant', skills: ['Action', 'Résultats'] },
		'challenger': { label: 'Challenger', skills: ['Questionnement', 'Amélioration'] },
	};

	talentAnswers.forEach(answer => {
		if (talentMapping[answer]) {
			const mapping = talentMapping[answer];
			analysis.talents.push(mapping.label);
			analysis.score.profession += 15;
		}
	});

	// Analyse des valeurs (questions 9-12)
	const valueAnswers = [answers[9], answers[10], answers[11], answers[12]].filter(Boolean);
	valueAnswers.forEach(answer => {
		if (['impact', 'social', 'education', 'environment', 'equality', 'health', 'community'].includes(answer)) {
			analysis.score.mission += 20;
		}
		if (['freedom', 'creativity', 'growth', 'balance'].includes(answer)) {
			analysis.score.passion += 15;
		}
		if (['wealth', 'recognition', 'mastery'].includes(answer)) {
			analysis.score.vocation += 20;
		}
	});

	// Analyse du marché (questions 13-15)
	const sectorAnswer = answers[13];
	const riskAnswer = answers[14];
	const idealActivity = answers[15];

	// Générer les recommandations basées sur le profil
	const recommendations = generateRecommendations(analysis.score, sectorAnswer, riskAnswer);
	analysis.recommendations = recommendations;

	// Générer des idées business
	const businessIdeas = generateBusinessIdeas(analysis.passions, analysis.talents, sectorAnswer);
	analysis.businessIdeas = businessIdeas;

	// Enrichir avec les données du CV si disponibles
	if (cvData) {
		analysis.cvSkills = cvData.skills || [];
		analysis.cvExperience = cvData.experience || [];
		analysis.cvEducation = cvData.education || [];
		
		// Ajuster les scores basés sur le CV
		if (cvData.skills && cvData.skills.length > 5) {
			analysis.score.profession += 20;
		}
		if (cvData.yearsExperience > 5) {
			analysis.score.vocation += 15;
		}
	}

	// Normaliser les scores (max 100)
	Object.keys(analysis.score).forEach(key => {
		analysis.score[key] = Math.min(100, analysis.score[key]);
	});

	// Déterminer le profil dominant
	const maxScore = Math.max(...Object.values(analysis.score));
	const dominantProfile = Object.keys(analysis.score).find(key => analysis.score[key] === maxScore);
	analysis.dominantProfile = dominantProfile;

	return analysis;
}

function generateRecommendations(scores, sector, riskLevel) {
	const recommendations = [];
	
	// Recommandations basées sur le secteur et le profil
	const sectorRecommendations = {
		'tech': [
			{ title: 'Product Manager', description: 'Pilotez le développement de produits tech innovants' },
			{ title: 'Tech Lead', description: 'Guidez les équipes techniques vers l\'excellence' },
			{ title: 'UX Designer', description: 'Créez des expériences utilisateur mémorables' },
		],
		'health': [
			{ title: 'Health Tech Entrepreneur', description: 'Révolutionnez le secteur de la santé avec la technologie' },
			{ title: 'Consultant Santé', description: 'Accompagnez les établissements de santé dans leur transformation' },
			{ title: 'Chef de projet e-Santé', description: 'Pilotez des projets de digitalisation médicale' },
		],
		'education': [
			{ title: 'Chief Learning Officer', description: 'Dirigez la stratégie de formation d\'une organisation' },
			{ title: 'Fondateur EdTech', description: 'Créez une startup dans l\'éducation numérique' },
			{ title: 'Formateur Expert', description: 'Transmettez votre expertise à travers des formations' },
		],
		'sustainability': [
			{ title: 'Responsable RSE', description: 'Pilotez la stratégie de développement durable' },
			{ title: 'Consultant Green Tech', description: 'Accompagnez la transition écologique des entreprises' },
			{ title: 'Entrepreneur Social', description: 'Créez une entreprise à impact positif' },
		],
		'finance': [
			{ title: 'FinTech Product Manager', description: 'Innovez dans les services financiers' },
			{ title: 'Consultant Transformation', description: 'Accompagnez la digitalisation du secteur financier' },
			{ title: 'Investment Manager', description: 'Gérez des portefeuilles d\'investissement' },
		],
		'creative': [
			{ title: 'Directeur Artistique', description: 'Définissez la vision créative de projets ambitieux' },
			{ title: 'Brand Strategist', description: 'Construisez des marques mémorables' },
			{ title: 'Creative Entrepreneur', description: 'Lancez votre agence créative' },
		],
	};

	if (sector && sectorRecommendations[sector]) {
		recommendations.push(...sectorRecommendations[sector]);
	}

	// Ajouter des recommandations basées sur le profil dominant
	if (scores.mission > 70) {
		recommendations.push({
			title: 'Responsable Impact',
			description: 'Mesurez et maximisez l\'impact social de votre organisation'
		});
	}
	if (scores.passion > 70) {
		recommendations.push({
			title: 'Intrapreneur',
			description: 'Innovez au sein de votre entreprise sur des projets qui vous passionnent'
		});
	}

	// Ajuster selon le niveau de risque
	if (riskLevel >= 4) {
		recommendations.unshift({
			title: 'Fondateur de Startup',
			description: 'Lancez votre propre entreprise dans votre domaine d\'expertise'
		});
	}

	return recommendations.slice(0, 5);
}

function generateBusinessIdeas(passions, talents, sector) {
	const ideas = [];

	// Générer des idées basées sur la combinaison passions + talents + secteur
	if (passions.includes('Créativité') && talents.includes('Technique')) {
		ideas.push({
			title: 'Studio de Design Tech',
			description: 'Créez un studio spécialisé dans le design d\'interfaces innovantes',
			potential: 'Élevé'
		});
	}

	if (passions.includes('Transmission') || talents.includes('Coaching')) {
		ideas.push({
			title: 'Plateforme de Mentorat',
			description: 'Lancez une plateforme connectant mentors et apprenants dans votre domaine',
			potential: 'Élevé'
		});
	}

	if (sector === 'tech') {
		ideas.push({
			title: 'SaaS B2B',
			description: 'Développez un outil SaaS résolvant un problème spécifique de votre industrie',
			potential: 'Très élevé'
		});
	}

	if (sector === 'sustainability') {
		ideas.push({
			title: 'Conseil en Transition Écologique',
			description: 'Accompagnez les PME dans leur démarche de développement durable',
			potential: 'Élevé'
		});
	}

	// Idées génériques basées sur les tendances
	ideas.push({
		title: 'Formation en Ligne',
		description: 'Créez des cours en ligne basés sur votre expertise unique',
		potential: 'Moyen'
	});

	ideas.push({
		title: 'Podcast Expert',
		description: 'Lancez un podcast qui vous positionne comme référence dans votre domaine',
		potential: 'Moyen'
	});

	return ideas.slice(0, 5);
}

// ============================================
// CV Parsing (Simplified)
// ============================================

async function parseCV(file, env) {
	// Pour une vraie implémentation, vous utiliseriez une API comme:
	// - OpenAI GPT-4 Vision
	// - Google Document AI
	// - Azure Form Recognizer
	// - Affinda CV Parser
	
	// Ici, simulation d'extraction
	const cvData = {
		skills: [],
		experience: [],
		education: [],
		yearsExperience: 0,
		rawText: '',
	};

	try {
		// Si c'est du texte, on peut faire une analyse basique
		if (file.type === 'text/plain') {
			const text = await file.text();
			cvData.rawText = text;
			
			// Extraction basique de compétences (mots-clés)
			const skillKeywords = [
				'javascript', 'python', 'java', 'react', 'angular', 'vue',
				'node', 'sql', 'aws', 'docker', 'kubernetes', 'agile', 'scrum',
				'management', 'leadership', 'communication', 'marketing',
				'sales', 'finance', 'analytics', 'data', 'ai', 'ml',
				'design', 'ux', 'ui', 'figma', 'photoshop',
			];
			
			const textLower = text.toLowerCase();
			skillKeywords.forEach(skill => {
				if (textLower.includes(skill)) {
					cvData.skills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
				}
			});
		}

		// Pour les PDF, on utiliserait une API externe
		// Exemple avec OpenAI (à implémenter avec votre clé API)
		if (file.type === 'application/pdf' && env.OPENAI_API_KEY) {
			// Conversion et analyse via OpenAI
			// cvData = await analyzeWithOpenAI(file, env);
		}

	} catch (error) {
		console.error('CV parsing error:', error);
	}

	return cvData;
}

// ============================================
// Email Service
// ============================================

async function sendEmail(to, subject, htmlContent, env) {
	// Utilisation de l'API Resend (ou SendGrid, Mailgun, etc.)
	if (!env.RESEND_API_KEY) {
		console.log('Email service not configured');
		return false;
	}

	try {
		const response = await fetch('https://api.resend.com/emails', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${env.RESEND_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				from: env.EMAIL_FROM || 'AI-Ikigai <noreply@ai-ikigai.com>',
				to: [to],
				subject: subject,
				html: htmlContent,
			}),
		});

		return response.ok;
	} catch (error) {
		console.error('Email sending error:', error);
		return false;
	}
}

// ============================================
// Stripe Payment
// ============================================

async function createStripeCheckout(priceId, userId, env) {
	if (!env.STRIPE_SECRET_KEY) {
		throw new Error('Stripe not configured');
	}

	const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: new URLSearchParams({
			'payment_method_types[]': 'card',
			'line_items[0][price]': priceId,
			'line_items[0][quantity]': '1',
			'mode': 'payment',
			'success_url': `${env.FRONTEND_URL}/questionnaire.html?payment=success&session_id={CHECKOUT_SESSION_ID}`,
			'cancel_url': `${env.FRONTEND_URL}/questionnaire.html?payment=cancelled`,
			'client_reference_id': userId,
			'metadata[userId]': userId,
		}),
	});

	const session = await response.json();
	return session;
}

async function handleStripeWebhook(request, env) {
	const signature = request.headers.get('stripe-signature');
	const body = await request.text();

	// Vérification de la signature Stripe (simplifié)
	// En production, utilisez la bibliothèque Stripe pour vérifier

	const event = JSON.parse(body);

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object;
		const userId = session.client_reference_id;

		// Mettre à jour le statut de l'utilisateur
		await env.DB.prepare(
			'UPDATE users SET plan = ?, payment_date = ? WHERE id = ?'
		).bind('premium', new Date().toISOString(), userId).run();

		// Envoyer l'email de confirmation
		const user = await env.DB.prepare('SELECT * FROM users WHERE id = ?').bind(userId).first();
		if (user) {
			await sendEmail(
				user.email,
				'Votre rapport Ikigai Premium est prêt !',
				`<h1>Merci pour votre achat !</h1><p>Votre rapport complet est maintenant disponible.</p>`,
				env
			);
		}
	}

	return jsonResponse({ received: true });
}

// ============================================
// API Routes
// ============================================

async function handleRequest(request, env) {
	const url = new URL(request.url);
	const path = url.pathname;
	const method = request.method;

	// Handle CORS preflight
	if (method === 'OPTIONS') {
		return new Response(null, { status: 204, headers: corsHeaders });
	}

	// Router
	try {
		// ============ Auth Routes ============
		
		// POST /api/auth/register
		if (path === '/api/auth/register' && method === 'POST') {
			const { email, password, name } = await request.json();
			
			if (!email || !password) {
				return errorResponse('Email et mot de passe requis');
			}

			// Vérifier si l'utilisateur existe
			const existing = await env.DB.prepare(
				'SELECT id FROM users WHERE email = ?'
			).bind(email.toLowerCase()).first();
			
			if (existing) {
				return errorResponse('Un compte existe déjà avec cet email');
			}

			// Créer l'utilisateur
			const userId = generateId();
			const hashedPassword = await hashPassword(password);
			
			await env.DB.prepare(
				'INSERT INTO users (id, email, password, name, plan, created_at) VALUES (?, ?, ?, ?, ?, ?)'
			).bind(userId, email.toLowerCase(), hashedPassword, name || '', 'free', new Date().toISOString()).run();

			const token = await generateToken(userId, env);

			// Envoyer email de bienvenue
			await sendEmail(
				email,
				'Bienvenue sur AI-Ikigai !',
				`<h1>Bienvenue ${name || ''} !</h1><p>Votre compte a été créé avec succès.</p>`,
				env
			);

			return jsonResponse({
				success: true,
				token,
				user: { id: userId, email, name, plan: 'free' }
			});
		}

		// POST /api/auth/login
		if (path === '/api/auth/login' && method === 'POST') {
			const { email, password } = await request.json();
			
			if (!email || !password) {
				return errorResponse('Email et mot de passe requis');
			}

			const user = await env.DB.prepare(
				'SELECT * FROM users WHERE email = ?'
			).bind(email.toLowerCase()).first();

			if (!user) {
				return errorResponse('Email ou mot de passe incorrect', 401);
			}

			const hashedPassword = await hashPassword(password);
			if (user.password !== hashedPassword) {
				return errorResponse('Email ou mot de passe incorrect', 401);
			}

			const token = await generateToken(user.id, env);

			return jsonResponse({
				success: true,
				token,
				user: { id: user.id, email: user.email, name: user.name, plan: user.plan }
			});
		}

		// GET /api/auth/me
		if (path === '/api/auth/me' && method === 'GET') {
			const user = await getAuthUser(request, env);
			if (!user) {
				return errorResponse('Non authentifié', 401);
			}

			return jsonResponse({
				success: true,
				user: { id: user.id, email: user.email, name: user.name, plan: user.plan }
			});
		}

		// ============ Questionnaire Routes ============

		// POST /api/questionnaire/submit
		if (path === '/api/questionnaire/submit' && method === 'POST') {
			const user = await getAuthUser(request, env);
			const body = await request.json();
			const { answers, email } = body;

			if (!answers || Object.keys(answers).length < 15) {
				return errorResponse('Toutes les réponses sont requises');
			}

			// Créer ou récupérer l'utilisateur si pas authentifié
			let userId = user?.id;
			if (!userId && email) {
				let existingUser = await env.DB.prepare(
					'SELECT id FROM users WHERE email = ?'
				).bind(email.toLowerCase()).first();

				if (!existingUser) {
					userId = generateId();
					await env.DB.prepare(
						'INSERT INTO users (id, email, plan, created_at) VALUES (?, ?, ?, ?)'
					).bind(userId, email.toLowerCase(), 'free', new Date().toISOString()).run();
				} else {
					userId = existingUser.id;
				}
			}

			if (!userId) {
				userId = generateId(); // Utilisateur anonyme
			}

			// Analyser les réponses
			const analysis = analyzeIkigai(answers);

			// Sauvegarder le questionnaire
			const questionnaireId = generateId();
			await env.DB.prepare(
				'INSERT INTO questionnaires (id, user_id, answers, analysis, created_at) VALUES (?, ?, ?, ?, ?)'
			).bind(
				questionnaireId,
				userId,
				JSON.stringify(answers),
				JSON.stringify(analysis),
				new Date().toISOString()
			).run();

			return jsonResponse({
				success: true,
				questionnaireId,
				analysis: {
					score: analysis.score,
					dominantProfile: analysis.dominantProfile,
					passions: analysis.passions.slice(0, 3),
					talents: analysis.talents.slice(0, 3),
					recommendations: analysis.recommendations.slice(0, 3),
				}
			});
		}

		// POST /api/questionnaire/upload-cv
		if (path === '/api/questionnaire/upload-cv' && method === 'POST') {
			const formData = await request.formData();
			const file = formData.get('cv');
			const questionnaireId = formData.get('questionnaireId');

			if (!file) {
				return errorResponse('Aucun fichier fourni');
			}

			// Vérifier le type de fichier
			const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
			if (!allowedTypes.includes(file.type)) {
				return errorResponse('Format de fichier non supporté');
			}

			// Vérifier la taille (max 10MB)
			if (file.size > 10 * 1024 * 1024) {
				return errorResponse('Fichier trop volumineux (max 10 Mo)');
			}

			// Parser le CV
			const cvData = await parseCV(file, env);

			// Sauvegarder dans R2 (storage)
			if (env.CV_BUCKET) {
				const filename = `${questionnaireId || generateId()}-${Date.now()}.${file.type.split('/')[1]}`;
				await env.CV_BUCKET.put(filename, file.stream(), {
					httpMetadata: { contentType: file.type }
				});
			}

			// Mettre à jour le questionnaire avec les données CV
			if (questionnaireId) {
				const questionnaire = await env.DB.prepare(
					'SELECT analysis FROM questionnaires WHERE id = ?'
				).bind(questionnaireId).first();

				if (questionnaire) {
					const analysis = JSON.parse(questionnaire.analysis);
					const updatedAnalysis = analyzeIkigai(
						JSON.parse((await env.DB.prepare('SELECT answers FROM questionnaires WHERE id = ?').bind(questionnaireId).first()).answers),
						cvData
					);

					await env.DB.prepare(
						'UPDATE questionnaires SET cv_data = ?, analysis = ? WHERE id = ?'
					).bind(JSON.stringify(cvData), JSON.stringify(updatedAnalysis), questionnaireId).run();
				}
			}

			return jsonResponse({
				success: true,
				cvData: {
					skills: cvData.skills,
					experienceCount: cvData.experience.length,
				}
			});
		}

		// GET /api/questionnaire/:id
		if (path.startsWith('/api/questionnaire/') && method === 'GET') {
			const id = path.split('/').pop();
			const user = await getAuthUser(request, env);

			const questionnaire = await env.DB.prepare(
				'SELECT * FROM questionnaires WHERE id = ?'
			).bind(id).first();

			if (!questionnaire) {
				return errorResponse('Questionnaire non trouvé', 404);
			}

			// Vérifier l'accès (propriétaire ou premium)
			const analysis = JSON.parse(questionnaire.analysis);
			const isOwner = user && questionnaire.user_id === user.id;
			const isPremium = user && user.plan !== 'free';

			// Version limitée pour les non-premium
			if (!isPremium) {
				return jsonResponse({
					success: true,
					questionnaire: {
						id: questionnaire.id,
						createdAt: questionnaire.created_at,
						analysis: {
							score: analysis.score,
							dominantProfile: analysis.dominantProfile,
							passions: analysis.passions.slice(0, 3),
							talents: analysis.talents.slice(0, 3),
							recommendations: analysis.recommendations.slice(0, 3),
						},
						isPremium: false
					}
				});
			}

			// Version complète pour premium
			return jsonResponse({
				success: true,
				questionnaire: {
					id: questionnaire.id,
					createdAt: questionnaire.created_at,
					answers: JSON.parse(questionnaire.answers),
					analysis: analysis,
					cvData: questionnaire.cv_data ? JSON.parse(questionnaire.cv_data) : null,
					isPremium: true
				}
			});
		}

		// ============ Payment Routes ============

		// POST /api/payment/create-checkout
		if (path === '/api/payment/create-checkout' && method === 'POST') {
			const user = await getAuthUser(request, env);
			if (!user) {
				return errorResponse('Authentification requise', 401);
			}

			const { plan } = await request.json();
			
			const prices = {
				'essential': env.STRIPE_PRICE_ESSENTIAL,
				'premium': env.STRIPE_PRICE_PREMIUM,
			};

			if (!prices[plan]) {
				return errorResponse('Plan invalide');
			}

			const session = await createStripeCheckout(prices[plan], user.id, env);

			return jsonResponse({
				success: true,
				checkoutUrl: session.url
			});
		}

		// POST /api/payment/webhook
		if (path === '/api/payment/webhook' && method === 'POST') {
			return handleStripeWebhook(request, env);
		}

		// ============ Newsletter Routes ============

		// POST /api/newsletter/subscribe
		if (path === '/api/newsletter/subscribe' && method === 'POST') {
			const { email } = await request.json();

			if (!email || !email.includes('@')) {
				return errorResponse('Email invalide');
			}

			// Vérifier si déjà inscrit
			const existing = await env.DB.prepare(
				'SELECT id FROM newsletter WHERE email = ?'
			).bind(email.toLowerCase()).first();

			if (existing) {
				return jsonResponse({ success: true, message: 'Déjà inscrit' });
			}

			// Inscrire
			await env.DB.prepare(
				'INSERT INTO newsletter (id, email, subscribed_at) VALUES (?, ?, ?)'
			).bind(generateId(), email.toLowerCase(), new Date().toISOString()).run();

			// Envoyer email de confirmation
			await sendEmail(
				email,
				'Inscription confirmée - AI-Ikigai',
				`<h1>Merci pour votre inscription !</h1><p>Vous serez notifié du lancement de notre offre entreprise.</p>`,
				env
			);

			return jsonResponse({
				success: true,
				message: 'Inscription réussie'
			});
		}

		// ============ Health Check ============
		if (path === '/api/health' && method === 'GET') {
			return jsonResponse({
				status: 'ok',
				timestamp: new Date().toISOString()
			});
		}

		// 404 for unknown routes
		return errorResponse('Route non trouvée', 404);

	} catch (error) {
		console.error('API Error:', error);
		return errorResponse('Erreur interne du serveur', 500);
	}
}

// ============================================
// Export
// ============================================

export default {
	async fetch(request, env, ctx) {
		return handleRequest(request, env);
	},
};
