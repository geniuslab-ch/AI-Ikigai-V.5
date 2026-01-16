/**
 * AI-IKIGAI - Coach Dashboard Analyses
 * Gestion des analyses Ikigai pour les coaches
 */

// =============================================
// État global
// =============================================

const AnalysesDashboard = {
    analyses: [],
    filteredAnalyses: [],
    filters: {
        period: 'all',
        client: 'all',
        score: 'all'
    }
};

// =============================================
// Initialisation
// =============================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Analyses Dashboard initialization...');

    // Vérifier l'authentification
    const user = await checkAuth('coach');
    if (!user) {
        console.log('Coach not authenticated');
        return;
    }

    // Charger les analyses
    await loadAnalyses(user.id);

    // Afficher les analyses
    renderAnalyses();
});

// =============================================
// Chargement des analyses
// =============================================

async function loadAnalyses(coachId) {
    try {
        // Charger les relations coach-client
        const { data: relations, error: relError } = await supabaseClient
            .from('coach_clients')
            .select('client_id')
            .eq('coach_id', coachId);

        if (relError || !relations || relations.length === 0) {
            console.warn('Pas de clients trouvés');
            AnalysesDashboard.analyses = [];
            return;
        }

        const clientIds = relations.map(r => r.client_id);

        // Charger les questionnaires complétés
        const { data: questionnaires, error: qError } = await supabaseClient
            .from('questionnaires')
            .select(`
                id,
                user_id,
                ikigai_score,
                completed_at,
                type
            `)
            .in('user_id', clientIds)
            .eq('completed', true)
            .order('completed_at', { ascending: false });

        if (qError || !questionnaires) {
            console.warn('Erreur chargement questionnaires');
            AnalysesDashboard.analyses = [];
            return;
        }

        // Charger les profils des clients
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, name, email')
            .in('id', clientIds);

        // Merger les données
        AnalysesDashboard.analyses = questionnaires.map(q => {
            const profile = profiles?.find(p => p.id === q.user_id);
            return {
                id: q.id,
                date: q.completed_at,
                clientName: profile?.name || 'Client',
                clientId: q.user_id,
                type: q.type === 'quick' ? 'Analyse express' : 'Analyse complète',
                score: q.ikigai_score || 0
            };
        });

        console.log(`✅ ${AnalysesDashboard.analyses.length} analyses chargées`);

    } catch (error) {
        console.error('Erreur chargement analyses:', error);
        AnalysesDashboard.analyses = getMockAnalyses();
    }
}

function getMockAnalyses() {
    return [
        { id: 1, date: '2024-12-12', clientName: 'Marie Dupont', type: 'Analyse complète', score: 82 },
        { id: 2, date: '2024-12-10', clientName: 'Thomas Martin', type: 'Analyse complète', score: 75 },
        { id: 3, date: '2024-12-08', clientName: 'Sophie Bernard', type: 'Analyse express', score: 68 },
        { id: 4, date: '2024-12-05', clientName: 'Lucas Dubois', type: 'Analyse complète', score: 71 },
        { id: 5, date: '2024-12-01', clientName: 'Emma Petit', type: 'Analyse complète', score: 58 }
    ];
}

// =============================================
// Filtrage
// =============================================

