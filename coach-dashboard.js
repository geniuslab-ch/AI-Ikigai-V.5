/**
 * AI-IKIGAI - Coach Dashboard JavaScript
 * Gestion du tableau de bord coach avec liste clients et profils
 */

// =============================================
// Configuration
// =============================================

const CoachDashboard = {
    // Données du coach
    coachData: null,

    // Liste des clients
    clients: [],

    // Filtres actifs
    filters: {
        search: '',
        status: 'all',
        score: 'all'
    },

    // Client actuellement affiché
    currentClient: null
};

// =============================================
// Initialisation
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Coach Dashboard initialization...');

    // Vérifier l'authentification avec Supabase
    const user = await checkAuth('coach');
    if (!user) {
        console.log('Coach not authenticated or wrong role');
        return;
    }

    // Stocker les données du coach
    CoachDashboard.coachData = user;

    // Charger les données
    await loadDashboardData();

    // Initialiser les animations
    initAnimations();
});

// =============================================
// Chargement des données
// =============================================

async function loadDashboardData() {
    try {
        showLoadingState();

        // Afficher les informations du coach (déjà chargées via checkAuth)
        updateCoachInfo(CoachDashboard.coachData);

        // Récupérer la liste des clients depuis Supabase
        // TODO: Implémenter la vraie requête coach_clients
        CoachDashboard.clients = await loadClients();

        // Mettre à jour les statistiques
        updateStats(CoachDashboard.clients);

        // Afficher la liste des clients
        renderClientsTable(CoachDashboard.clients);

        hideLoadingState();
    } catch (error) {
        console.error('Error loading coach dashboard:', error);
        alert('Erreur lors du chargement du tableau de bord. Veuillez réessayer.');
        hideLoadingState();
    }
}

async function loadClients() {
    try {
        // Charger les relations coach-client
        const { data: relations, error: relError } = await supabaseClient
            .from('coach_clients')
            .select('id, status, added_at, notes, client_id')
            .eq('coach_id', CoachDashboard.coachData.id);

        if (relError) {
            console.warn('Pas de relations coach-client trouvées, utilisation données mockées');
            return getMockClients();
        }

        if (!relations || relations.length === 0) {
            console.log('Aucun client, utilisation données mockées');
            return getMockClients();
        }

        // Récupérer IDs clients
        const clientIds = relations.map(r => r.client_id);

        // Charger profils clients
        const { data: clientProfiles } = await supabaseClient
            .from('profiles')
            .select('*')
            .in('id', clientIds);

        // Charger questionnaires Ikigai
        const { data: questionnaires } = await supabaseClient
            .from('questionnaires')
            .select('*')
            .in('user_id', clientIds)
            .eq('completed', true)
            .order('completed_at', { ascending: false });

        // Charger séances planifiées
        const { data: sessions } = await supabaseClient
            .from('coaching_sessions')
            .select('*')
            .eq('coach_id', CoachDashboard.coachData.id)
            .eq('status', 'scheduled')
            .order('session_date', { ascending: true });

        // Merger toutes les données
        const clients = relations.map(rel => {
            const profile = clientProfiles?.find(p => p.id === rel.client_id) || {};
            const clientQ = questionnaires?.filter(q => q.user_id === rel.client_id) || [];
            const latestQ = clientQ[0];
            const nextSession = sessions?.find(s =>
                s.client_id === rel.client_id &&
                new Date(s.session_date) > new Date()
            );

            return {
                id: rel.client_id,
                name: profile.name || 'Client',
                email: profile.email || '',
                score: latestQ?.ikigai_score || 0,
                avatar: (profile.name || '?').charAt(0).toUpperCase(),
                lastAnalysis: latestQ?.completed_at || null,
                nextSession: nextSession?.session_date || null,
                status: rel.status || 'active'
            };
        });

        console.log(`✅ ${clients.length} clients chargés depuis Supabase`);
        return clients;

    } catch (error) {
        console.error('Erreur chargement clients:', error);
        return getMockClients();
    }
}

