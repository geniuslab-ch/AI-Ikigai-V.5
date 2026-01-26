// =============================================
// MODAL NOUVEAU CLIENT
// =============================================

function addNewClient() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        // Réinitialiser le formulaire
        const form = document.getElementById('addClientForm');
        if (form) form.reset();
    }
}

function closeAddClientModal() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

async function handleAddNewClient(event) {
    event.preventDefault();

    const name = document.getElementById('newClientName').value.trim();
    const email = document.getElementById('newClientEmail').value.trim();
    const message = document.getElementById('newClientMessage').value.trim();

    const submitBtn = document.getElementById('submitClientBtn');
    const originalText = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading" style="display: inline-block;"></div> Envoi...';

        // 🔧 FIX: Utiliser directement l'API backend pour tout gérer (création + email)
        // On passe l'URL actuelle pour que le lien d'invitation soit correct (local ou prod)
        const currentUrl = window.location.href;
        const authUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/')) + '/auth.html';

        console.log('🔗 Base auth URL:', authUrl);

        await sendClientInvitation(email, name, message, null, CoachDashboard.coachData.id, null, authUrl);

        // ✨ NOUVEAU: Envoyer notification Brevo au coach (optionnel si pas géré par le backend principal)
        try {
            await fetch('https://ai-ikigai.ai-ikigai.workers.dev/api/notify/new-client', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    coachId: CoachDashboard.coachData.id,
                    clientName: name,
                    clientEmail: email
                })
            });
        } catch (notifError) {
            console.warn('⚠️ Notification Brevo échouée (non bloquant):', notifError);
        }

        alert(`✅ Invitation envoyée à ${email} !`);
        closeAddClientModal();

        // Recharger la liste des clients
        const clients = await loadClients();
        if (typeof displayClientsTable === 'function') {
            displayClientsTable(clients);
        }

    } catch (error) {
        console.error('Erreur:', error);
        alert(`❌ Erreur : ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}
// generateInvitationToken removed as it is handled by backend now

async function sendClientInvitation(email, clientName, personalMessage, inviteLink, coachId, invitationToken, inviteBaseUrl) {
    try {
        const response = await fetch('https://ai-ikigai.ai-ikigai.workers.dev/api/send-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                clientName,
                coachName: CoachDashboard.coachData?.name || 'Votre Coach',
                personalMessage,
                inviteLink, // Peut être null maintenant
                coachId,
                invitationToken, // Peut être null
                inviteBaseUrl // ✨ Nouvelle URL de base
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Échec envoi email');
        }

        return await response.json();
    } catch (error) {
        console.error('Erreur envoi:', error);
        throw error;
    }
}

// Exporter les fonctions
window.addNewClient = addNewClient;
window.closeAddClientModal = closeAddClientModal;
window.handleAddNewClient = handleAddNewClient;
