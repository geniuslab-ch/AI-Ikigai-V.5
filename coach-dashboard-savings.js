// =============================================
// CALCUL ÉCONOMIES RÉALISÉES
// =============================================

function calculateSavings(clients) {
    const nbClients = clients.filter(c => c.status === 'active').length;

    // Paramètres de calcul
    const tarifCoachingTrad = 150; // €/séance traditionnel
    const moyenneSeancesParMois = 4; // séances par client/mois
    const tarifMensuelAIIkigai = 29; // Abonnement coach mensuel

    // Calcul coût coaching traditionnel
    const coutTraditionnel = nbClients * tarifCoachingTrad * moyenneSeancesParMois;

    // Économies = coût trad - abonnement AI-Ikigai
    const economies = coutTraditionnel - tarifMensuelAIIkigai;

    return Math.max(0, Math.round(economies));
}

function updateSavingsDisplay(savings) {
    const element = document.getElementById('totalSavings');
    if (element) {
        // Animer le montant
        animateCounter(element, 0, savings, 1000);

        // Ajouter le symbole € après l'animation
        setTimeout(() => {
            element.innerHTML = `${savings}<span style="font-size: 1.5rem; opacity: 0.7;">€</span>`;
        }, 1100);
    }
}

// Export  global
window.calculateSavings = calculateSavings;
window.updateSavingsDisplay = updateSavingsDisplay;
