
// ========================================
// DASHBOARD HISTORIQUE QUESTIONNAIRES
// ========================================

async function loadQuestionnaireHistory() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();

        if (!session) {
            window.location.href = 'auth.html';
            return;
        }

        const { data: questionnaires, error } = await supabaseClient
            .from('questionnaires')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        console.log(`✅ ${questionnaires.length} questionnaires trouvés`);
        displayQuestionnaireList(questionnaires);

    } catch (error) {
        console.error('❌ Erreur chargement historique:', error);
    }
}

function displayQuestionnaireList(questionnaires) {
    const container = document.getElementById('questionnaire-history');

    if (!container) return;

    if (questionnaires.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--gray);">
                <p>Aucune analyse pour le moment</p>
                <a href="questionnaire.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">
                    Faire mon premier test →
                </a>
            </div>
        `;
        return;
    }

    const html = questionnaires.map(q => `
        <div style="background: var(--dark-card); border: 1px solid var(--dark-border); border-radius: 16px; padding: 1.5rem; margin-bottom: 1rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
                <h4>${new Date(q.created_at).toLocaleDateString('fr-FR')}</h4>
                <span style="padding: 0.25rem 0.75rem; border-radius: 8px; background: linear-gradient(135deg, var(--purple), var(--magenta)); font-size: 0.85rem;">
                    ${q.plan || 'découverte'}
                </span>
            </div>
            <div style="display: flex; gap: 2rem; margin-bottom: 1rem;">
                <div>
                    <strong style="font-size: 1.5rem; color: var(--cyan);">${q.analysis?.careerRecommendations?.length || 0}</strong>
                    <span style="color: var(--gray); font-size: 0.85rem; display: block;">Recommandations</span>
                </div>
                <div>
                    <strong style="font-size: 1.5rem; color: var(--cyan);">${q.analysis?.businessIdeas?.length || 0}</strong>
                    <span style="color: var(--gray); font-size: 0.85rem; display: block;">Idées Business</span>
                </div>
            </div>
            <div style="display: flex; gap: 1rem;">
                <button onclick="window.location.href='questionnaire.html?result=${q.id}'" style="flex: 1; padding: 0.75rem; background: var(--dark); border: 1px solid var(--border); border-radius: 12px; color: white; cursor: pointer;">
                    Voir détails
                </button>
            </div>
        </div>
    `).join('');

    container.innerHTML = html;
}

// Charger au chargement
if (document.getElementById('questionnaire-history')) {
    loadQuestionnaireHistory();
}
