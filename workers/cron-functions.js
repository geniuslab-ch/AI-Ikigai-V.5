// ================================================
// HANDLER: CRON - Session Reminders & Newsletter
// ================================================
async function handleScheduled(event, env) {
    const now = new Date();
    const hour = now.getUTCHours();
    const day = now.getUTCDate();
    
    // 9h UTC = Rappels séances
    if (hour === 9) {
        await sendSessionReminders(env);
    }
    
    // 10h UTC le 1er du mois = Newsletter
    if (hour === 10 && day === 1) {
        await sendMonthlyNewsletter(env);
    }
}

// ================================================
// FONCTION: Rappels Séances (Template #2)
// ================================================
async function sendSessionReminders(env) {
    try {
        const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        
        const { data: sessions, error } = await supabaseClient
            .from('coaching_sessions')
            .select('id, session_date, google_calendar_event_id, coach_id, client_id')
            .gte('session_date', tomorrowDate + 'T00:00:00')
            .lt('session_date', tomorrowDate + 'T23:59:59')
            .eq('status', 'scheduled');
        
        if (error || !sessions || sessions.length === 0) {
            console.log('No sessions tomorrow');
            return;
        }
        
        for (const session of sessions) {
            const { data: profiles } = await supabaseClient
                .from('profiles')
                .select('id, name, email, notification_sessions')
                .in('id', [session.coach_id, session.client_id]);
            
            const coach = profiles.find(p => p.id === session.coach_id);
            const client = profiles.find(p => p.id === session.client_id);
            
            if (!coach || !client) continue;
            if (!coach.notification_sessions) continue;
            
            const sessionDate = new Date(session.session_date);
            const calendarLink = session.google_calendar_event_id
                ? 'https://calendar.google.com/calendar/event?eid=' + session.google_calendar_event_id
                : 'https://ai-ikigai.com/dashboard-coach.html';
            
            await sendBrevoEmail(env, 2, coach.email, {
                coach_name: coach.name,
                client_name: client.name,
                session_date: sessionDate.toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                }),
                session_time: sessionDate.toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                google_calendar_link: calendarLink
            });
            
            console.log('Reminder sent to ' + coach.email + ' for session with ' + client.name);
        }
        
        console.log('Sent ' + sessions.length + ' session reminders');
        
    } catch (error) {
        console.error('Error in sendSessionReminders:', error);
    }
}

// ================================================
// FONCTION: Newsletter Mensuelle (Template #3)
// ================================================
async function sendMonthlyNewsletter(env) {
    try {
        const supabaseClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
        
        const { data: coaches, error } = await supabaseClient
            .from('profiles')
            .select('email, name')
            .eq('role', 'coach')
            .eq('notification_newsletter', true);
        
        if (error || !coaches || coaches.length === 0) {
            console.log('No coaches with newsletter enabled');
            return;
        }
        
        const currentMonth = new Date().toLocaleDateString('fr-FR', { month: 'long' });
        
        for (const coach of coaches) {
            await sendBrevoEmail(env, 3, coach.email, {
                coach_name: coach.name,
                month: currentMonth
            });
            
            console.log('Newsletter sent to ' + coach.email);
        }
        
        console.log('Newsletter sent to ' + coaches.length + ' coaches');
        
    } catch (error) {
        console.error('Error in sendMonthlyNewsletter:', error);
    }
}
