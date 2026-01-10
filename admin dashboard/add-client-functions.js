/**
 * AI-IKIGAI - Add Client Functionality
 * À ajouter dans coach-dashboard.js
 */

// =============================================
// Gestion du Modal Ajout Client
// =============================================

/**
 * Ouvrir le modal d'ajout de client
 */
function addNewClient() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Reset les formulaires
        document.getElementById('existingClientFormElement').reset();
        document.getElementById('newClientFormElement').reset();
        
        // Revenir à l'onglet "Client Existant"
        switchClientTab('existing');
        
        // Masquer le message de succès
        document.getElementById('successMessage').style.display = 'none';
        document.getElementById('existingClientForm').style.display = 'block';
        document.getElementById('newClientForm').style.display = 'none';
    }
}

/**
 * Fermer le modal d'ajout de client
 */
function closeAddClientModal() {
    const modal = document.getElementById('addClientModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

/**
 * Basculer entre les onglets Client Existant / Nouveau Client
 */
function switchClientTab(tab) {
    const existingTab = document.getElementById('existingTab');
    const newTab = document.getElementById('newTab');
    const existingForm = document.getElementById('existingClientForm');
    const newForm = document.getElementById('newClientForm');
    
    if (tab === 'existing') {
        existingTab.classList.add('active');
        newTab.classList.remove('active');
        existingForm.classList.add('active');
        newForm.classList.remove('active');
    } else {
        existingTab.classList.remove('active');
        newTab.classList.add('active');
        existingForm.classList.remove('active');
        newForm.classList.add('active');
    }
}

// =============================================
// Ajout Client Existant
// =============================================

/**
 * Gérer la soumission du formulaire Client Existant
 */
async function handleExistingClient(event) {
    event.preventDefault();
    
    const email = document.getElementById('existingEmail').value.trim();
    const submitBtn = document.getElementById('existingSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Afficher le loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
        // Appel API pour rechercher et associer le client
        const result = await addExistingClient(email);
        
        if (result.success) {
            // Afficher le message de succès
            showSuccessMessage(
                'Client ajouté avec succès !',
                `${result.client.name} a été ajouté à votre liste de clients.`
            );
            
            // Recharger la liste des clients
            await loadDashboardData();
            
            // Fermer le modal après 2 secondes
            setTimeout(() => {
                closeAddClientModal();
            }, 2000);
            
        } else {
            throw new Error(result.error || 'Erreur lors de l\'ajout du client');
        }
        
    } catch (error) {
        console.error('Error adding existing client:', error);
        
        // Afficher une alerte d'erreur
        if (error.message.includes('not found')) {
            alert('❌ Aucun client trouvé avec cet email. Vérifiez l\'adresse ou invitez un nouveau client.');
        } else if (error.message.includes('already associated')) {
            alert('ℹ️ Ce client est déjà dans votre liste.');
        } else if (error.message.includes('no questionnaire')) {
            alert('⚠️ Ce client n\'a pas encore complété son questionnaire Ikigai. Invitez-le à le faire.');
        } else {
            alert('❌ Erreur : ' + error.message);
        }
        
    } finally {
        // Réinitialiser le bouton
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

/**
 * Appel API pour ajouter un client existant
 */
async function addExistingClient(email) {
    // TODO: Remplacer par l'appel API réel
    if (typeof ApiClient !== 'undefined') {
        const response = await ApiClient.post('/api/coach/clients/add-existing', {
            email: email
        });
        return response;
    }
    
    // Simulation pour démo
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simuler différents cas
            const random = Math.random();
            
            if (email === 'test@error.com') {
                reject(new Error('Client not found'));
            } else if (email === 'existing@coach.com') {
                reject(new Error('Client already associated'));
            } else if (email === 'incomplete@test.com') {
                reject(new Error('Client has no questionnaire completed'));
            } else {
                resolve({
                    success: true,
                    client: {
                        id: Date.now(),
                        name: 'Client Test',
                        email: email,
                        score: 75,
                        status: 'active'
                    }
                });
            }
        }, 1500);
    });
}

// =============================================
// Invitation Nouveau Client
// =============================================

/**
 * Gérer la soumission du formulaire Nouveau Client
 */
