// =============================================
// MODAL NOUVEAU CLIENT
// =============================================

function addNewClient() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Réinitialiser le formulaire
        const form = document.getElementById('addClientForm');
        if (form) form.reset();
    }
}

function closeAddClientModal() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.classList.remove('active');
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
        // Désactiver le bouton
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<div class="loading" style="display: inline-block;"></div> Envoi en cours...';

        // Générer un token unique
        const invitationToken = generateInvitationToken();

        // Créer l'invitation dans Supabase
        const { data: invitation, error } = await supabaseClient
            .from('client_invitations')
            .insert({
                coach_id: CoachDashboard.coachData.id,
                client_email: email,
                client_name: name,
                personal_message: message || null,
                invitation_token: invitationToken,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        // Envoyer l'email d'invitation
        const inviteLink = `${window.location.origin}/auth.html?invite=${invitationToken}`;
        await sendClientInvitation(email, name, message, inviteLink);

        // Succès
        alert(`✅ Invitation envoyée avec succès à ${email} !`);
        closeAddClientModal();

        // Optionnel : recharger la liste des clients
        // await loadDashboardData();

    } catch (error) {
        console.error('Erreur lors de l\'ajout du client:', error);
        alert(`❌ Erreur : ${error.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

function generateInvitationToken() {
    // Générer un token aléatoire sécurisé
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendClientInvitation(email, clientName, personalMessage, inviteLink) {
    // TODO: Appel API backend pour envoyer l'email via Cloudflare Workers
    // Pour l'instant, on simule l'envoi
    console.log('📧 Envoi invitation email:', {
        to: email,
        clientName,
        coachName: CoachDashboard.coachData.name,
        personalMessage,
        inviteLink
    });

    // Dans une vraie implémentation :
    /*
    const response = await fetch('https://ai-ikigai.workers.dev/api/send-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: email,
            clientName,
            coachName: CoachDashboard.coachData.name,
            personalMessage,
            inviteLink
        })
    });
    
    if (!response.ok) {
        throw new Error('Échec envoi email');
    }
    */

    // Simulation réussie
    return Promise.resolve();
}

// Exporter les fonctions
window.addNewClient = addNewClient;
window.closeAddClientModal = closeAddClientModal;
window.handleAddNewClient = handleAddNewClient;
