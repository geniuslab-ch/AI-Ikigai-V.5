// =============================================
// Point 4a: Google Calendar Green Status
// =============================================

async function updateGoogleCalendarStatus() {
    const user = await checkAuth('coach');
    if (!user) return;
    
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('google_calendar_token')
        .eq('id', user.id)
        .single();
    
    const isConnected = !!profile?.google_calendar_token;
    const button = document.getElementById('googleCalendarBtn');
    
    if (button && isConnected) {
        button.style.background = 'linear-gradient(135deg, #10b981, #059669)';
        button.innerHTML = '✓ Connecté';
    }
}

// =============================================
// Point 4c: Newsletter Persistence
// =============================================

async function loadNotificationPreferences() {
    const user = await checkAuth('coach');
    if (!user) return;
    
    const { data: profile } = await supabaseClient
        .from('profiles')
        .select('notification_newsletter, notification_new_clients, notification_sessions')
        .eq('id', user.id)
        .single();
    
    if (profile) {
        const newsletterEl = document.getElementById('notifNewsletter');
        const newClientsEl = document.getElementById('notifNewClients');
        const sessionsEl = document.getElementById('notifSessions');
        
        if (newsletterEl) newsletterEl.checked = profile.notification_newsletter || false;
        if (newClientsEl) newClientsEl.checked = profile.notification_new_clients || false;
        if (sessionsEl) sessionsEl.checked = profile.notification_sessions || false;
    }
}

// Call on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        updateGoogleCalendarStatus();
        loadNotificationPreferences();
    });
} else {
    updateGoogleCalendarStatus();
    loadNotificationPreferences();
}
