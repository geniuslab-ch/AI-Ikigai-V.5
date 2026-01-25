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
    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Format email invalide');
        return;
    }
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
        const inviteLink = `https://geniuslab-ch.github.io/AI-Ikigai-V.5/auth.html?role=client&coach_id=${CoachDashboard.coachData.id}&invitation_id=${invitation.id}&invite=${invitationToken}`;
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

        // alert(`✅ Invitation envoyée à ${email} !`);
        // closeAddClientModal();

        // AFFICHER LE LIEN DANS LA MODAL AU LIEU DE FERMER
        showInvitationSuccess(name, email, inviteLink);

        // Recharger la liste des clients en arrière-plan
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

function showInvitationSuccess(name, email, link) {
    const modalBody = document.querySelector('#addClientModal .modal-body');
    if (!modalBody) return;

    modalBody.innerHTML = `
        <div style="text-align: center; padding: 1rem;">
            <div style="width: 60px; height: 60px; background: rgba(16, 185, 129, 0.1); color: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; margin: 0 auto 1.5rem;">✓</div>
            <h3 style="color: var(--light); margin-bottom: 0.5rem;">Invitation créée pour ${name} !</h3>
            <p style="color: var(--gray); margin-bottom: 2rem;">Un email a été envoyé à ${email}.</p>

            <div style="background: rgba(139, 92, 246, 0.05); border: 1px solid var(--purple); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem; text-align: left;">
                <label style="display: block; color: var(--purple); font-size: 0.85rem; font-weight: 600; margin-bottom: 0.5rem; text-transform: uppercase;">Lien d'invitation direct</label>
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" value="${link}" readonly style="width: 100%; padding: 0.75rem; background: var(--dark); border: 1px solid var(--dark-border); border-radius: 8px; color: var(--gray); font-family: monospace; font-size: 0.9rem;" onclick="this.select()">
                    <button onclick="navigator.clipboard.writeText('${link}').then(() => this.innerText = 'Copié !').catch(() => alert('Erreur copie'))" style="background: var(--purple); color: white; border: none; border-radius: 8px; padding: 0 1.5rem; cursor: pointer; font-weight: 600; min-width: 100px;">Copier</button>
                </div>
                <p style="color: var(--gray); font-size: 0.85rem; margin-top: 0.75rem;">
                    💡 <strong style="color: var(--light);">Conseil :</strong> Copiez ce lien et envoyez-le par WhatsApp ou SMS pour être sûr que votre client le reçoive.
                </p>
            </div>

            <button onclick="closeAddClientModal()" class="btn-primary" style="width: 100%;">Terminer</button>
        </div>
    `;
}

// Exporter les fonctions
window.addNewClient = addNewClient;
window.closeAddClientModal = closeAddClientModal;
window.handleAddNewClient = handleAddNewClient;
