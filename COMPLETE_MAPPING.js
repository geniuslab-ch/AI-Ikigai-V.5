// COMPLETE MAPPING - Based on questionnaire.html analysis
// All values extracted from questions 1-15

const COMPLETE_MAPPING = {
    // Question 1: Activités qui font perdre notion du temps (PASSION)
    'create': { label: 'Créer, concevoir', category: 'passion', score: 25 },
    'analyze': { label: 'Analyser', category: 'profession', score: 20 },
    'teach': { label: 'Enseigner, transmettre', category: 'mission', score: 30 },
    'connect': { label: 'Connecter les gens', category: 'passion', score: 20 },
    'build': { label: 'Construire', category: 'profession', score: 25 },
    'explore': { label: 'Explorer, découvrir', category: 'passion', score: 20 },

    // Question 2: Domaine de passion (PASSION)
    'tech': { label: 'Technologie', category: 'profession', score: 20 },
    'art': { label: 'Art et créativité', category: 'passion', score: 25 },
    'business': { label: 'Business', category: 'vocation', score: 20 },
    'science': { label: 'Sciences', category: 'profession', score: 20 },
    'social': { label: 'Causes sociales', category: 'mission', score: 30 },
    'health': { label: 'Santé et bien-être', category: 'mission', score: 25 },

    // Question 3: Motivation au réveil (PASSION)
    'challenge': { label: 'Relever défis', category: 'passion', score: 20 },
    'impact': { label: 'Impact positif', category: 'mission', score: 30 },
    'learn': { label: 'Apprentissage', category: 'passion', score: 20 },
    'team': { label: 'Travail d\'équipe', category: 'profession', score: 15 },
    'freedom': { label: 'Liberté', category: 'passion', score: 25 },

    // Question 4: Type de contenu consommé (PASSION)
    'dev-perso': { label: 'Développement personnel', category: 'passion', score: 15 },
    'creative': { label: 'Créativité', category: 'passion', score: 25 },
    'culture': { label: 'Culture', category: 'passion', score: 15 },

    // Question 5: Aide demandée par proches (TALENT)
    'advice': { label: 'Conseils', category: 'profession', score: 20 },
    'organize': { label: 'Organisation', category: 'profession', score: 20 },
    'mediate': { label: 'Médiation', category: 'profession', score: 20 },
    'motivate': { label: 'Motivation', category: 'mission', score: 25 },

    // Question 6: Compétence naturelle (TALENT)
    'communication': { label: 'Communication', category: 'profession', score: 20 },
    'analysis': { label: 'Analyse stratégique', category: 'profession', score: 25 },
    'creativity': { label: 'Créativité', category: 'passion', score: 25 },
    'leadership': { label: 'Leadership', category: 'profession', score: 25 },
    'empathy': { label: 'Empathie', category: 'mission', score: 25 },
    'execution': { label: 'Exécution', category: 'profession', score: 20 },

    // Question 7: Style d'apprentissage (TALENT)
    'practice': { label: 'Pratique', category: 'profession', score: 20 },
    'read': { label: 'Lecture', category: 'profession', score: 15 },
    'watch': { label: 'Observation', category: 'profession', score: 15 },
    'discuss': { label: 'Discussion', category: 'profession', score: 15 },

    // Question 8: Rôle en équipe (TALENT)
    'leader': { label: 'Leader', category: 'profession', score: 25 },
    'analyst': { label: 'Analyste', category: 'profession', score: 20 },
    'harmonizer': { label: 'Médiateur', category: 'mission', score: 25 },
    'executor': { label: 'Exécutant', category: 'profession', score: 20 },
    'challenger': { label: 'Challenger', category: 'passion', score: 20 },

    // Question 9: Valeur non-négociable (VALUES)
    'growth': { label: 'Croissance', category: 'passion', score: 20 },
    'respect': { label: 'Respect', category: 'mission', score: 20 },
    'balance': { label: 'Équilibre', category: 'vocation', score: 15 },

    // Question 10: Environnement de travail (VALUES)
    'startup': { label: 'Startup', category: 'vocation', score: 25 },
    'corporate': { label: 'Grande entreprise', category: 'vocation', score: 15 },
    'remote': { label: 'Télétravail', category: 'vocation', score: 15 },
    'freelance': { label: 'Freelance', category: 'vocation', score: 25 },

    // Question 11: Définition du succès (VALUES)
    'wealth': { label: 'Liberté financière', category: 'vocation', score: 25 },
    'recognition': { label: 'Reconnaissance', category: 'vocation', score: 20 },
    'mastery': { label: 'Excellence', category: 'profession', score: 25 },

    // Question 12: Cause importante (VALUES)
    'education': { label: 'Éducation', category: 'mission', score: 30 },
    'environment': { label: 'Environnement', category: 'mission', score: 30 },
    'equality': { label: 'Égalité', category: 'mission', score: 30 },
    'innovation': { label: 'Innovation', category: 'vocation', score: 25 },
    'community': { label: 'Communauté', category: 'mission', score: 25 },

    // Question 13: Secteur attirant (MARKET)
    'sustainability': { label: 'Développement durable', category: 'mission', score: 25 },
    'finance': { label: 'Finance', category: 'vocation', score: 20 },

    // Question 14: Niveau de risque (MARKET)
    // Valeurs numériques 1-5 traités différemment

    // Question 15: Activité idéale (TEXT)
    // Texte libre, analysé par Claude
};

// Valeurs par catégorie Ikigai :
// PASSION: create, connect, explore, art, challenge, learn, freedom, dev-perso, creative, culture, creativity, growth, challenger
// PROFESSION: analyze, build, tech, science, team, advice, organize, mediate, communication, analysis, leadership, execution, practice, read, watch, discuss, leader, analyst, executor, mastery
// MISSION: teach, social, health, impact, motivate, empathy, harmonizer, respect, education, environment, equality, community, sustainability
// VOCATION: business, balance, startup, corporate, remote, freelance, wealth, recognition, innovation, finance