function getMockClients() {
    // Données de démonstration
    return [
        {
            id: 1,
            name: 'Marie Dupont',
            email: 'marie.dupont@email.com',
            avatar: 'MD',
            score: 75,
            lastAnalysis: '2024-12-10',
            nextSession: '2024-12-18',
            status: 'active'
        },
        {
            id: 2,
            name: 'Thomas Martin',
            email: 'thomas.martin@email.com',
            avatar: 'TM',
            score: 82,
            lastAnalysis: '2024-12-12',
            nextSession: '2024-12-16',
            status: 'active'
        },
        {
            id: 3,
            name: 'Sophie Bernard',
            email: 'sophie.bernard@email.com',
            avatar: 'SB',
            score: 68,
            lastAnalysis: '2024-12-08',
            nextSession: '2024-12-20',
            status: 'active'
        },
        {
            id: 4,
            name: 'Lucas Dubois',
            email: 'lucas.dubois@email.com',
            avatar: 'LD',
            score: 91,
            lastAnalysis: '2024-12-11',
            nextSession: '2024-12-17',
            status: 'active'
        },
        {
            id: 5,
            name: 'Emma Petit',
            email: 'emma.petit@email.com',
            avatar: 'EP',
            score: 58,
            lastAnalysis: '2024-12-05',
            nextSession: '2024-12-22',
            status: 'pending'
        },
        {
            id: 6,
            name: 'Antoine Roux',
            email: 'antoine.roux@email.com',
            avatar: 'AR',
            score: 79,
            lastAnalysis: '2024-12-13',
            nextSession: '2024-12-19',
            status: 'active'
        },
        {
            id: 7,
            name: 'Camille Moreau',
            email: 'camille.moreau@email.com',
            avatar: 'CM',
            score: 45,
            lastAnalysis: '2024-11-28',
            nextSession: null,
            status: 'inactive'
        },
        {
            id: 8,
            name: 'Hugo Laurent',
            email: 'hugo.laurent@email.com',
            avatar: 'HL',
            score: 87,
            lastAnalysis: '2024-12-14',
            nextSession: '2024-12-15',
            status: 'active'
        }
    ];
}

// =============================================
// Mise à jour des statistiques
// =============================================

function updateStats(clients) {
    // Clients actifs
    const activeClients = clients.filter(c => c.status === 'active').length;
    updateStatValue('activeClients', activeClients);

    // Séances cette semaine
    const weekSessions = countWeekSessions(clients);
    updateStatValue('weekSessions', weekSessions);

    // Nouvelles analyses
    const newAnalyses = countNewAnalyses(clients);
    updateStatValue('newAnalyses', newAnalyses);

    // Score moyen
    const avgScore = calculateAverageScore(clients);
    updateStatValue('avgScore', avgScore);

    // Séances (remplace crédits)
    const sessionsTotal = CoachDashboard.coachData?.sessions_total || 100;
    const sessionsUsed = CoachDashboard.coachData?.sessions_used || 53;
    const sessionsRemaining = sessionsTotal - sessionsUsed;
    updateSessionsDisplay(sessionsRemaining, sessionsTotal);

    // Calcul économies réalisées
    const savings = calculateSavings(clients);
    updateSavingsDisplay(savings);
}

function countWeekSessions(clients) {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 7);

    return clients.filter(client => {
        if (!client.nextSession) return false;
        const sessionDate = new Date(client.nextSession);
        return sessionDate >= today && sessionDate <= weekEnd;
    }).length;
}

function countNewAnalyses(clients) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return clients.filter(client => {
        if (!client.lastAnalysis) return false;
        const analysisDate = new Date(client.lastAnalysis);
        return analysisDate >= weekAgo;
    }).length;
}

function calculateAverageScore(clients) {
    if (clients.length === 0) return 0;
    const total = clients.reduce((sum, client) => sum + (client.score || 0), 0);
    return Math.round(total / clients.length);
}

function updateStatValue(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        // Effacer le contenu actuel avant l'animation
        const currentValue = 0; // Toujours partir de 0 pour l'animation
        animateCounter(element, currentValue, value, 1000);
    }
}

