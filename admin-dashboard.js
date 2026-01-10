/**
 * AI-IKIGAI - Admin Dashboard JavaScript
 * Gestion complète de tous les modules admin
 */

// =============================================
// Configuration & State
// =============================================

const AdminDashboard = {
    currentSection: 'overview',
    currentUser: null,
    data: {
        users: [],
        coaches: [],
        analyses: [],
        tickets: [],
        revenue: {}
    },
    filters: {}
};

// =============================================
// Initialisation
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Admin Dashboard initialization...');
    
    // Vérifier l'authentification et le rôle admin
    if (typeof ApiClient !== 'undefined' && !await checkAdminAccess()) {
        console.log('Not authorized as admin, redirecting...');
        window.location.href = '/login.html?error=unauthorized';
        return;
    }
    
    // Charger les données initiales
    await loadDashboardData();
    
    // Initialiser la navigation
    initNavigation();
    
    // Initialiser les événements
    initEventListeners();
});

// =============================================
// Vérification des accès
// =============================================

async function checkAdminAccess() {
    try {
        if (!ApiClient.isAuthenticated()) {
            return false;
        }
        
        const user = await AuthAPI.getCurrentUser();
        AdminDashboard.currentUser = user;
        
        // Vérifier le rôle admin
        if (!['admin', 'super_admin', 'readonly_admin'].includes(user.role)) {
            return false;
        }
        
        // Mettre à jour l'interface avec les infos utilisateur
        updateUserProfile(user);
        
        return true;
    } catch (error) {
        console.error('Error checking admin access:', error);
        return false;
    }
}

function updateUserProfile(user) {
    const userName = document.querySelector('.user-name');
    const userRole = document.querySelector('.user-role');
    const userAvatar = document.querySelector('.user-avatar');
    
    if (userName) userName.textContent = user.name || user.email;
    if (userRole) {
        const roleLabels = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'readonly_admin': 'Lecture Seule'
        };
        userRole.textContent = roleLabels[user.role] || user.role;
    }
    if (userAvatar) {
        const initials = (user.name || user.email)
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
        userAvatar.textContent = initials;
    }
}

// =============================================
// Chargement des données
// =============================================

async function loadDashboardData() {
    try {
        showLoadingState();
        
        // Charger les données selon la section
        switch (AdminDashboard.currentSection) {
            case 'overview':
                await loadOverviewData();
                break;
            case 'users':
                await loadUsersData();
                break;
            case 'coaches':
                await loadCoachesData();
                break;
            case 'ikigai-analyses':
                await loadAnalysesData();
                break;
            case 'pricing-b2c':
            case 'pricing-coach':
                await loadPricingData();
                break;
            case 'analytics':
            case 'revenue':
                await loadAnalyticsData();
                break;
            case 'support':
                await loadSupportData();
                break;
            case 'gdpr':
                await loadGDPRData();
                break;
            case 'audit':
                await loadAuditData();
                break;
            default:
                console.log('Section not implemented:', AdminDashboard.currentSection);
        }
        
        hideLoadingState();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        hideLoadingState();
        showError('Erreur lors du chargement des données');
    }
}

async function loadOverviewData() {
    // Charger les statistiques globales
    const stats = await fetchWithFallback('/api/admin/stats', getDefaultStats());
    updateOverviewStats(stats);
}

async function loadUsersData() {
    const users = await fetchWithFallback('/api/admin/users', getDefaultUsers());
    AdminDashboard.data.users = users;
    renderUsersSection(users);
}

async function loadCoachesData() {
    const coaches = await fetchWithFallback('/api/admin/coaches', getDefaultCoaches());
    AdminDashboard.data.coaches = coaches;
    renderCoachesSection(coaches);
}

async function loadAnalysesData() {
    const analyses = await fetchWithFallback('/api/admin/analyses', getDefaultAnalyses());
    AdminDashboard.data.analyses = analyses;
    renderAnalysesSection(analyses);
}

