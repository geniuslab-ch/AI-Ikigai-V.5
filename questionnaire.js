/**
 * AI-IKIGAI - Questionnaire JavaScript
 */

// Questions Data
const questions = [
    {
        id: 1,
        category: "passion",
        categoryLabel: "Passions",
        categoryIcon: "❤️",
        text: "Quelles activités vous font perdre la notion du temps ?",
        hint: "Pensez aux moments où vous êtes tellement absorbé que les heures passent sans que vous vous en rendiez compte.",
        type: "multi-select",
        maxSelect: 3,
        options: [
            { value: "create", text: "Créer, concevoir, inventer", emoji: "🎨" },
            { value: "analyze", text: "Analyser, résoudre des problèmes", emoji: "🧩" },
            { value: "teach", text: "Enseigner, transmettre, mentorer", emoji: "📚" },
            { value: "connect", text: "Connecter les gens, réseauter", emoji: "🤝" },
            { value: "build", text: "Construire, développer des projets", emoji: "🏗️" },
            { value: "explore", text: "Explorer, découvrir, apprendre", emoji: "🔍" }
        ]
    },
    {
        id: 2,
        category: "passion",
        categoryLabel: "Passions",
        categoryIcon: "❤️",
        text: "Dans quel domaine pourriez-vous parler pendant des heures ?",
        hint: "Quel sujet vous passionne au point d'en oublier le temps ?",
        type: "single",
        options: [
            { value: "tech", text: "Technologie et innovation", emoji: "💻" },
            { value: "art", text: "Art, design et créativité", emoji: "🎭" },
            { value: "business", text: "Business et entrepreneuriat", emoji: "📈" },
            { value: "science", text: "Sciences et recherche", emoji: "🔬" },
            { value: "social", text: "Causes sociales et humanitaires", emoji: "🌍" },
            { value: "health", text: "Santé et bien-être", emoji: "🧘" }
        ]
    },
    {
        id: 3,
        category: "passion",
        categoryLabel: "Passions",
        categoryIcon: "❤️",
        text: "Qu'est-ce qui vous motive le plus au réveil ?",
        hint: "Quelle perspective vous donne envie de commencer la journée ?",
        type: "single",
        options: [
            { value: "challenge", text: "Relever de nouveaux défis", emoji: "🎯" },
            { value: "impact", text: "Avoir un impact positif", emoji: "✨" },
            { value: "learn", text: "Apprendre quelque chose de nouveau", emoji: "📖" },
            { value: "create", text: "Créer et innover", emoji: "💡" },
            { value: "team", text: "Travailler avec mon équipe", emoji: "👥" },
            { value: "freedom", text: "Ma liberté et autonomie", emoji: "🦅" }
        ]
    },
    {
        id: 4,
        category: "passion",
        categoryLabel: "Passions",
        categoryIcon: "❤️",
        text: "Quel type de contenu consommez-vous le plus ?",
        hint: "Podcasts, livres, vidéos... Qu'est-ce qui capte votre attention ?",
        type: "multi-select",
        maxSelect: 2,
        options: [
            { value: "business", text: "Business et entrepreneuriat", emoji: "💼" },
            { value: "tech", text: "Tech et innovation", emoji: "🚀" },
            { value: "dev-perso", text: "Développement personnel", emoji: "🧠" },
            { value: "creative", text: "Créativité et design", emoji: "🎨" },
            { value: "science", text: "Sciences et découvertes", emoji: "🔭" },
            { value: "culture", text: "Culture et société", emoji: "📰" }
        ]
    },
    {
        id: 5,
        category: "talent",
        categoryLabel: "Talents",
        categoryIcon: "⭐",
        text: "Pour quoi vos proches vous demandent-ils souvent de l'aide ?",
        hint: "Ce que les autres reconnaissent en vous est souvent un talent naturel.",
        type: "multi-select",
        maxSelect: 3,
        options: [
            { value: "advice", text: "Donner des conseils", emoji: "💬" },
            { value: "organize", text: "Organiser et planifier", emoji: "📋" },
            { value: "tech", text: "Résoudre des problèmes techniques", emoji: "🔧" },
            { value: "creative", text: "Proposer des idées créatives", emoji: "💡" },
            { value: "mediate", text: "Gérer des conflits", emoji: "🤝" },
            { value: "motivate", text: "Motiver et encourager", emoji: "🔥" }
        ]
    },
    {
        id: 6,
        category: "talent",
        categoryLabel: "Talents",
        categoryIcon: "⭐",
        text: "Quelle compétence maîtrisez-vous naturellement ?",
        hint: "Ce qui vous semble facile peut être difficile pour d'autres.",
        type: "single",
        options: [
            { value: "communication", text: "Communication et expression", emoji: "🎤" },
            { value: "analysis", text: "Analyse et réflexion stratégique", emoji: "📊" },
            { value: "creativity", text: "Créativité et innovation", emoji: "🎨" },
            { value: "leadership", text: "Leadership et influence", emoji: "👑" },
            { value: "empathy", text: "Écoute et empathie", emoji: "💝" },
            { value: "execution", text: "Exécution et rigueur", emoji: "⚡" }
        ]
    },
    {
        id: 7,
        category: "talent",
        categoryLabel: "Talents",
        categoryIcon: "⭐",
        text: "Comment apprenez-vous le mieux ?",
        hint: "Comprendre votre style d'apprentissage révèle vos forces cognitives.",
        type: "single",
        options: [
            { value: "practice", text: "En pratiquant et expérimentant", emoji: "🛠️" },
            { value: "read", text: "En lisant et analysant", emoji: "📚" },
            { value: "watch", text: "En observant et imitant", emoji: "👀" },
            { value: "discuss", text: "En discutant et débattant", emoji: "💭" },
            { value: "teach", text: "En enseignant aux autres", emoji: "🎓" },
            { value: "create", text: "En créant des projets", emoji: "🏗️" }
        ]
    },
    {
        id: 8,
        category: "talent",
        categoryLabel: "Talents",
        categoryIcon: "⭐",
        text: "Dans quel rôle excellez-vous en équipe ?",
        hint: "Votre position naturelle dans un groupe révèle vos talents relationnels.",
        type: "single",
        options: [
            { value: "leader", text: "Le leader qui guide", emoji: "🎯" },
            { value: "creative", text: "Le créatif qui propose", emoji: "💡" },
            { value: "analyst", text: "L'analyste qui approfondit", emoji: "🔍" },
            { value: "harmonizer", text: "Le médiateur qui unit", emoji: "🤝" },
            { value: "executor", text: "L'exécutant qui concrétise", emoji: "⚡" },
            { value: "challenger", text: "Le challenger qui questionne", emoji: "🎭" }
        ]
    },
    {
        id: 9,
        category: "values",
        categoryLabel: "Valeurs",
        categoryIcon: "🎯",
        text: "Quelle valeur est non-négociable pour vous au travail ?",
        hint: "Ce qui vous ferait quitter un emploi même bien payé.",
        type: "single",
        options: [
            { value: "freedom", text: "Liberté et autonomie", emoji: "🦅" },
            { value: "impact", text: "Impact et sens", emoji: "🌟" },
            { value: "growth", text: "Croissance et apprentissage", emoji: "📈" },
            { value: "respect", text: "Respect et reconnaissance", emoji: "🙏" },
            { value: "balance", text: "Équilibre vie pro/perso", emoji: "⚖️" },
            { value: "creativity", text: "Créativité et expression", emoji: "🎨" }
        ]
    },
    {
        id: 10,
        category: "values",
        categoryLabel: "Valeurs",
        categoryIcon: "🎯",
        text: "Quel type d'environnement de travail vous correspond ?",
        hint: "L'environnement idéal pour donner le meilleur de vous-même.",
        type: "single",
        options: [
            { value: "startup", text: "Startup dynamique et agile", emoji: "🚀" },
            { value: "corporate", text: "Grande entreprise structurée", emoji: "🏢" },
            { value: "remote", text: "Télétravail / Nomade digital", emoji: "🌴" },
            { value: "social", text: "ONG / Économie sociale", emoji: "💚" },
            { value: "freelance", text: "Indépendant / Freelance", emoji: "🎯" },
            { value: "creative", text: "Agence créative", emoji: "🎨" }
        ]
    },
    {
        id: 11,
        category: "values",
        categoryLabel: "Valeurs",
        categoryIcon: "🎯",
        text: "Comment définissez-vous le succès ?",
        hint: "Votre vision du succès guide vos choix de carrière.",
        type: "single",
        options: [
            { value: "wealth", text: "Liberté financière", emoji: "💰" },
            { value: "impact", text: "Impact positif sur le monde", emoji: "🌍" },
            { value: "recognition", text: "Reconnaissance et influence", emoji: "🏆" },
            { value: "mastery", text: "Excellence dans mon domaine", emoji: "🎯" },
            { value: "balance", text: "Vie épanouie et équilibrée", emoji: "🧘" },
            { value: "freedom", text: "Liberté totale de mes choix", emoji: "🦋" }
        ]
    },
    {
        id: 12,
        category: "values",
        categoryLabel: "Valeurs",
        categoryIcon: "🎯",
        text: "Quelle cause vous tient le plus à cœur ?",
        hint: "Ce pour quoi vous seriez prêt à vous engager bénévolement.",
        type: "single",
        options: [
            { value: "education", text: "Éducation et accès au savoir", emoji: "📚" },
            { value: "environment", text: "Environnement et durabilité", emoji: "🌱" },
            { value: "equality", text: "Égalité et inclusion", emoji: "⚖️" },
            { value: "health", text: "Santé et bien-être", emoji: "❤️" },
            { value: "innovation", text: "Innovation et progrès", emoji: "🚀" },
            { value: "community", text: "Communauté locale", emoji: "🏘️" }
        ]
    },
    {
        id: 13,
        category: "market",
        categoryLabel: "Marché",
        categoryIcon: "💼",
        text: "Quel secteur vous attire le plus actuellement ?",
        hint: "Où voyez-vous les meilleures opportunités pour vous ?",
        type: "single",
        options: [
            { value: "tech", text: "Tech & Digital", emoji: "💻" },
            { value: "health", text: "Santé & Biotech", emoji: "🧬" },
            { value: "sustainability", text: "Développement durable", emoji: "🌿" },
            { value: "finance", text: "Finance & Fintech", emoji: "📊" },
            { value: "education", text: "Éducation & Formation", emoji: "🎓" },
            { value: "creative", text: "Industries créatives", emoji: "🎬" }
        ]
    },
    {
        id: 14,
        category: "market",
        categoryLabel: "Marché",
        categoryIcon: "💼",
        text: "Quel niveau de risque êtes-vous prêt à prendre ?",
        hint: "Votre appétit pour le risque influence vos choix professionnels.",
        type: "scale",
        labels: ["Sécurité max", "Équilibré", "Risque élevé"],
        options: [
            { value: 1, label: "Très prudent" },
            { value: 2, label: "Prudent" },
            { value: 3, label: "Modéré" },
            { value: 4, label: "Audacieux" },
            { value: 5, label: "Très audacieux" }
        ]
    },
    {
        id: 15,
        category: "market",
        categoryLabel: "Marché",
        categoryIcon: "💼",
        text: "Si vous pouviez créer votre activité idéale, ce serait...",
        hint: "Décrivez en quelques mots votre vision du travail parfait.",
        type: "text",
        placeholder: "Ex: Accompagner les startups tech dans leur stratégie de croissance tout en formant la prochaine génération de leaders..."
    }
];

