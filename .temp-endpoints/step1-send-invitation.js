// STEP 1: /api/send-invitation endpoint + generateInvitationEmailHTML function

// À insérer avant la section "// GET /api/dashboard/admin/stats" (ligne ~893)

// ============ INVITATION ENDPOINT ============

// POST /api/send-invitation
if (path === '/api/send-invitation' && method === 'POST') {
    try {
        const { to, clientName, coachName, personalMessage, inviteLink } = await request.json();

        // Validation
        if (!to || !clientName || !coachName || !inviteLink) {
            return errorResponse('Champs requis manquants: to, clientName, coachName, inviteLink', 400);
        }

        // Vérifier si la clé API Resend est configurée
        if (!env.RESEND_API_KEY) {
            console.error('❌ RESEND_API_KEY non configurée');
            return errorResponse('Service d\\'envoi d\\'email non configuré', 500);
        }

        // Générer le HTML de l'email
        const emailHTML = generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink);

        // Payload Resend API
        const resendPayload = {
            from: `${coachName} via AI-Ikigai <noreply@ai-ikigai.com>`,
            to: [to],
            reply_to: 'contact@ai-ikigai.com',
            subject: `${coachName} vous invite à découvrir votre Ikigai ✨`,
            html: emailHTML
        };

        console.log('📧 Envoi email invitation via Resend:', to);

        // Appel API Resend
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.RESEND_API_KEY}`
            },
            body: JSON.stringify(resendPayload)
        });

        const result = await response.json();

        if (!response.ok) {
            console.error('❌ Erreur Resend:', result);
            const errorMessage = result.message || result.error || 'Échec envoi email';
            return errorResponse(`Erreur Resend: ${errorMessage}`, 500);
        }

        console.log('✅ Email envoyé via Resend:', result.id);

        return jsonResponse({
            success: true,
            message: 'Email envoyé avec succès',
            emailId: result.id
        });

    } catch (error) {
        console.error('❌ Erreur endpoint send-invitation:', error);
        return errorResponse(error.message, 500);
    }
}