function animateCounter(element, start, end, duration) {
    if (start === end) {
        const displayValue = element.id === 'avgScore'
            ? `${end}<span style="font-size: 1.5rem; opacity: 0.7;">%</span>`
            : end;
        element.innerHTML = displayValue;
        return;
    }

    const range = Math.abs(end - start);
    const increment = end > start ? 1 : -1;
    const stepTime = Math.max(Math.floor(duration / range), 10); // Minimum 10ms par step
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        const displayValue = element.id === 'avgScore'
            ? `${current}<span style="font-size: 1.5rem; opacity: 0.7;">%</span>`
            : current;
        element.innerHTML = displayValue;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function updateSessionsDisplay(remaining, total) {
    // Mettre à jour les séances dans la nav
    const navSessions = document.getElementById('navSessions');
    if (navSessions) {
        navSessions.textContent = remaining;
    }

    // Mettre à jour la carte de séances
    const sessionsRemaining = document.getElementById('sessionsRemaining');
    if (sessionsRemaining) {
        animateCounter(sessionsRemaining, 0, remaining, 1000);
    }

    // Mettre à jour la barre de progression
    const progressBar = document.getElementById('sessionsProgressBar');
    if (progressBar) {
        const percentage = (remaining / total) * 100;
        setTimeout(() => {
            progressBar.style.width = `${percentage}%`;
        }, 300);
    }

    // Mettre à jour les détails
    const sessionsDetails = document.getElementById('sessionsDetails');
    if (sessionsDetails) {
        const used = total - remaining;
        sessionsDetails.innerHTML = `
            <span>${remaining} / ${total} séances</span>
            <span>${used} utilisées</span>
        `;
    }
}

// =============================================
// Affichage de la liste des clients
// =============================================

function renderClientsTable(clients) {
    const tbody = document.getElementById('clientsTableBody');
    if (!tbody) return;

    if (clients.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6">
                    <div class="empty-state">
                        <div class="empty-icon">📭</div>
                        <div class="empty-title">Aucun client trouvé</div>
                        <div class="empty-description">Commencez par ajouter votre premier client</div>
                        <button class="btn-primary" onclick="addNewClient()">
                            ➕ Ajouter un client
                        </button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = clients.map(client => `
        <tr onclick="openClientProfile(${client.id})" data-client-id="${client.id}">
            <td data-label="Client">
                <div class="client-info">
                    <div class="client-avatar">${client.avatar}</div>
                    <div class="client-details">
                        <div class="client-name">${client.name}</div>
                        <div class="client-email">${client.email}</div>
                    </div>
                </div>
            </td>
            <td data-label="Score Ikigai">
                <span class="score-badge ${getScoreClass(client.score)}">
                    ${client.score}%
                </span>
            </td>
            <td data-label="Dernière analyse">
                ${formatDate(client.lastAnalysis)}
            </td>
            <td data-label="Prochaine séance">
                ${client.nextSession ? formatDate(client.nextSession) : '<span style="color: var(--gray);">Non planifiée</span>'}
            </td>
            <td data-label="Statut">
                <span class="status-badge status-${client.status}">
                    <span class="status-dot"></span>
                    ${getStatusLabel(client.status)}
                </span>
            </td>
            <td data-label="Actions">
                <div class="action-menu">
                    <button class="action-dots" onclick="event.stopPropagation(); showActionMenu(${client.id})">
                        ⋮
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-low';
}

function getStatusLabel(status) {
    const labels = {
        'active': 'Actif',
        'pending': 'En attente',
        'inactive': 'Inactif'
    };
    return labels[status] || status;
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// =============================================
// Filtrage des clients
// =============================================

function filterClients() {
    // Récupérer les valeurs des filtres
    const searchInput = document.getElementById('searchInput');
    const statusFilter = document.getElementById('statusFilter');
    const scoreFilter = document.getElementById('scoreFilter');

    CoachDashboard.filters.search = searchInput ? searchInput.value.toLowerCase() : '';
    CoachDashboard.filters.status = statusFilter ? statusFilter.value : 'all';
    CoachDashboard.filters.score = scoreFilter ? scoreFilter.value : 'all';

    // Filtrer les clients
    let filtered = CoachDashboard.clients.filter(client => {
        // Filtre de recherche
        const matchesSearch = !CoachDashboard.filters.search ||
            client.name.toLowerCase().includes(CoachDashboard.filters.search) ||
            client.email.toLowerCase().includes(CoachDashboard.filters.search);

        // Filtre de statut
        const matchesStatus = CoachDashboard.filters.status === 'all' ||
            client.status === CoachDashboard.filters.status;

        // Filtre de score
        let matchesScore = true;
        if (CoachDashboard.filters.score !== 'all') {
            switch (CoachDashboard.filters.score) {
                case 'high':
                    matchesScore = client.score >= 80;
                    break;
                case 'good':
                    matchesScore = client.score >= 60 && client.score < 80;
                    break;
                case 'average':
                    matchesScore = client.score >= 40 && client.score < 60;
                    break;
                case 'low':
                    matchesScore = client.score < 40;
                    break;
            }
        }

        return matchesSearch && matchesStatus && matchesScore;
    });

    // Sauvegarder les clients filtrés pour l'export
    CoachDashboard.filteredClients = filtered;

    // Réafficher la table
    renderClientsTable(filtered);
}

// =============================================
// Profil client (Modal)
// =============================================

function openClientProfile(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    CoachDashboard.currentClient = client;

    // Mettre à jour le titre du modal
    const modalTitle = document.getElementById('modalClientName');
    if (modalTitle) {
        modalTitle.textContent = `Profil de ${client.name}`;
    }

    // Charger le dashboard client dans le modal
    loadClientDashboard(client);

    // Afficher le modal
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeClientModal() {
    const modal = document.getElementById('clientModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    CoachDashboard.currentClient = null;
}

async function loadClientDashboard(client) {
    const modalContent = document.getElementById('modalClientContent');
    if (!modalContent) return;

    // Afficher un loader
    modalContent.innerHTML = `
        <div style="text-align: center; padding: 4rem;">
            <div class="loading" style="margin: 0 auto 1rem;"></div>
            <p style="color: var(--gray);">Chargement du profil client...</p>
        </div>
    `;

    try {
        // TODO: Charger les vraies données du client depuis l'API
        // const clientData = await ApiClient.get(`/api/coach/clients/${client.id}/ikigai`);

        // Simuler un délai de chargement
        await new Promise(resolve => setTimeout(resolve, 800));

        // Générer le dashboard client
        modalContent.innerHTML = generateClientDashboardHTML(client);

        // Réinitialiser les animations et interactions
        initClientDashboardInteractions(client);

    } catch (error) {
        console.error('Error loading client dashboard:', error);
        modalContent.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">❌</div>
                <div class="empty-title">Erreur de chargement</div>
                <div class="empty-description">Impossible de charger le profil du client</div>
                <button class="btn-primary" onclick="loadClientDashboard(${client.id})">
                    🔄 Réessayer
                </button>
            </div>
        `;
    }
}

function generateClientDashboardHTML(client) {
    // Générer le HTML du dashboard client (basé sur dashboard.html)
    // Note: Dans une vraie application, vous pourriez charger le HTML via fetch
    // ou utiliser un composant React/Vue

    return `
        <div class="dashboard" style="padding: 2rem 0;">
            <!-- Score Ikigai -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h2 class="card-title">
                        <div class="card-icon">🎯</div>
                        Score Ikigai
                    </h2>
                    <span class="card-badge ${client.score >= 60 ? 'badge-success' : 'badge-warning'}">
                        ${client.score >= 60 ? 'Bon alignement' : 'Alignement moyen'}
                    </span>
                </div>
                
                <div class="gauge-container">
                    <div class="gauge">
                        <svg class="gauge-circle" viewBox="0 0 200 200">
                            <defs>
                                <linearGradient id="gaugeGradient${client.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#00d4ff"/>
                                    <stop offset="25%" style="stop-color:#4169e1"/>
                                    <stop offset="50%" style="stop-color:#8b5cf6"/>
                                    <stop offset="75%" style="stop-color:#d946ef"/>
                                    <stop offset="100%" style="stop-color:#ec4899"/>
                                </linearGradient>
                            </defs>
                            <circle class="gauge-bg" cx="100" cy="100" r="85"/>
                            <circle class="gauge-progress" cx="100" cy="100" r="85" 
                                    stroke="url(#gaugeGradient${client.id})"
                                    stroke-dasharray="534" stroke-dashoffset="${534 - (client.score / 100) * 534}" 
                                    id="gaugeProgress${client.id}"/>
                        </svg>
                        <div class="gauge-text">
                            <div class="gauge-score">${client.score}</div>
                            <div class="gauge-label">sur 100</div>
                        </div>
                    </div>
                    
                    <div class="score-interpretation">
                        <h4>${client.score >= 60 ? '💚 Bon alignement professionnel' : '⚠️ Alignement moyen'}</h4>
                        <p>${client.score >= 60
            ? 'Le client est globalement aligné avec son Ikigai. Quelques ajustements peuvent optimiser son épanouissement.'
            : 'Il existe des opportunités d\'amélioration pour mieux aligner la carrière du client avec son Ikigai.'
        }</p>
                    </div>
                </div>
            </div>

            <!-- Carte Ikigai -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h2 class="card-title">
                        <div class="card-icon">🌸</div>
                        Carte Ikigai
                    </h2>
                </div>
                
                <div class="ikigai-map">
                    <div class="dimension-card">
                        <div class="dimension-header">
                            <div class="dimension-icon dim-love">❤️</div>
                            <div class="dimension-title">Ce qu'il/elle aime</div>
                        </div>
                        <div class="dimension-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 85%"></div>
                            </div>
                            <span class="progress-value">85%</span>
                        </div>
                        <div class="dimension-items">
                            <div class="dimension-item">Créativité et innovation</div>
                            <div class="dimension-item">Résolution de problèmes</div>
                            <div class="dimension-item">Travail d'équipe</div>
                        </div>
                    </div>

                    <div class="dimension-card">
                        <div class="dimension-header">
                            <div class="dimension-icon dim-good">⭐</div>
                            <div class="dimension-title">Ses talents naturels</div>
                        </div>
                        <div class="dimension-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 78%"></div>
                            </div>
                            <span class="progress-value">78%</span>
                        </div>
                        <div class="dimension-items">
                            <div class="dimension-item">Communication</div>
                            <div class="dimension-item">Analyse stratégique</div>
                            <div class="dimension-item">Gestion de projets</div>
                        </div>
                    </div>

                    <div class="dimension-card">
                        <div class="dimension-header">
                            <div class="dimension-icon dim-paid">💰</div>
                            <div class="dimension-title">Valeur marchande</div>
                        </div>
                        <div class="dimension-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${client.score}%"></div>
                            </div>
                            <span class="progress-value">${client.score}%</span>
                        </div>
                        <div class="dimension-items">
                            <div class="dimension-item">Conseil</div>
                            <div class="dimension-item">Formation</div>
                            <div class="dimension-item">Coaching</div>
                        </div>
                    </div>

                    <div class="dimension-card">
                        <div class="dimension-header">
                            <div class="dimension-icon dim-need">🌍</div>
                            <div class="dimension-title">Impact sociétal</div>
                        </div>
                        <div class="dimension-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: 68%"></div>
                            </div>
                            <span class="progress-value">68%</span>
                        </div>
                        <div class="dimension-items">
                            <div class="dimension-item">Solutions durables</div>
                            <div class="dimension-item">Inclusion</div>
                            <div class="dimension-item">Éducation</div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Actions Coach -->
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button class="btn-primary" onclick="downloadClientReport(${client.id})">
                    📥 Télécharger le rapport
                </button>
                <button class="btn-secondary" onclick="scheduleSession(${client.id})">
                    📅 Planifier une séance
                </button>
                <button class="btn-secondary" onclick="sendEmail(${client.id})">
                    ✉️ Envoyer un email
                </button>
            </div>
        </div>
    `;
}

function initClientDashboardInteractions(client) {
    // Animer la jauge
    const gaugeProgress = document.getElementById(`gaugeProgress${client.id}`);
    if (gaugeProgress) {
        const circumference = 2 * Math.PI * 85;
        const offset = circumference - (client.score / 100) * circumference;

        setTimeout(() => {
            gaugeProgress.style.strokeDashoffset = offset;
        }, 300);
    }
}

// =============================================
// Actions
// =============================================

function addNewClient() {
    // TODO: Open modal or form to add a new client
    alert('🆕 Fonctionnalité "Ajouter un client" en cours de développement');
}

function submitNewClient() {
    // TODO: Handle new client submission
    alert('✅ Fonctionnalité "Soumettre nouveau client" en cours de développement');
}

function closeAddClientModal() {
    // TODO: Close add client modal if exists
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function calculateSavings(clients) {
    // Calculate total savings based on clients
    // Assuming average coaching session cost of 150€ and that each client saves time/money
    const activeClients = clients.filter(c => c.status === 'active').length;
    const estimatedSavingsPerClient = 150; // Average savings per client per month
    return activeClients * estimatedSavingsPerClient;
}

function updateSavingsDisplay(savings) {
    // Update the savings display if the element exists
    const savingsElement = document.getElementById('savingsAmount');
    if (savingsElement) {
        animateCounter(savingsElement, 0, savings, 1000);
    }

    const savingsDetails = document.getElementById('savingsDetails');
    if (savingsDetails) {
        savingsDetails.textContent = `Économies réalisées ce mois`;
    }
}

function exportClients() {
    // Utiliser les clients filtrés si disponibles, sinon tous les clients
    const clients = CoachDashboard.filteredClients || CoachDashboard.clients;

    if (clients.length === 0) {
        alert('Aucun client à exporter');
        return;
    }

    // Headers CSV
    const headers = ['Nom', 'Email', 'Score Ikigai', 'Dernière Analyse', 'Prochaine Séance', 'Statut'];

    // Convertir les clients en lignes CSV
    const rows = clients.map(client => [
        `"${client.name || ''}"`,
        `"${client.email || ''}"`,
        client.score || 0,
        `"${formatDateForCSV(client.lastAnalysis)}"`,
        `"${formatDateForCSV(client.nextSession)}"`,
        `"${getStatusLabel(client.status)}"`
    ]);

    // Créer le contenu CSV
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');

    // Créer et télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `clients_ai-ikigai_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function formatDateForCSV(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR');
}

function showActionMenu(clientId) {
    event.stopPropagation(); // Empêcher la propagation au clic sur la ligne

    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    // Fermer tous les menus ouverts
    closeAllActionMenus();

    // Créer le menu dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'action-dropdown';
    dropdown.id = `actionMenu-${clientId}`;

    dropdown.innerHTML = `
        <button class="action-dropdown-item" onclick="downloadClientReport(${clientId}); closeAllActionMenus();">
            <span class="icon">📥</span>
            <span>Télécharger rapport PDF</span>
        </button>
        <button class="action-dropdown-item" onclick="scheduleSession(${clientId}); closeAllActionMenus();">
            <span class="icon">📅</span>
            <span>Planifier une séance</span>
        </button>
        <button class="action-dropdown-item" onclick="sendEmail(${clientId}); closeAllActionMenus();">
            <span class="icon">✉️</span>
            <span>Envoyer un email</span>
        </button>
        <button class="action-dropdown-item" onclick="openClientProfile(${clientId}); closeAllActionMenus();">
            <span class="icon">👁️</span>
            <span>Voir profil complet</span>
        </button>
    `;

    // Trouver le bouton parent
    const actionMenu = event.target.closest('.action-menu');
    if (actionMenu) {
        actionMenu.style.position = 'relative';
        actionMenu.appendChild(dropdown);

        // Activer le dropdown après un court délai pour l'animation
        setTimeout(() => {
            dropdown.classList.add('active');
        }, 10);
    }
}

function closeAllActionMenus() {
    document.querySelectorAll('.action-dropdown').forEach(menu => {
        menu.classList.remove('active');
        setTimeout(() => menu.remove(), 300);
    });
}

// Fermer les menus en cliquant ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.action-menu')) {
        closeAllActionMenus();
    }
});