// State
let currentQuestion = 0;
let answers = {};
let uploadedFile = null;

// DOM Elements
const questionsContainer = document.getElementById('questions-container');
const cvUploadSection = document.getElementById('cv-upload-section');
const analyzingSection = document.getElementById('analyzing-section');
const resultsSection = document.getElementById('results-section');
const progressSection = document.getElementById('progress-section');
const progressFill = document.getElementById('progress-fill');
const progressPercent = document.getElementById('progress-percent');
const currentQEl = document.getElementById('current-q');
const uploadZone = document.getElementById('upload-zone');
const cvInput = document.getElementById('cv-input');
const filePreview = document.getElementById('file-preview');
const fileName = document.getElementById('file-name');
const fileSize = document.getElementById('file-size');
const fileRemove = document.getElementById('file-remove');

// Initialize
function init() {
    loadSavedProgress();
    renderQuestion();
    setupCVUpload();
}

// Save progress to localStorage
function saveProgress() {
    const data = {
        currentQuestion,
        answers,
        timestamp: Date.now()
    };
    localStorage.setItem('ai-ikigai-progress', JSON.stringify(data));
}

// Load saved progress
function loadSavedProgress() {
    try {
        const saved = localStorage.getItem('ai-ikigai-progress');
        if (saved) {
            const data = JSON.parse(saved);
            // Only restore if less than 24 hours old
            if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
                answers = data.answers || {};
                // Don't restore question position, let user start fresh
            }
        }
    } catch (e) {
        console.error('Error loading progress:', e);
    }
}