function filterAnalyses() {
    const periodSelect = document.querySelector('.filter-select');
    const clientSelect = document.querySelectorAll('.filter-select')[1];
    const scoreSelect = document.querySelectorAll('.filter-select')[2];

    AnalysesDashboard.filters.period = periodSelect?.value || 'all';
    AnalysesDashboard.filters.client = clientSelect?.value || 'all';
    AnalysesDashboard.filters.score = scoreSelect?.value || 'all';

    // Filtrer les analyses
    let filtered = AnalysesDashboard.analyses.filter(analysis => {
        // Filtre de période
        let matchesPeriod = true;
        if (AnalysesDashboard.filters.period !== 'all' && AnalysesDashboard.filters.period !== 'Toutes les périodes') {
            const analysisDate = new Date(analysis.date);
            const today = new Date();
            const daysAgo = {
                '7 derniers jours': 7,
                '30 derniers jours': 30,
                '3 derniers mois': 90
            }[AnalysesDashboard.filters.period];

            if (daysAgo) {
                const cutoffDate = new Date(today);
                cutoffDate.setDate(today.getDate() - daysAgo);
                matchesPeriod = analysisDate >= cutoffDate;
            }
        }

        // Filtre de client
        const matchesClient = AnalysesDashboard.filters.client === 'all' ||
            AnalysesDashboard.filters.client === 'Tous les clients' ||
            analysis.clientName === AnalysesDashboard.filters.client;

        // Filtre de score
        let matchesScore = true;
        if (AnalysesDashboard.filters.score !== 'all' && AnalysesDashboard.filters.score !== 'Tous les scores') {
            if (AnalysesDashboard.filters.score === 'Excellent (80-100)') {
                matchesScore = analysis.score >= 80;
            } else if (AnalysesDashboard.filters.score === 'Bon (60-79)') {
                matchesScore = analysis.score >= 60 && analysis.score < 80;
            } else if (AnalysesDashboard.filters.score === 'Moyen (40-59)') {
                matchesScore = analysis.score >= 40 && analysis.score < 60;
            }
        }

        return matchesPeriod && matchesClient && matchesScore;
    });

    AnalysesDashboard.filteredAnalyses = filtered;
    renderAnalyses();
}

// =============================================
// Affichage
// =============================================