// Helper pour fetch avec fallback
async function fetchWithFallback(url, fallbackData) {
    try {
        if (typeof ApiClient !== 'undefined') {
            return await ApiClient.get(url);
        }
    } catch (error) {
        console.warn(`API call failed for ${url}, using fallback data`, error);
    }
    return fallbackData;
}

// =============================================
// Navigation
// =============================================

function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const section = item.dataset.section;
            if (section) {
                navigateToSection(section);
            }
        });
    });
}

function navigateToSection(sectionId) {
    // Mettre à jour l'état
    AdminDashboard.currentSection = sectionId;
    
    // Mettre à jour la navigation active
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    const activeItem = document.querySelector(`[data-section="${sectionId}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }
    
    // Mettre à jour le titre de la page
    updatePageTitle(sectionId);
    
    // Masquer toutes les sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Afficher la section demandée
    let targetSection = document.getElementById(`section-${sectionId}`);
    if (!targetSection) {
        // Créer la section si elle n'existe pas
        targetSection = createSection(sectionId);
    }
    targetSection.classList.add('active');
    
    // Charger les données de la section
    loadDashboardData();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

function updatePageTitle(sectionId) {
    const titles = {
        'overview': 'Vue d\'ensemble',
        'analytics': 'Analytique Business',
        'users': 'Gestion des Utilisateurs',
        'coaches': 'Gestion des Coaches',
        'ikigai-analyses': 'Analyses Ikigai',
        'pricing-b2c': 'Tarification B2C',
        'pricing-coach': 'Tarification Coach',
        'revenue': 'Revenus',
        'support': 'Support Client',
        'gdpr': 'GDPR',
        'audit': 'Logs d\'Audit',
        'settings': 'Paramètres',
        'roles': 'Rôles & Permissions'
    };
    
    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Admin Dashboard';
    }
}

function createSection(sectionId) {
    const content = document.querySelector('.dashboard-content');
    const section = document.createElement('div');
    section.className = 'section';
    section.id = `section-${sectionId}`;
    content.appendChild(section);
    return section;
}

// =============================================
// Rendu des sections
// =============================================

function updateOverviewStats(stats) {
    // Mettre à jour les KPIs
    animateValue('stat-users', 0, stats.totalUsers, 1000);
    animateValue('stat-analyses', 0, stats.totalAnalyses, 1000);
    animateValue('stat-revenue', 0, stats.monthlyRevenue, 1000, '€');
    animateValue('stat-conversion', 0, stats.conversionRate, 1000, '%');
}

function renderUsersSection(users) {
    const section = document.getElementById('section-users');
    if (!section) return;
    
    section.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">
                    <div class="card-icon">👥</div>
                    Gestion des Utilisateurs
                </h2>
                <button class="btn-primary" onclick="exportUsers()">
                    📥 Exporter
                </button>
            </div>
            
            <div class="filters-bar">
                <div class="search-box">
                    <span class="search-icon">🔍</span>
                    <input type="text" class="search-input" placeholder="Rechercher..." onkeyup="filterUsers()">
                </div>
                <select class="filter-select" onchange="filterUsers()">
                    <option value="all">Tous les statuts</option>
                    <option value="active">Actifs</option>
                    <option value="inactive">Inactifs</option>
                    <option value="suspended">Suspendus</option>
                </select>
            </div>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Utilisateur</th>
                        <th>Email</th>
                        <th>Rôle</th>
                        <th>Analyses</th>
                        <th>Inscription</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${users.map(user => `
                        <tr>
                            <td>${user.name}</td>
                            <td>${user.email}</td>
                            <td>${user.role}</td>
                            <td>${user.analysesCount || 0}</td>
                            <td>${formatDate(user.createdAt)}</td>
                            <td><span class="status-badge status-${user.status}">
                                <span class="status-dot"></span>
                                ${user.status}
                            </span></td>
                            <td>
                                <button class="btn-icon" onclick="viewUser(${user.id})" title="Voir">👁️</button>
                                <button class="btn-icon" onclick="editUser(${user.id})" title="Éditer">✏️</button>
                                <button class="btn-icon" onclick="deleteUser(${user.id})" title="Supprimer">🗑️</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderCoachesSection(coaches) {
    const section = document.getElementById('section-coaches');
    if (!section) return;
    
    section.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">
                    <div class="card-icon">🎓</div>
                    Gestion des Coaches
                </h2>
            </div>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Coach</th>
                        <th>Clients</th>
                        <th>Analyses</th>
                        <th>Crédits</th>
                        <th>Plan</th>
                        <th>Renouvellement</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${coaches.map(coach => `
                        <tr>
                            <td>${coach.name}</td>
                            <td>${coach.clientsCount || 0}</td>
                            <td>${coach.creditsUsed || 0} / ${coach.creditsTotal || 0}</td>
                            <td>${coach.creditsRemaining || 0}</td>
                            <td><span class="status-badge status-active">${coach.plan || 'Free'}</span></td>
                            <td>${formatDate(coach.renewalDate)}</td>
                            <td>
                                <button class="btn-icon" onclick="manageCredits(${coach.id})" title="Gérer crédits">⚡</button>
                                <button class="btn-icon" onclick="changePlan(${coach.id})" title="Changer plan">💳</button>
                                <button class="btn-icon" onclick="whiteLabel(${coach.id})" title="Marque blanche">🎨</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function renderAnalysesSection(analyses) {
    const section = document.getElementById('section-ikigai-analyses');
    if (!section) return;
    
    section.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">
                    <div class="card-icon">🎯</div>
                    Analyses Ikigai
                </h2>
            </div>
            
            <div class="filters-bar">
                <select class="filter-select" onchange="filterAnalyses()">
                    <option value="all">Toutes les dates</option>
                    <option value="today">Aujourd'hui</option>
                    <option value="week">Cette semaine</option>
                    <option value="month">Ce mois</option>
                </select>
                <select class="filter-select" onchange="filterAnalyses()">
                    <option value="all">Tous les types</option>
                    <option value="b2c">B2C</option>
                    <option value="coach">Coach</option>
                    <option value="enterprise">Entreprise</option>
                </select>
                <select class="filter-select" onchange="filterAnalyses()">
                    <option value="all">Tous les statuts</option>
                    <option value="completed">Complété</option>
                    <option value="pending">En cours</option>
                    <option value="failed">Échoué</option>
                </select>
            </div>
            
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Utilisateur</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th>Durée</th>
                        <th>Statut</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${analyses.map(analysis => `
                        <tr>
                            <td>#${analysis.id}</td>
                            <td>${analysis.userName}</td>
                            <td>${analysis.type}</td>
                            <td>${formatDate(analysis.createdAt)}</td>
                            <td>${analysis.duration || '-'}s</td>
                            <td><span class="status-badge status-${analysis.status}">
                                ${analysis.status}
                            </span></td>
                            <td>
                                <button class="btn-icon" onclick="viewAnalysis(${analysis.id})" title="Voir détails">👁️</button>
                                ${analysis.hasError ? '<button class="btn-icon" onclick="reportAnomaly(' + analysis.id + ')" title="Signaler">⚠️</button>' : ''}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// =============================================
// Utilitaires
// =============================================

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function animateValue(elementId, start, end, duration, suffix = '') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const range = end - start;
    const increment = end > start ? 1 : -1;
    const stepTime = Math.abs(Math.floor(duration / range));
    let current = start;

    const timer = setInterval(() => {
        current += increment;
        element.textContent = current + suffix;
        if (current === end) {
            clearInterval(timer);
        }
    }, stepTime);
}

function showLoadingState() {
    console.log('Loading...');
}

function hideLoadingState() {
    console.log('Loading complete');
}

function showError(message) {
    alert('❌ ' + message);
}

// =============================================
// Actions utilisateurs
// =============================================

function exportUsers() {
    alert('📥 Export des utilisateurs en cours...');
}

function viewUser(userId) {
    alert(`👁️ Voir l'utilisateur ${userId}`);
}

function editUser(userId) {
    alert(`✏️ Éditer l'utilisateur ${userId}`);
}

function deleteUser(userId) {
    if (confirm('⚠️ Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        alert(`🗑️ Suppression de l'utilisateur ${userId}`);
    }
}

function manageCredits(coachId) {
    alert(`⚡ Gérer les crédits du coach ${coachId}`);
}

function changePlan(coachId) {
    alert(`💳 Changer le plan du coach ${coachId}`);
}

function whiteLabel(coachId) {
    alert(`🎨 Configurer la marque blanche pour le coach ${coachId}`);
}

function viewAnalysis(analysisId) {
    alert(`👁️ Voir l'analyse ${analysisId}`);
}

function reportAnomaly(analysisId) {
    alert(`⚠️ Signaler une anomalie pour l'analyse ${analysisId}`);
}

// =============================================
// Sidebar Mobile
// =============================================

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('active');
}

// =============================================
// Event Listeners
// =============================================

function initEventListeners() {
    // Recherche globale
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
        globalSearch.addEventListener('input', debounce(handleGlobalSearch, 300));
    }
    
    // Fermer la sidebar en cliquant dehors sur mobile
    document.addEventListener('click', (e) => {
        const sidebar = document.getElementById('sidebar');
        const menuBtn = document.querySelector('.mobile-menu-btn');
        
        if (window.innerWidth <= 1024 && 
            sidebar && 
            sidebar.classList.contains('active') && 
            !sidebar.contains(e.target) && 
            !menuBtn.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

function handleGlobalSearch(e) {
    const query = e.target.value.toLowerCase();
    console.log('Global search:', query);
    // Implémenter la recherche globale
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// =============================================
// Données de fallback pour développement
// =============================================

function getDefaultStats() {
    return {
        totalUsers: 1247,
        totalAnalyses: 3892,
        monthlyRevenue: 87400,
        conversionRate: 68.2
    };
}

function getDefaultUsers() {
    return [
        {
            id: 1,
            name: 'Marie Dupont',
            email: 'marie.dupont@email.com',
            role: 'client',
            analysesCount: 3,
            createdAt: '2024-11-15',
            status: 'active'
        },
        {
            id: 2,
            name: 'Jean Martin',
            email: 'jean.martin@email.com',
            role: 'client',
            analysesCount: 1,
            createdAt: '2024-12-01',
            status: 'active'
        }
    ];
}

function getDefaultCoaches() {
    return [
        {
            id: 1,
            name: 'Sophie Bernard',
            email: 'sophie@coach.com',
            clientsCount: 24,
            creditsUsed: 53,
            creditsTotal: 100,
            creditsRemaining: 47,
            plan: 'Pro',
            renewalDate: '2025-01-15'
        }
    ];
}

function getDefaultAnalyses() {
    return [
        {
            id: 1,
            userName: 'Marie Dupont',
            type: 'B2C',
            createdAt: '2024-12-15T10:30:00Z',
            duration: 12,
            status: 'completed',
            hasError: false
        },
        {
            id: 2,
            userName: 'Jean Martin',
            type: 'Coach',
            createdAt: '2024-12-15T09:15:00Z',
            duration: null,
            status: 'failed',
            hasError: true
        }
    ];
}

// =============================================
// Export global
// =============================================

window.AdminDashboard = AdminDashboard;
window.navigateToSection = navigateToSection;
window.toggleSidebar = toggleSidebar;
window.exportUsers = exportUsers;
window.viewUser = viewUser;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.manageCredits = manageCredits;
window.changePlan = changePlan;
window.whiteLabel = whiteLabel;
window.viewAnalysis = viewAnalysis;
window.reportAnomaly = reportAnomaly;

console.log('✅ Admin Dashboard JS loaded successfully');