// Render Question
function renderQuestion() {
    if (currentQuestion >= questions.length) {
        showCVUpload();
        return;
    }

    const q = questions[currentQuestion];
    updateProgress();
    updateCategoryPills(q.category);

    let optionsHTML = '';

    if (q.type === 'single' || q.type === 'multi-select') {
        const multiClass = q.type === 'multi-select' ? 'multi-select' : '';
        const multiHint = q.type === 'multi-select' ? 
            `<div class="multi-select-hint">
                <span>ℹ️</span>
                <span>Sélectionnez jusqu'à ${q.maxSelect} réponses</span>
            </div>` : '';

        optionsHTML = `
            ${multiHint}
            <div class="options-grid ${multiClass}">
                ${q.options.map(opt => `
                    <button class="option-btn ${isSelected(q.id, opt.value) ? 'selected' : ''}" 
                            onclick="selectOption(${q.id}, '${opt.value}', '${q.type}', ${q.maxSelect || 1})">
                        <div class="option-indicator"></div>
                        <span class="option-text">${opt.text}</span>
                        <span class="option-emoji">${opt.emoji}</span>
                    </button>
                `).join('')}
            </div>
        `;
    } else if (q.type === 'scale') {
        optionsHTML = `
            <div class="scale-options">
                ${q.options.map(opt => `
                    <button class="scale-btn ${isSelected(q.id, opt.value) ? 'selected' : ''}"
                            onclick="selectOption(${q.id}, ${opt.value}, 'single', 1)">
                        <span class="scale-value">${opt.value}</span>
                        <span class="scale-label">${opt.label}</span>
                    </button>
                `).join('')}
            </div>
            <div class="scale-labels">
                <span>${q.labels[0]}</span>
                <span>${q.labels[1]}</span>
                <span>${q.labels[2]}</span>
            </div>
        `;
    } else if (q.type === 'text') {
        const currentValue = answers[q.id] || '';
        optionsHTML = `
            <textarea class="text-answer" 
                      id="text-answer-${q.id}"
                      placeholder="${q.placeholder}"
                      oninput="handleTextInput(${q.id}, this.value)">${currentValue}</textarea>
            <div class="char-count"><span id="char-count-${q.id}">${currentValue.length}</span> / 500 caractères</div>
        `;
    }

    questionsContainer.innerHTML = `
        <div class="question-card">
            <div class="question-meta">
                <span class="question-category">
                    <span>${q.categoryIcon}</span>
                    ${q.categoryLabel}
                </span>
                <span class="question-number">Question ${q.id}/15</span>
            </div>
            <h2 class="question-text">${q.text}</h2>
            <p class="question-hint">${q.hint}</p>
            ${optionsHTML}
            <div class="nav-buttons">
                ${currentQuestion > 0 ? 
                    `<button class="btn btn-back" onclick="goToPreviousQuestion()">← Retour</button>` : 
                    '<div></div>'
                }
                <button class="btn btn-next" onclick="goToNextQuestion()" ${!hasAnswer(q.id) ? 'disabled' : ''}>
                    ${currentQuestion === questions.length - 1 ? 'Continuer' : 'Suivant'} →
                </button>
            </div>
        </div>
    `;
}