async function downloadClientReport(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    try {
        console.log(`📥 Génération rapport pour ${client.name}`);

        // Show loading state
        const loadingMsg = alert('⏳ Génération du rapport PDF en cours...');

        // Send JSON request to the API
        const response = await fetch('https://ai-ikigai.ai-ikigai.workers.dev/api/generate-pdf', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                clientId: clientId,
                coachId: CoachDashboard.coachData.id
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la génération du PDF');
        }

        // Get the PDF blob
        const blob = await response.blob();

        // Create a download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `rapport-ikigai-${client.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;

        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        window.URL.revokeObjectURL(downloadUrl);

        console.log(`✅ Rapport généré pour ${client.name}`);

    } catch (error) {
        console.error('Erreur génération PDF:', error);
        alert(`❌ Erreur lors de la génération du rapport: ${error.message}`);
    }
}

function scheduleSession(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    // Ouvrir Google Calendar avec événement pré-rempli
    const title = `Séance Coaching Ikigai - ${client.name}`;
    const details = `Séance de coaching avec ${client.name}\nEmail: ${client.email}\nScore Ikigai actuel: ${client.score}%`;
    const location = 'Visio (lien à ajouter)';

    // Créer URL Google Calendar
    const baseUrl = 'https://calendar.google.com/calendar/render';
    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: title,
        details: details,
        location: location
    });

    window.open(`${baseUrl}?${params.toString()}`, '_blank');
    console.log(`📅 Ouverture Google Calendar pour ${client.name}`);
}

