// dashboard-recommendations.js
// Fonctions pour afficher les recommandations avec le nouveau format (careerRecommendations + businessIdeas)

/**
 * Affiche les recommandations de carrière et idées business (aperçu, max 3 de chaque)
 * @param {Object} analysis - L'objet analyse complet (avec careerRecommendations et businessIdeas)
 */
function displayRecommendations(analysis) {
    const container = document.getElementById('recommendations-list');

    if (!analysis) {
        return;
    }

    let html = '';

    // Afficher les recommandations de carrière
    if (analysis.careerRecommendations && analysis.careerRecommendations.length > 0) {
        html += '<div class="recommendations-section">';
        html += '<h3 style="margin-bottom: 1rem; color: var(--cyan); font-size: 1.1rem;">🎯 Recommandations de Carrière</h3>';
        html += analysis.careerRecommendations.slice(0, 3).map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">${rec.title}</div>
                    ${rec.matchScore ? `<div class="match-score">${rec.matchScore}% match</div>` : ''}
                </div>
                <div class="recommendation-desc">${rec.description}</div>
            </div>
        `).join('');
        html += '</div>';
    } else if (analysis.recommendations && analysis.recommendations.length > 0) {
        // Fallback pour l'ancien format (compatibilité)
        html += analysis.recommendations.slice(0, 3).map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">${rec.title}</div>
                    ${rec.matchScore ? `<div class="match-score">${rec.matchScore}%</div>` : ''}
                </div>
                <div class="recommendation-desc">${rec.description}</div>
            </div>
        `).join('');
    }

    // Afficher les idées business si disponibles
    if (analysis.businessIdeas && analysis.businessIdeas.length > 0) {
        html += '<div class="recommendations-section" style="margin-top: 2rem;">';
        html += '<h3 style="margin-bottom: 1rem; color: var(--purple); font-size: 1.1rem;">💼 Idées Business</h3>';
        html += analysis.businessIdeas.slice(0, 3).map(idea => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">${idea.title}</div>
                    ${idea.viabilityScore ? `<div class="match-score">${idea.viabilityScore}% viabilité</div>` : ''}
                </div>
                <div class="recommendation-desc">${idea.description}</div>
            </div>
        `).join('');
        html += '</div>';
    }

    if (html) {
        container.innerHTML = html;
    }
}

/**
 * Affiche TOUTES les recommandations de carrière et idées business
 * @param {Object} analysis - L'objet analyse complet
 */
function displayAllRecommendations(analysis) {
    const container = document.getElementById('all-recommendations-list');

    if (!analysis) {
        return;
    }

    let html = '';

    // Afficher toutes les recommandations de carrière
    if (analysis.careerRecommendations && analysis.careerRecommendations.length > 0) {
        html += '<div class="recommendations-section">';
        html += '<h3 style="margin-bottom: 1.5rem; color: var(--cyan); font-size: 1.3rem;">🎯 Recommandations de Carrière</h3>';
        html += analysis.careerRecommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">${rec.title}</div>
                    ${rec.matchScore ? `<div class="match-score">${rec.matchScore}% match</div>` : ''}
                </div>
                <div class="recommendation-desc">${rec.description}</div>
            </div>
        `).join('');
        html += '</div>';
    } else if (analysis.recommendations && analysis.recommendations.length > 0) {
        // Fallback pour l'ancien format
        html += analysis.recommendations.map(rec => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">${rec.title}</div>
                    ${rec.matchScore ? `<div class="match-score">${rec.matchScore}%</div>` : ''}
                </div>
                <div class="recommendation-desc">${rec.description}</div>
            </div>
        `).join('');
    }

    // Afficher toutes les idées business si disponibles
    if (analysis.businessIdeas && analysis.businessIdeas.length > 0) {
        html += '<div class="recommendations-section" style="margin-top: 3rem;">';
        html += '<h3 style="margin-bottom: 1.5rem; color: var(--purple); font-size: 1.3rem;">💼 Idées Business</h3>';
        html += analysis.businessIdeas.map(idea => `
            <div class="recommendation-item">
                <div class="recommendation-header">
                    <div class="recommendation-title">${idea.title}</div>
                    ${idea.viabilityScore ? `<div class="match-score">${idea.viabilityScore}% viabilité</div>` : ''}
                </div>
                <div class="recommendation-desc">${idea.description}</div>
            </div>
        `).join('');
        html += '</div>';
    }

    if (html) {
        container.innerHTML = html;
    }
}

// Mettre à jour le handler de la section recommandations pour passer l'analyse complète
function navigateToRecommendationsSection() {
    if (window.dashboardData && window.dashboardData.latestAnalysis) {
        displayAllRecommendations(window.dashboardData.latestAnalysis);
    }
}