// Check if option is selected
function isSelected(questionId, value) {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
        return answer.includes(value);
    }
    return answer === value;
}

// Check if question has answer
function hasAnswer(questionId) {
    const answer = answers[questionId];
    if (Array.isArray(answer)) {
        return answer.length > 0;
    }
    return answer !== undefined && answer !== '';
}

// Select Option
function selectOption(questionId, value, type, maxSelect) {
    if (type === 'multi-select') {
        if (!answers[questionId]) {
            answers[questionId] = [];
        }
        const index = answers[questionId].indexOf(value);
        if (index > -1) {
            answers[questionId].splice(index, 1);
        } else if (answers[questionId].length < maxSelect) {
            answers[questionId].push(value);
        }
    } else {
        answers[questionId] = value;
    }
    saveProgress();
    renderQuestion();
}

// Handle Text Input
function handleTextInput(questionId, value) {
    if (value.length <= 500) {
        answers[questionId] = value;
        document.getElementById(`char-count-${questionId}`).textContent = value.length;
        saveProgress();
    }
    updateNextButton(questionId);
}

// Update Next Button
function updateNextButton(questionId) {
    const nextBtn = document.querySelector('.btn-next');
    if (nextBtn) {
        nextBtn.disabled = !hasAnswer(questionId);
    }
}