function sendEmail(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    // Confirmation avant ouverture
    const confirmed = confirm(
        `Ouvrir votre client email pour envoyer un message à ${client.name} ?\n\nEmail: ${client.email}`
    );

    if (confirmed) {
        const subject = encodeURIComponent('Suivi coaching Ikigai');
        const body = encodeURIComponent(`Bonjour ${client.name},\n\n`);
        window.location.href = `mailto:${client.email}?subject=${subject}&body=${body}`;
    }
}

function buyMoreCredits() {
    alert('💳 Redirection vers la page d\'achat de crédits...');
    // TODO: Rediriger vers Stripe checkout
    // window.location.href = '/pricing';
}

// =============================================
// Informations coach
// =============================================

function updateCoachInfo(coach) {
    // Mettre à jour les informations dans la nav si nécessaire
    const userName = document.querySelector('.user-name');
    const userAvatar = document.querySelector('.user-avatar');

    if (userName && coach.name) {
        userName.textContent = coach.name;
    }

    if (userAvatar && coach.name) {
        const initials = coach.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userAvatar.textContent = initials;
    }
}

// =============================================
// États de chargement
// =============================================

function showLoadingState() {
    console.log('Loading...');
    // TODO: Afficher un loader global
}

function hideLoadingState() {
    console.log('Loading complete');
}