function renderAnalyses() {
    const tbody = document.querySelector('tbody');
    if (!tbody) return;

    const analyses = AnalysesDashboard.filteredAnalyses.length > 0
        ? AnalysesDashboard.filteredAnalyses
        : AnalysesDashboard.analyses;

    if (analyses.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 3rem;">
                    <div style="color: var(--gray);">Aucune analyse trouvée</div>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = analyses.map(analysis => `
        <tr>
            <td>${formatDate(analysis.date)}</td>
            <td>${analysis.clientName}</td>
            <td>${analysis.type}</td>
            <td><span class="score-badge ${getScoreClass(analysis.score)}">${analysis.score}%</span></td>
            <td>
                <button class="btn-icon" title="Voir détails" onclick="viewAnalysisDetails(${analysis.id})">👁️</button>
                <button class="btn-icon" title="Télécharger PDF" onclick="downloadAnalysisPDF(${analysis.id})">📥</button>
            </td>
        </tr>
    `).join('');
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    return 'score-average';
}

// =============================================
// Actions
// =============================================

async function viewAnalysisDetails(analysisId) {
    const analysis = AnalysesDashboard.analyses.find(a => a.id === analysisId);
    if (!analysis) {
        alert('Analyse non trouvée');
        return;
    }

    // Créer une modale simple pour afficher les détails
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.position = 'fixed';
    modal.style.top = '0';
    modal.style.left = '0';
    modal.style.width = '100%';
    modal.style.height = '100%';
    modal.style.backgroundColor = 'rgba(0,0,0,0.8)';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
    modal.style.zIndex = '10000';

    modal.innerHTML = `
        <div style="background: var(--dark-card); border-radius: 20px; padding: 2rem; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;">
            <h2 style="margin-bottom: 1.5rem;">📊 Détails de l'analyse</h2>
            <div style="margin-bottom: 1rem;">
                <strong>Client :</strong> ${analysis.clientName}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Date :</strong> ${formatDate(analysis.date)}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Type :</strong> ${analysis.type}
            </div>
            <div style="margin-bottom: 1rem;">
                <strong>Score Ikigai :</strong> <span class="score-badge ${getScoreClass(analysis.score)}">${analysis.score}%</span>
            </div>
            <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                <button class="btn-primary" onclick="downloadAnalysisPDF(${analysisId})">📥 Télécharger PDF</button>
                <button class="btn-secondary" onclick="this.closest('.modal').remove()">Fermer</button>
            </div>
        </div>
    `;

    // Fermer au clic sur le fond
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    document.body.appendChild(modal);
}

async function downloadAnalysisPDF(analysisId) {
    const analysis = AnalysesDashboard.analyses.find(a => a.id === analysisId);
    if (!analysis) {
        alert('Analyse non trouvée');
        return;
    }

    // TODO: Implémenter la vraie génération de PDF via API
    // Pour l'instant, afficher un message
    alert(`📥 Téléchargement du rapport PDF pour ${analysis.clientName}...\n\n` +
        `Cette fonctionnalité nécessite l'intégration d'une API de génération de PDF.\n` +
        `Score: ${analysis.score}%\nDate: ${formatDate(analysis.date)}`);

    // Dans une vraie implémentation :
    // const response = await fetch(`/api/analyses/${analysisId}/pdf`);
    // const blob = await response.blob();
    // const url = window.URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `analyse-${analysis.clientName}-${analysis.date}.pdf`;
    // a.click();
}

// =============================================
// Exports globaux
// =============================================

window.filterAnalyses = filterAnalyses;
window.viewAnalysisDetails = viewAnalysisDetails;
window.downloadAnalysisPDF = downloadAnalysisPDF;

console.log('📊 Analyses Dashboard loaded');

// Calculer et afficher statistiques
await loadAnalysesStats(user.id);

async function loadAnalysesStats(coachId) {
    try {
        const { data: relations } = await supabaseClient
            .from('coach_clients')
            .select('client_id')
            .eq('coach_id', coachId);
        
        if (!relations || relations.length === 0) {
            updateAnalysesStatsUI({ total: 0, month: 0, avgScore: 0, evolution: 0 });
            return;
        }
        
        const clientIds = relations.map(r => r.client_id);
        
        const { data: allAnalyses } = await supabaseClient
            .from('questionnaires')
            .select('completed_at, ikigai_dimensions')
            .in('user_id', clientIds)
            .eq('completed', true);
        
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const monthAnalyses = allAnalyses?.filter(a => new Date(a.completed_at) >= monthStart) || [];
        const lastMonthAnalyses = allAnalyses?.filter(a => {
            const d = new Date(a.completed_at);
            return d >= lastMonthStart && d <= lastMonthEnd;
        }) || [];
        
        const avgScore = calculateAvgScore(allAnalyses);
        const evolution = lastMonthAnalyses.length > 0 
            ? Math.round(((monthAnalyses.length - lastMonthAnalyses.length) / lastMonthAnalyses.length) * 100)
            : 0;
        
        updateAnalysesStatsUI({
            total: allAnalyses?.length || 0,
            month: monthAnalyses.length,
            avgScore: avgScore,
            evolution: evolution
        });
    } catch (error) {
        console.error('Error loading analyses stats:', error);
    }
}

function calculateAvgScore(analyses) {
    if (!analyses || analyses.length === 0) return 0;
    
    let total = 0, count = 0;
    analyses.forEach(a => {
        if (a.ikigai_dimensions) {
            const dims = a.ikigai_dimensions;
            const score = ((dims.passion_score || 0) + (dims.mission_score || 0) + 
                          (dims.vocation_score || 0) + (dims.profession_score || 0)) / 4;
            if (score > 0) {
                total += score;
                count++;
            }
        }
    });
    
    return count > 0 ? Math.round(total / count) : 0;
}

function updateAnalysesStatsUI(stats) {
    document.getElementById('totalAnalyses').textContent = stats.total;
    document.getElementById('monthAnalyses').textContent = stats.month;
    document.getElementById('avgAnalysisScore').textContent = stats.avgScore + '%';
    document.getElementById('analysisEvolution').textContent = (stats.evolution >= 0 ? '+' : '') + stats.evolution + '%';
}
