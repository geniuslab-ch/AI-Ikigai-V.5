// =============================================
// GOOGLE CALENDAR INTEGRATION
// =============================================

// État global
let googleTokens = null;

// Connecter Google Calendar
function connectGoogleCalendar() {
    // Ouvrir popup OAuth
    const popup = window.open(
        'https://ai-ikigai.ai-ikigai.workers.dev/auth/google/init',
        'Google Calendar',
        'width=600,height=700,left=400,top=100'
    );

    // Écouter le message de retour
    const messageHandler = async (event) => {
        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            googleTokens = event.data.tokens;

            // Sauvegarder dans Supabase
            await saveGoogleTokens(googleTokens);

            // Mettre à jour l'UI
            const connectBtn = document.getElementById('connectGoogleBtn');
            const connectedDiv = document.getElementById('googleConnected');

            if (connectBtn) connectBtn.style.display = 'none';
            if (connectedDiv) connectedDiv.style.display = 'block';

            alert('✅ Google Calendar connecté avec succès !');

            // Retirer l'écouteur
            window.removeEventListener('message', messageHandler);
        }
    };

    window.addEventListener('message', messageHandler);
}

// Sauvegarder tokens dans Supabase
async function saveGoogleTokens(tokens) {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                google_access_token: tokens.access_token,
                google_refresh_token: tokens.refresh_token,
                google_token_expiry: new Date(Date.now() + tokens.expires_in * 1000)
            })
            .eq('id', CoachDashboard.coachData.id);

        if (error) throw error;
        console.log('✅ Google tokens sauvegardés');
    } catch (error) {
        console.error('Erreur sauvegarde tokens:', error);
    }
}

// Déconnecter Google
async function disconnectGoogleCalendar() {
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .update({
                google_access_token: null,
                google_refresh_token: null,
                google_token_expiry: null
            })
            .eq('id', CoachDashboard.coachData.id);

        if (error) throw error;

        googleTokens = null;

        const connectBtn = document.getElementById('connectGoogleBtn');
        const connectedDiv = document.getElementById('googleConnected');

        if (connectBtn) connectBtn.style.display = 'block';
        if (connectedDiv) connectedDiv.style.display = 'none';

        alert('Google Calendar déconnecté');
    } catch (error) {
        console.error('Erreur déconnexion:', error);
        alert('Erreur lors de la déconnexion');
    }
}

// Planifier une séance avec Google Calendar
async function scheduleSessionWithGoogle(clientId, sessionDate, duration = 60) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    try {
        // Charger les tokens depuis Supabase
        const { data: profile, error: profileError } = await supabaseClient
            .from('profiles')
            .select('google_access_token, google_refresh_token')
            .eq('id', CoachDashboard.coachData.id)
            .single();

        if (profileError) throw profileError;

        if (!profile || !profile.google_access_token) {
            alert('⚠️ Veuillez d\'abord connecter Google Calendar dans les Paramètres');
            return;
        }

        // Créer l'événement
        const startTime = new Date(sessionDate);
        const endTime = new Date(startTime.getTime() + duration * 60000);

        const event = {
            summary: `Séance Ikigai - ${client.name}`,
            description: `Séance de coaching Ikigai avec ${client.name}\n\nClient: ${client.email}`,
            start: {
                dateTime: startTime.toISOString(),
                timeZone: 'Europe/Paris'
            },
            end: {
                dateTime: endTime.toISOString(),
                timeZone: 'Europe/Paris'
            },
            attendees: [
                { email: client.email }
            ],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 }
                ]
            }
        };

        // Créer l'événement via worker
        const response = await fetch('https://ai-ikigai.ai-ikigai.workers.dev/api/calendar/create-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                accessToken: profile.google_access_token,
                event
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Erreur création événement');
        }

        // Enregistrer la séance dans Supabase
        const { error: sessionError } = await supabaseClient
            .from('coaching_sessions')
            .insert({
                coach_id: CoachDashboard.coachData.id,
                client_id: clientId,
                session_date: sessionDate,
                duration,
                status: 'scheduled',
                google_event_id: result.id
            });

        if (sessionError) throw sessionError;

        alert(`✅ Séance planifiée avec ${client.name} !\n\nAjouté à Google Calendar + notification envoyée au client.`);

        // Recharger le dashboard
        await loadDashboardData();

    } catch (error) {
        console.error('Erreur planification:', error);
        alert(`❌ Erreur : ${error.message}`);
    }
}