// =============================================
// Animations
// =============================================

function initAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observer les cartes avec animation
    document.querySelectorAll('.stat-card, .card, .credits-card').forEach((element, index) => {
        if (!element.classList.contains('animate-in')) {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = `opacity 0.6s ease ${index * 0.05}s, transform 0.6s ease ${index * 0.05}s`;
            observer.observe(element);
        }
    });
}

// =============================================
// Gestion du clavier
// =============================================

document.addEventListener('keydown', (e) => {
    // Fermer le modal avec Escape
    if (e.key === 'Escape') {
        const modal = document.getElementById('clientModal');
        if (modal && modal.classList.contains('active')) {
            closeClientModal();
        }
    }
});

// Fermer le modal en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    const modal = document.getElementById('clientModal');
    if (modal && e.target === modal) {
        closeClientModal();
    }
});

// =============================================
// Acheter plus de séances
// =============================================

function buyMoreSessions() {
    alert('💳 Réservation de séances supplémentaires\n\nFonctionnalité à venir : Page de paiement pour acheter des crédits de séances supplémentaires.');

    // TODO: Rediriger vers page de paiement Stripe/autre
    // window.location.href = '/pricing-coach.html';
}

// =============================================
// Export global
// =============================================

window.CoachDashboard = CoachDashboard;
window.openClientProfile = openClientProfile;
window.closeClientModal = closeClientModal;
window.filterClients = filterClients;
window.addNewClient = addNewClient;
window.submitNewClient = submitNewClient;
window.closeAddClientModal = closeAddClientModal;
window.exportClients = exportClients;
window.showActionMenu = showActionMenu;
window.closeAllActionMenus = closeAllActionMenus;
window.downloadClientReport = downloadClientReport;
window.scheduleSession = scheduleSession;
window.sendEmail = sendEmail;
window.buyMoreSessions = buyMoreSessions;

console.log('🎯 Coach Dashboard JS loaded successfully');
