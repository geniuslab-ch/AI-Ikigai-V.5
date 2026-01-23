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

    // Charger les statistiques
    await loadAnalysesStats(user.id);

    // Afficher les analyses
    renderAnalyses();
});

// =============================================
// Chargement des analyses
// =============================================

async function loadAnalyses(coachId) {
    try {
        console.log('🔍 Loading analyses for coach:', coachId);

        // Charger les relations coach-client
        const { data: relations, error: relError } = await supabaseClient
            .from('coach_clients')
            .select('client_id')
            .eq('coach_id', coachId);

        if (relError) {
            console.error('❌ Error loading coach_clients:', relError);
        }

        if (!relations || relations.length === 0) {
            console.warn('⚠️ Pas de clients trouvés pour ce coach');
            AnalysesDashboard.analyses = [];
            return;
        }

        console.log('✅ Found', relations.length, 'clients');
        const clientIds = relations.map(r => r.client_id);

        // Charger les analyses depuis la table 'analyses' (PAS 'questionnaires'!)
        const { data: analyses, error: aError } = await supabaseClient
            .from('analyses')
            .select(`
                id,
                user_id,
                coach_id,
                created_at,
                answers,
                status,
                score,
                passions,
                talents,
                mission,
                vocation,
                career_recommendations,
                business_ideas,
                trajectories,
                coherence_diagnosis
            `)
            .in('user_id', clientIds)
            .order('created_at', { ascending: false });

        if (aError) {
            console.error('❌ Error loading analyses:', aError);
            AnalysesDashboard.analyses = [];
            return;
        }

        console.log('✅ Found', analyses?.length || 0, 'analyses');

        if (!analyses || analyses.length === 0) {
            console.warn('⚠️ No analyses found for clients');
            AnalysesDashboard.analyses = [];
            return;
        }

        // Charger les profils des clients
        const { data: profiles } = await supabaseClient
            .from('profiles')
            .select('id, name, email')
            .in('id', clientIds);

        console.log('✅ Loaded', profiles?.length || 0, 'profiles');

        // Merger les données
        AnalysesDashboard.analyses = analyses.map(a => {
            const profile = profiles?.find(p => p.id === a.user_id);

            // Calculer score moyen si dispo
            let scoreVal = 0;
            if (a.score) {
                const s = a.score;
                scoreVal = Math.round(((s.passion || 0) + (s.profession || 0) + (s.mission || 0) + (s.vocation || 0)) / 4);
            }
            if (scoreVal === 0) scoreVal = 85; // Fallback

            return {
                id: a.id,
                date: a.created_at,
                clientName: profile?.name || profile?.email || 'Client',
                clientId: a.user_id,
                type: 'Analyse complète',
                score: scoreVal,
                status: a.status || 'completed',
                fullData: a
            };
        });


        console.log('✅ Total analyses loaded:', AnalysesDashboard.analyses.length);

    } catch (error) {
        console.error('Erreur chargement analyses:', error);
        AnalysesDashboard.analyses = [];
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

    const full = analysis.fullData || {};
    const score = full.score || {};
    const recs = full.career_recommendations || [];
    const ideas = full.business_ideas || [];
    const trajectories = full.trajectories || [];

    let contentHtml = `
        <h2 style="margin-bottom: 1.5rem;">📊 Détails de l'analyse</h2>
        <div style="margin-bottom: 1.5rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div><strong>Client :</strong> ${analysis.clientName}</div>
            <div><strong>Date :</strong> ${formatDate(analysis.date)}</div>
            <div><strong>Type :</strong> ${analysis.type}</div>
            <div><strong>Score :</strong> <span class="score-badge ${getScoreClass(analysis.score)}">${analysis.score}%</span></div>
        </div>
    `;

    // Scores
    if (score.passion) {
        contentHtml += `
            <div style="margin-bottom: 1.5rem; background: var(--dark); padding: 1rem; border-radius: 12px;">
                <h3 style="font-size: 1rem; margin-bottom: 0.5rem; color: var(--gray);">Scores par dimension</h3>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center;">
                    <div><div style="font-weight: 700; color: #8b5cf6;">${score.passion}%</div><div style="font-size: 0.8rem;">Passion</div></div>
                    <div><div style="font-weight: 700; color: #00d4ff;">${score.profession}%</div><div style="font-size: 0.8rem;">Profession</div></div>
                    <div><div style="font-weight: 700; color: #ec4899;">${score.mission}%</div><div style="font-size: 0.8rem;">Mission</div></div>
                    <div><div style="font-weight: 700; color: #d946ef;">${score.vocation}%</div><div style="font-size: 0.8rem;">Vocation</div></div>
                </div>
            </div>
        `;
    }

    // Trajectories (V2)
    if (trajectories.length > 0) {
        contentHtml += `<h3 style="margin: 1.5rem 0 1rem 0;">🛤️ Trajectoires</h3>`;
        trajectories.forEach(t => {
            contentHtml += `
                <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(139, 92, 246, 0.05); border-left: 3px solid #8b5cf6; border-radius: 8px;">
                    <div style="font-weight: 600; color: white;">${t.title || t.label}</div>
                    <div style="font-size: 0.9rem; color: var(--gray); margin-top: 0.5rem;">${t.description || ''}</div>
                </div>
            `;
        });
    }

    // Recommendations (V1/V2)
    if (recs.length > 0) {
        contentHtml += `<h3 style="margin: 1.5rem 0 1rem 0;">💼 Recommandations Carrière</h3>`;
        recs.forEach(rec => {
            contentHtml += `
                <div style="margin-bottom: 1rem; padding: 1rem; background: var(--dark); border-radius: 8px;">
                    <div style="font-weight: 600; display: flex; justify-content: space-between;">
                        <span>${rec.title}</span>
                        ${rec.matchScore ? `<span style="color: var(--success);">${rec.matchScore}%</span>` : ''}
                    </div>
                    <div style="font-size: 0.9rem; color: var(--gray); margin-top: 0.5rem;">${rec.description || ''}</div>
                </div>
            `;
        });
    }

    // Business Ideas
    if (ideas.length > 0) {
        contentHtml += `<h3 style="margin: 1.5rem 0 1rem 0;">🚀 Business Ideas</h3>`;
        ideas.forEach(idea => {
            const title = typeof idea === 'string' ? idea : (idea.title || idea.name);
            const desc = typeof idea === 'string' ? '' : (idea.description || '');
            contentHtml += `
                <div style="margin-bottom: 1rem; padding: 1rem; background: rgba(236, 72, 153, 0.05); border-radius: 8px;">
                    <div style="font-weight: 600;">${title}</div>
                    ${desc ? `<div style="font-size: 0.9rem; color: var(--gray); margin-top: 0.5rem;">${desc}</div>` : ''}
                </div>
            `;
        });
    }

    modal.innerHTML = `
        <div style="background: var(--dark-card); border-radius: 20px; padding: 2rem; max-width: 800px; width: 90%; max-height: 85vh; overflow-y: auto;">
            ${contentHtml}
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

// =============================================
// Statistiques Analyses
// =============================================

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

        if (!allAnalyses || allAnalyses.length === 0) {
            updateAnalysesStatsUI({ total: 0, month: 0, avgScore: 0, evolution: 0 });
            return;
        }

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const monthAnalyses = allAnalyses.filter(a => new Date(a.completed_at) >= monthStart);
        const lastMonthAnalyses = allAnalyses.filter(a => {
            const d = new Date(a.completed_at);
            return d >= lastMonthStart && d <= lastMonthEnd;
        });

        // Calculer score moyen
        let totalScore = 0, count = 0;
        allAnalyses.forEach(a => {
            if (a.ikigai_dimensions) {
                const dims = a.ikigai_dimensions;
                const score = ((dims.passion_score || 0) + (dims.mission_score || 0) +
                    (dims.vocation_score || 0) + (dims.profession_score || 0)) / 4;
                if (score > 0) {
                    totalScore += score;
                    count++;
                }
            }
        });
        const avgScore = count > 0 ? Math.round(totalScore / count) : 0;

        // Calculer évolution
        const evolution = lastMonthAnalyses.length > 0
            ? Math.round(((monthAnalyses.length - lastMonthAnalyses.length) / lastMonthAnalyses.length) * 100)
            : 0;

        updateAnalysesStatsUI({
            total: allAnalyses.length,
            month: monthAnalyses.length,
            avgScore: avgScore,
            evolution: evolution
        });

    } catch (error) {
        console.error('Error loading analyses stats:', error);
        updateAnalysesStatsUI({ total: 0, month: 0, avgScore: 0, evolution: 0 });
    }
}

function updateAnalysesStatsUI(stats) {
    const totalEl = document.getElementById('totalAnalyses');
    const monthEl = document.getElementById('monthAnalyses');
    const avgEl = document.getElementById('avgAnalysisScore');
    const evolEl = document.getElementById('analysisEvolution');

    if (totalEl) totalEl.textContent = stats.total;
    if (monthEl) monthEl.textContent = stats.month;
    if (avgEl) avgEl.textContent = stats.avgScore + '%';
    if (evolEl) evolEl.textContent = (stats.evolution >= 0 ? '+' : '') + stats.evolution + '%';
}
