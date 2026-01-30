/**
 * COACH DASHBOARD LOGIC
 * Reconstructed based on backend API capabilities.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Auth Guard
    const user = await checkAuth('coach');
    if (!user) return; // checkAuth handles redirect

    if (user.role !== 'coach' && user.role !== 'admin' && user.role !== 'super_admin') {
        window.location.href = 'dashboard-client.html';
        return;
    }

    // 2. Load Dashboard Data
    loadDashboard(user);

    // 3. Setup Event Listeners
    setupEventListeners(user);
});

async function loadDashboard(user) {
    // Update User Info
    document.getElementById('coach-name').textContent = user.name || user.email;
    document.getElementById('coach-email').textContent = user.email;

    try {
        // Fetch clients via Supabase Client or API
        // Using existing DashboardAPI from supabase-client.js if available
        // OR fetching directly if DashboardAPI is restricted

        // Try getting clients from Supabase directly first (safer given corrupted files)
        const { data: clients, error } = await window.supabaseClient
            .from('coach_clients')
            .select(`
                *,
                client:client_id (id, email, name, avatar_url)
            `)
            .eq('coach_id', user.id);

        if (error) throw error;

        renderClients(clients || []);
        updateStats(clients || []);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Impossible de charger les clients');
    }
}

function renderClients(clients) {
    const defaultView = document.getElementById('clients-list');
    if (!defaultView) return;

    if (clients.length === 0) {
        defaultView.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <h3>Aucun client pour le moment</h3>
                <p>Invitez votre premier client pour commencer l'accompagnement.</p>
                <button class="btn btn-primary" onclick="openInviteModal()">
                    + Inviter un client
                </button>
            </div>
        `;
        return;
    }

    // Render Table
    let html = `
        <div class="table-container">
            <table class="clients-table">
                <thead>
                    <tr>
                        <th>Client</th>
                        <th>Statut</th>
                        <th>Date d'ajout</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;

    clients.forEach(rel => {
        const clientName = rel.client?.name || rel.invitation_email || 'Inconnu';
        const clientEmail = rel.client?.email || rel.invitation_email;
        const status = rel.status || 'pending';
        const date = new Date(rel.created_at).toLocaleDateString('fr-FR');

        // Status Badge
        let statusBadge = '';
        if (status === 'active') statusBadge = '<span class="badge badge-success">Actif</span>';
        else if (status === 'pending') statusBadge = '<span class="badge badge-warning">En attente</span>';
        else statusBadge = `<span class="badge">${status}</span>`;

        html += `
            <tr>
                <td>
                    <div class="client-info">
                        <div class="client-avatar">${clientName.charAt(0).toUpperCase()}</div>
                        <div>
                            <div class="client-name">${clientName}</div>
                            <div class="client-email">${clientEmail}</div>
                        </div>
                    </div>
                </td>
                <td>${statusBadge}</td>
                <td>${date}</td>
                <td>
                    <button class="btn-icon" onclick="viewClient('${rel.client_id}')" title="Voir dossier">👁️</button>
                    ${status === 'pending' ? `<button class="btn-icon" onclick="resendInvite('${rel.id}')" title="Relancer">📧</button>` : ''}
                </td>
            </tr>
        `;
    });

    html += `</tbody></table></div>`;
    defaultView.innerHTML = html;
}

function updateStats(clients) {
    const total = clients.length;
    const active = clients.filter(c => c.status === 'active').length;
    const pending = clients.filter(c => c.status === 'pending').length;

    if (document.getElementById('stat-total')) document.getElementById('stat-total').textContent = total;
    if (document.getElementById('stat-active')) document.getElementById('stat-active').textContent = active;
    if (document.getElementById('stat-pending')) document.getElementById('stat-pending').textContent = pending;
}

// ==========================================
// INVITATION LOGIC
// ==========================================

function setupEventListeners(user) {
    // Modal Logic
    const modal = document.getElementById('invite-modal');
    const closeBtn = document.querySelector('.close-modal');
    const cancelBtn = document.querySelector('.btn-cancel');
    const inviteForm = document.getElementById('invite-form');

    window.openInviteModal = () => {
        if (modal) modal.style.display = 'flex';
    };

    const closeModal = () => {
        if (modal) modal.style.display = 'none';
        if (inviteForm) inviteForm.reset();
    };

    if (closeBtn) closeBtn.onclick = closeModal;
    if (cancelBtn) cancelBtn.onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) closeModal();
    };

    // FORM SUBMIT
    if (inviteForm) {
        inviteForm.onsubmit = async (e) => {
            e.preventDefault();
            const btn = inviteForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;
            btn.textContent = 'Envoi...';
            btn.disabled = true;

            const formData = new FormData(inviteForm);
            const clientEmail = formData.get('email');
            const clientName = formData.get('name');
            const message = formData.get('message');

            try {
                // Prepare Payload for /api/send-invitation
                // We need to generate a link. For now, points to index.html with a param or just signup.
                // The backend creates the relation logic.

                const inviteLink = `${window.location.origin}/auth.html?coach=${user.id}&email=${encodeURIComponent(clientEmail)}`;

                const payload = {
                    to: clientEmail,
                    clientName: clientName,
                    coachName: user.name || user.email,
                    personalMessage: message,
                    inviteLink: inviteLink,
                    coachId: user.id,
                    invitationToken: 'temp-' + Date.now() // Simple token for tracking
                };

                // Call the Worker API directly
                const token = await window.AuthAPI.getToken();
                const response = await fetch('/api/send-invitation', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(payload)
                });

                const result = await response.json();

                if (!response.ok) throw new Error(result.error || 'Erreur inconnue');

                showSuccess(`Invitation envoyée à ${clientName} !`);
                closeModal();
                loadDashboard(user); // Reload list

            } catch (error) {
                console.error('Invite Error:', error);
                showError(error.message || "Erreur lors de l'envoi de l'invitation");
            } finally {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        };
    }
}

// Helpers
window.viewClient = (clientId) => {
    if (!clientId || clientId === 'null') return;
    // Save to local storage or URL param and navigate
    // For now, just alert or simple nav
    window.location.href = `dashboard-coach-clients.html?client=${clientId}`;
};

window.resendInvite = (inviteId) => {
    alert("Fonctionnalité de relance à venir - Veuillez renvoyer une nouvelle invitation pour le moment.");
};