// Navigation
function goToNextQuestion() {
    if (currentQuestion < questions.length - 1) {
        currentQuestion++;
        saveProgress();
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
        showCVUpload();
    }
}

function goToPreviousQuestion() {
    if (cvUploadSection.classList.contains('active')) {
        cvUploadSection.classList.remove('active');
        questionsContainer.style.display = 'block';
        currentQuestion = questions.length - 1;
        renderQuestion();
    } else if (currentQuestion > 0) {
        currentQuestion--;
        saveProgress();
        renderQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

// Update Progress
function updateProgress() {
    const progress = ((currentQuestion + 1) / questions.length) * 100;
    progressFill.style.width = `${progress}%`;
    progressPercent.textContent = `${Math.round(progress)}%`;
    currentQEl.textContent = currentQuestion + 1;
}

// Update Category Pills
function updateCategoryPills(currentCategory) {
    const pills = document.querySelectorAll('.category-pill');
    const categories = ['passion', 'talent', 'values', 'market'];
    const currentIndex = categories.indexOf(currentCategory);

    pills.forEach((pill, index) => {
        pill.classList.remove('active', 'completed');
        if (index < currentIndex) {
            pill.classList.add('completed');
        } else if (index === currentIndex) {
            pill.classList.add('active');
        }
    });
}

// Show CV Upload
function showCVUpload() {
    questionsContainer.style.display = 'none';
    cvUploadSection.classList.add('active');
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    currentQEl.textContent = '15';
    
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.classList.remove('active');
        pill.classList.add('completed');
    });
}

// Setup CV Upload
function setupCVUpload() {
    // Click to upload
    uploadZone.addEventListener('click', () => {
        cvInput.click();
    });

    // File input change
    cvInput.addEventListener('change', (e) => {
        handleFile(e.target.files[0]);
    });

    // Drag and drop
    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
        uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFile(e.dataTransfer.files[0]);
    });

    // Remove file
    fileRemove.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFile();
    });
}

// Handle File
function handleFile(file) {
    if (!file) return;

    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
        alert('Format non supporté. Veuillez télécharger un PDF ou un document Word.');
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        alert('Le fichier est trop volumineux. Maximum 10 Mo.');
        return;
    }

    uploadedFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    filePreview.classList.add('visible');
    uploadZone.classList.add('has-file');
    uploadZone.querySelector('.upload-icon').textContent = '✅';
    uploadZone.querySelector('.upload-title').textContent = 'CV téléchargé avec succès';
    uploadZone.querySelector('.upload-subtitle').textContent = 'Cliquez pour remplacer le fichier';
}

// Format File Size
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' o';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
    return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

// Remove File
function removeFile() {
    uploadedFile = null;
    cvInput.value = '';
    filePreview.classList.remove('visible');
    uploadZone.classList.remove('has-file');
    uploadZone.querySelector('.upload-icon').textContent = '📄';
    uploadZone.querySelector('.upload-title').textContent = 'Glissez-déposez votre CV ici';
    uploadZone.querySelector('.upload-subtitle').textContent = 'ou cliquez pour parcourir vos fichiers';
}