async function handleNewClient(event) {
    event.preventDefault();
    
    const name = document.getElementById('newName').value.trim();
    const email = document.getElementById('newEmail').value.trim();
    const phone = document.getElementById('newPhone').value.trim();
    const message = document.getElementById('newMessage').value.trim();
    
    const submitBtn = document.getElementById('newSubmitBtn');
    const btnText = submitBtn.querySelector('.btn-text');
    const btnLoading = submitBtn.querySelector('.btn-loading');
    
    // Afficher le loading
    btnText.style.display = 'none';
    btnLoading.style.display = 'flex';
    submitBtn.disabled = true;
    
    try {
        // Appel API pour inviter un nouveau client
        const result = await inviteNewClient({
            name,
            email,
            phone,
            message
        });
        
        if (result.success) {
            // Afficher le message de succès
            showSuccessMessage(
                '✉️ Invitation envoyée !',
                `Une invitation a été envoyée à ${email}. Le client apparaîtra dans votre liste une fois qu'il aura complété son questionnaire Ikigai.`
            );
            
            // Optionnel : Ajouter le client en statut "pending" immédiatement
            if (result.client) {
                CoachDashboard.clients.unshift({
                    ...result.client,
                    status: 'pending'
                });
                renderClientsTable(CoachDashboard.clients);
            }
            
            // Fermer le modal après 3 secondes
            setTimeout(() => {
                closeAddClientModal();
            }, 3000);
            
        } else {
            throw new Error(result.error || 'Erreur lors de l\'envoi de l\'invitation');
        }
        
    } catch (error) {
        console.error('Error inviting new client:', error);
        
        // Afficher une alerte d'erreur
        if (error.message.includes('already exists')) {
            alert('ℹ️ Un compte existe déjà avec cet email. Utilisez l\'onglet "Client Existant" pour l\'ajouter.');
        } else if (error.message.includes('invalid email')) {
            alert('❌ L\'adresse email n\'est pas valide.');
        } else {
            alert('❌ Erreur : ' + error.message);
        }
        
    } finally {
        // Réinitialiser le bouton
        btnText.style.display = 'inline';
        btnLoading.style.display = 'none';
        submitBtn.disabled = false;
    }
}

/**
 * Appel API pour inviter un nouveau client
 */
async function inviteNewClient(data) {
    // TODO: Remplacer par l'appel API réel
    if (typeof ApiClient !== 'undefined') {
        const response = await ApiClient.post('/api/coach/clients/invite', data);
        return response;
    }
    
    // Simulation pour démo
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simuler différents cas
            if (data.email === 'exists@email.com') {
                reject(new Error('Email already exists'));
            } else if (!data.email.includes('@')) {
                reject(new Error('Invalid email format'));
            } else {
                resolve({
                    success: true,
                    client: {
                        id: Date.now(),
                        name: data.name,
                        email: data.email,
                        avatar: data.name.split(' ').map(n => n[0]).join('').toUpperCase(),
                        score: null,
                        lastAnalysis: null,
                        nextSession: null,
                        status: 'pending'
                    },
                    invitationToken: 'inv_' + Math.random().toString(36).substr(2, 9)
                });
            }
        }, 2000);
    });
}

// =============================================
// Message de Succès
// =============================================

/**
 * Afficher le message de succès dans le modal
 */
function showSuccessMessage(title, text) {
    // Masquer les formulaires
    document.getElementById('existingClientForm').style.display = 'none';
    document.getElementById('newClientForm').style.display = 'none';
    
    // Afficher le message de succès
    const successMessage = document.getElementById('successMessage');
    const successTitle = document.getElementById('successTitle');
    const successText = document.getElementById('successText');
    
    successTitle.textContent = title;
    successText.textContent = text;
    successMessage.style.display = 'block';
}

// =============================================
// Événements Clavier
// =============================================

// Fermer le modal avec Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const addModal = document.getElementById('addClientModal');
        if (addModal && addModal.classList.contains('active')) {
            closeAddClientModal();
        }
    }
});

// Fermer en cliquant à l'extérieur
document.addEventListener('click', (e) => {
    const addModal = document.getElementById('addClientModal');
    if (addModal && e.target === addModal) {
        closeAddClientModal();
    }
});

// =============================================
// Export des fonctions
// =============================================

window.addNewClient = addNewClient;
window.closeAddClientModal = closeAddClientModal;
window.switchClientTab = switchClientTab;
window.handleExistingClient = handleExistingClient;
window.handleNewClient = handleNewClient;

console.log('✅ Add Client functionality loaded');
