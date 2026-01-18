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

        // Générer token d'invitation
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

        // Envoyer l'email d'invitation au client
        // IMPORTANT: Using GitHub Pages URL because custom domain DNS is not configured
        const inviteLink = `https://geniuslab-ch.github.io/AI-Ikigai-V.5/auth.html?invite=${invitationToken}`;
        await sendClientInvitation(email, name, message, inviteLink, CoachDashboard.coachData.id, invitationToken);


        // ✨ NOUVEAU: Envoyer notification Brevo au coach
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
            console.log('✅ Notification Brevo envoyée au coach');
        } catch (notifError) {
            console.warn('⚠️ Notification Brevo échouée (non bloquant):', notifError);
            // Ne pas bloquer le flow si la notification échoue
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

function generateInvitationToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

async function sendClientInvitation(email, clientName, personalMessage, inviteLink, coachId, invitationToken) {
    try {
        const response = await fetch('https://ai-ikigai.ai-ikigai.workers.dev/api/send-invitation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: email,
                clientName,
                coachName: CoachDashboard.coachData?.name || 'Votre Coach',
                personalMessage,
                inviteLink,
                coachId,
                invitationToken
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