// Start Analysis
async function startAnalysis() {
    cvUploadSection.classList.remove('active');
    progressSection.style.display = 'none';
    analyzingSection.classList.add('active');

    // Clear saved progress
    localStorage.removeItem('ai-ikigai-progress');

    // Submit to backend
    const backendResult = await submitToBackend();

    // Upload CV if present
    if (uploadedFile) {
        await uploadCVToBackend(uploadedFile);
    }

    // Animate steps
    const steps = ['step-1', 'step-2', 'step-3', 'step-4'];
    let currentStep = 0;

    function animateStep() {
        if (currentStep > 0) {
            document.getElementById(steps[currentStep - 1]).classList.remove('active');
            document.getElementById(steps[currentStep - 1]).classList.add('completed');
            document.getElementById(steps[currentStep - 1]).querySelector('.step-indicator').textContent = '✓';
        }

        if (currentStep < steps.length) {
            document.getElementById(steps[currentStep]).classList.add('active');
            currentStep++;
            setTimeout(animateStep, 1500);
        } else {
            setTimeout(() => showResults(backendResult?.analysis), 1000);
        }
    }

    setTimeout(animateStep, 500);
}

// Show Results
function showResults(backendAnalysis = null) {
    analyzingSection.classList.remove('active');
    resultsSection.classList.add('active');

    // If we have backend analysis, update the displayed results
    if (backendAnalysis) {
        // Update passions
        const passionTags = document.querySelector('.result-card.passion .result-tags');
        if (passionTags && backendAnalysis.passions) {
            passionTags.innerHTML = backendAnalysis.passions.map(p => 
                `<span class="result-tag">${p}</span>`
            ).join('');
        }

        // Update talents
        const talentTags = document.querySelector('.result-card.profession .result-tags');
        if (talentTags && backendAnalysis.talents) {
            talentTags.innerHTML = backendAnalysis.talents.map(t => 
                `<span class="result-tag">${t}</span>`
            ).join('');
        }

        // Update recommendations
        if (backendAnalysis.recommendations) {
            const recommendationsList = document.querySelector('.recommendations');
            if (recommendationsList) {
                const recsHTML = backendAnalysis.recommendations.map((rec, i) => `
                    <div class="recommendation-item">
                        <div class="recommendation-number">${i + 1}</div>
                        <div class="recommendation-content">
                            <h4>${rec.title}</h4>
                            <p>${rec.description}</p>
                        </div>
                    </div>
                `).join('');
                
                recommendationsList.innerHTML = `
                    <h3>🎯 Recommandations de carrière</h3>
                    ${recsHTML}
                `;
            }
        }
    }

    // Animate result cards
    const cards = document.querySelectorAll('.result-card, .recommendation-item');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 200 + index * 100);
    });
}

// ============================================
// API Integration
// ============================================

// Submit answers to backend
async function submitToBackend() {
    try {
        // Check if API is available
        if (typeof QuestionnaireAPI !== 'undefined') {
            const userEmail = localStorage.getItem('ai-ikigai-email');
            const result = await QuestionnaireAPI.submit(answers, userEmail);
            
            if (result.success) {
                console.log('✅ Questionnaire submitted:', result.questionnaireId);
                return result;
            }
        }
    } catch (error) {
        console.error('API submission error:', error);
    }
    return null;
}

// Upload CV to backend
async function uploadCVToBackend(file) {
    try {
        if (typeof QuestionnaireAPI !== 'undefined') {
            const result = await QuestionnaireAPI.uploadCV(file);
            
            if (result.success) {
                console.log('✅ CV uploaded:', result.cvData);
                return result;
            }
        }
    } catch (error) {
        console.error('CV upload error:', error);
    }
    return null;
}

// Handle payment button click
async function handlePayment(plan) {
    try {
        if (typeof PaymentAPI !== 'undefined') {
            await PaymentAPI.createCheckout(plan);
        } else {
            alert('Le système de paiement n\'est pas encore configuré.');
        }
    } catch (error) {
        console.error('Payment error:', error);
        alert('Erreur lors du paiement. Veuillez réessayer.');
    }
}

// Check payment status on page load
function checkPaymentOnLoad() {
    if (typeof PaymentAPI !== 'undefined') {
        const status = PaymentAPI.checkPaymentStatus();
        if (status) {
            if (status.success) {
                // Show success message and unlock premium content
                console.log('✅ Payment successful!');
                localStorage.setItem('ai-ikigai-premium', 'true');
            } else if (status.cancelled) {
                console.log('❌ Payment cancelled');
            }
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    init();
    checkPaymentOnLoad();
});