// Modifier la fonction scheduleSession existante
function scheduleSession(clientId) {
    const client = CoachDashboard.clients.find(c => c.id === clientId);
    if (!client) return;

    // Créer modal avec sélection date/heure
    const modalHTML = `
        <div class="modal active" id="scheduleModal" style="z-index: 10000;">
            <div class="modal-backdrop" onclick="closeScheduleModal()"></div>
            <div class="modal-content" style="max-width: 500px;">
                <h2>📅 Planifier une séance</h2>
                <p style="margin: 10px 0;">Client : <strong>${client.name}</strong></p>
                <p style="margin: 10px 0; color: #94a3b8;">${client.email}</p>
                
                <div style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Date et heure :</label>
                    <input type="datetime-local" id="sessionDateTime" class="form-control" 
                           min="${new Date().toISOString().slice(0, 16)}">
                </div>
                
                <div style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 8px; font-weight: 600;">Durée :</label>
                    <select id="sessionDuration" class="form-control">
                        <option value="30">30 minutes</option>
                        <option value="60" selected>1 heure</option>
                        <option value="90">1h30</option>
                        <option value="120">2 heures</option>
                    </select>
                </div>
                
                <div style="display: flex; gap: 10px; margin-top: 30px;">
                    <button class="btn-primary" style="flex: 1;" onclick="confirmScheduleSession(${clientId})">
                        ✅ Confirmer et ajouter à Calendar
                    </button>
                    <button class="btn-cancel" style="flex: 1;" onclick="closeScheduleModal()">
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function confirmScheduleSession(clientId) {
    const dateTimeInput = document.getElementById('sessionDateTime');
    const durationSelect = document.getElementById('sessionDuration');

    const dateTime = dateTimeInput?.value;
    const duration = parseInt(durationSelect?.value || '60');

    if (!dateTime) {
        alert('Veuillez sélectionner une date et heure');
        return;
    }

    // Vérifier que la date est dans le futur
    if (new Date(dateTime) < new Date()) {
        alert('La date doit être dans le futur');
        return;
    }

    closeScheduleModal();
    scheduleSessionWithGoogle(clientId, dateTime, duration);
}

function closeScheduleModal() {
    const modal = document.getElementById('scheduleModal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
    }
}

// Charger état connexion Google au démarrage
async function loadGoogleConnectionStatus() {
    try {
        console.log('📅 Checking Google Calendar connection status...');

        // Check if CoachDashboard.coachData is available, otherwise use currentUser
        const userId = (typeof CoachDashboard !== 'undefined' && CoachDashboard.coachData)
            ? CoachDashboard.coachData.id
            : (typeof currentUser !== 'undefined' && currentUser ? currentUser.id : null);

        if (!userId) {
            console.warn('⚠️ No user ID found for Google Calendar status check');
            return;
        }

        console.log('User ID for Google Calendar check:', userId);

        const { data: profile, error } = await supabaseClient
            .from('profiles')
            .select('google_access_token')
            .eq('id', userId)
            .single();

        if (error) {
            console.error('❌ Error loading Google Calendar status:', error);
            throw error;
        }

        const connectBtn = document.getElementById('connectGoogleBtn');
        const connectedDiv = document.getElementById('googleConnected');

        if (profile?.google_access_token) {
            console.log('✅ Google Calendar is connected');
            if (connectBtn) connectBtn.style.display = 'none';
            if (connectedDiv) connectedDiv.style.display = 'inline';
        } else {
            console.log('ℹ️ Google Calendar is not connected');
            if (connectBtn) connectBtn.style.display = 'block';
            if (connectedDiv) connectedDiv.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ Erreur chargement statut Google:', error);
    }
}

// Exports globaux
window.connectGoogleCalendar = connectGoogleCalendar;
window.disconnectGoogleCalendar = disconnectGoogleCalendar;
window.scheduleSessionWithGoogle = scheduleSessionWithGoogle;
window.scheduleSession = scheduleSession;
window.confirmScheduleSession = confirmScheduleSession;
window.closeScheduleModal = closeScheduleModal;
window.loadGoogleConnectionStatus = loadGoogleConnectionStatus;

console.log('🗓️ Google Calendar integration loaded');
