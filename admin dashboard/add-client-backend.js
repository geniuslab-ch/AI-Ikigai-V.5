/**
 * AI-IKIGAI Backend - Add Client API Routes
 * À ajouter dans src/index.js (Cloudflare Worker)
 */

// =============================================
// Route : Ajouter un client existant
// =============================================

/**
 * POST /api/coach/clients/add-existing
 * Associer un client existant à un coach
 */
app.post('/api/coach/clients/add-existing', authMiddleware, async (c) => {
  try {
    const coachId = c.get('userId');
    const { email } = await c.req.json();
    
    if (!email) {
      return c.json({ error: 'Email requis' }, 400);
    }
    
    // 1. Vérifier que le coach existe et a le bon rôle
    const coach = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND role = ?'
    ).bind(coachId, 'coach').first();
    
    if (!coach) {
      return c.json({ error: 'Coach non trouvé' }, 404);
    }
    
    // 2. Rechercher le client par email
    const client = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ? AND role = ?'
    ).bind(email, 'client').first();
    
    if (!client) {
      return c.json({ 
        success: false,
        error: 'Client not found',
        message: 'Aucun client trouvé avec cet email'
      }, 404);
    }
    
    // 3. Vérifier que le client a complété son questionnaire
    const questionnaire = await c.env.DB.prepare(
      'SELECT * FROM questionnaires WHERE user_id = ? AND status = ?'
    ).bind(client.id, 'completed').first();
    
    if (!questionnaire) {
      return c.json({ 
        success: false,
        error: 'Client has no questionnaire completed',
        message: 'Ce client n\'a pas encore complété son questionnaire Ikigai'
      }, 400);
    }
    
    // 4. Vérifier que l'association n'existe pas déjà
    const existingAssociation = await c.env.DB.prepare(
      'SELECT * FROM coach_clients WHERE coach_id = ? AND client_id = ?'
    ).bind(coachId, client.id).first();
    
    if (existingAssociation) {
      return c.json({ 
        success: false,
        error: 'Client already associated',
        message: 'Ce client est déjà dans votre liste'
      }, 400);
    }
    
    // 5. Créer l'association coach-client
    await c.env.DB.prepare(
      'INSERT INTO coach_clients (coach_id, client_id, status, created_at) VALUES (?, ?, ?, ?)'
    ).bind(coachId, client.id, 'active', new Date().toISOString()).run();
    
    // 6. Envoyer une notification au client (optionnel)
    await sendClientNotification(c.env, client.email, coach.name);
    
    // 7. Décrémenter les crédits du coach
    await decrementCoachCredits(c.env.DB, coachId);
    
    // 8. Récupérer les données complètes du client
    const clientData = await getClientData(c.env.DB, client.id, questionnaire.id);
    
    return c.json({
      success: true,
      message: 'Client ajouté avec succès',
      client: clientData
    });
    
  } catch (error) {
    console.error('Error adding existing client:', error);
    return c.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Une erreur est survenue'
    }, 500);
  }
});

// =============================================
// Route : Inviter un nouveau client
// =============================================

/**
 * POST /api/coach/clients/invite
 * Inviter un nouveau client à rejoindre AI-Ikigai
 */
app.post('/api/coach/clients/invite', authMiddleware, async (c) => {
  try {
    const coachId = c.get('userId');
    const { name, email, phone, message } = await c.req.json();
    
    if (!name || !email) {
      return c.json({ error: 'Nom et email requis' }, 400);
    }
    
    // 1. Vérifier que le coach existe
    const coach = await c.env.DB.prepare(
      'SELECT * FROM users WHERE id = ? AND role = ?'
    ).bind(coachId, 'coach').first();
    
    if (!coach) {
      return c.json({ error: 'Coach non trouvé' }, 404);
    }
    
    // 2. Vérifier que l'email n'existe pas déjà
    const existingUser = await c.env.DB.prepare(
      'SELECT * FROM users WHERE email = ?'
    ).bind(email).first();
    
    if (existingUser) {
      return c.json({ 
        success: false,
        error: 'Email already exists',
        message: 'Un compte existe déjà avec cet email'
      }, 400);
    }
    
    // 3. Créer un compte client temporaire (sans mot de passe)
    const clientResult = await c.env.DB.prepare(
      'INSERT INTO users (email, name, role, status, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(email, name, 'client', 'pending', new Date().toISOString()).run();
    
    const clientId = clientResult.meta.last_row_id;
    
    // 4. Créer l'association coach-client en statut "pending"
    await c.env.DB.prepare(
      'INSERT INTO coach_clients (coach_id, client_id, status, created_at) VALUES (?, ?, ?, ?)'
    ).bind(coachId, clientId, 'pending', new Date().toISOString()).run();
    
    // 5. Générer un token d'invitation unique
    const invitationToken = generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expire dans 7 jours
    
    await c.env.DB.prepare(
      'INSERT INTO invitations (token, user_id, coach_id, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(invitationToken, clientId, coachId, expiresAt.toISOString(), new Date().toISOString()).run();
    
    // 6. Envoyer l'email d'invitation
    const invitationUrl = `${c.env.FRONTEND_URL}/invite/${invitationToken}`;
    
    await sendInvitationEmail(c.env, {
      clientEmail: email,
      clientName: name,
      coachName: coach.name,
      invitationUrl,
      personalMessage: message,
      phone
    });
    
    // 7. Retourner les données du client
    return c.json({
      success: true,
      message: 'Invitation envoyée avec succès',
      client: {
        id: clientId,
        name,
        email,
        avatar: name.split(' ').map(n => n[0]).join('').toUpperCase(),
        score: null,
        lastAnalysis: null,
        nextSession: null,
        status: 'pending'
      },
      invitationToken
    });
    
  } catch (error) {
    console.error('Error inviting new client:', error);
    return c.json({ 
      success: false,
      error: 'Internal server error',
      message: 'Une erreur est survenue'
    }, 500);
  }
});

// =============================================
// Route : Accepter une invitation
// =============================================

/**
 * GET /api/invite/:token
 * Vérifier et récupérer les détails d'une invitation
 */
app.get('/api/invite/:token', async (c) => {
  try {
    const token = c.req.param('token');
    
    // Récupérer l'invitation
    const invitation = await c.env.DB.prepare(
      `SELECT i.*, u.email, u.name, c.name as coach_name 
       FROM invitations i
       JOIN users u ON i.user_id = u.id
       JOIN users c ON i.coach_id = c.id
       WHERE i.token = ? AND i.used = 0`
    ).bind(token).first();
    
    if (!invitation) {
      return c.json({ error: 'Invitation invalide ou déjà utilisée' }, 404);
    }
    
    // Vérifier l'expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return c.json({ error: 'Invitation expirée' }, 400);
    }
    
    return c.json({
      success: true,
      invitation: {
        email: invitation.email,
        name: invitation.name,
        coachName: invitation.coach_name
      }
    });
    
  } catch (error) {
    console.error('Error fetching invitation:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

/**
 * POST /api/invite/:token/accept
 * Accepter une invitation et créer le compte
 */
app.post('/api/invite/:token/accept', async (c) => {
  try {
    const token = c.req.param('token');
    const { password } = await c.req.json();
    
    if (!password || password.length < 8) {
      return c.json({ error: 'Mot de passe requis (min 8 caractères)' }, 400);
    }
    
    // Récupérer l'invitation
    const invitation = await c.env.DB.prepare(
      'SELECT * FROM invitations WHERE token = ? AND used = 0'
    ).bind(token).first();
    
    if (!invitation) {
      return c.json({ error: 'Invitation invalide' }, 404);
    }
    
    // Vérifier l'expiration
    if (new Date(invitation.expires_at) < new Date()) {
      return c.json({ error: 'Invitation expirée' }, 400);
    }
    
    // Hasher le mot de passe
    const passwordHash = await hashPassword(password);
    
    // Mettre à jour le compte utilisateur
    await c.env.DB.prepare(
      'UPDATE users SET password_hash = ?, status = ? WHERE id = ?'
    ).bind(passwordHash, 'active', invitation.user_id).run();
    
    // Marquer l'invitation comme utilisée
    await c.env.DB.prepare(
      'UPDATE invitations SET used = 1, used_at = ? WHERE token = ?'
    ).bind(new Date().toISOString(), token).run();
    
    // Générer un token JWT
    const jwtToken = await generateJWT(c.env, invitation.user_id);
    
    return c.json({
      success: true,
      message: 'Compte créé avec succès',
      token: jwtToken,
      redirectTo: '/questionnaire'
    });
    
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return c.json({ error: 'Erreur serveur' }, 500);
  }
});

// =============================================
// Fonctions Utilitaires
// =============================================

/**
 * Récupérer les données complètes d'un client
 */
async function getClientData(DB, clientId, questionnaireId) {
  const client = await DB.prepare(
    'SELECT * FROM users WHERE id = ?'
  ).bind(clientId).first();
  
  const questionnaire = await DB.prepare(
    'SELECT * FROM questionnaires WHERE id = ?'
  ).bind(questionnaireId).first();
  
  const nextSession = await DB.prepare(
    'SELECT * FROM sessions WHERE client_id = ? AND scheduled_at > ? ORDER BY scheduled_at ASC LIMIT 1'
  ).bind(clientId, new Date().toISOString()).first();
  
  const results = questionnaire.results ? JSON.parse(questionnaire.results) : {};
  
  return {
    id: client.id,
    name: client.name,
    email: client.email,
    avatar: client.name.split(' ').map(n => n[0]).join('').toUpperCase(),
    score: results.overallScore || null,
    lastAnalysis: questionnaire.created_at,
    nextSession: nextSession ? nextSession.scheduled_at : null,
    status: 'active'
  };
}

/**
 * Décrémenter les crédits d'un coach
 */
async function decrementCoachCredits(DB, coachId) {
  await DB.prepare(
    `UPDATE coach_credits 
     SET credits_used = credits_used + 1,
         credits_remaining = credits_remaining - 1,
         updated_at = ?
     WHERE coach_id = ? AND credits_remaining > 0`
  ).bind(new Date().toISOString(), coachId).run();
}

/**
 * Générer un token d'invitation
 */
function generateInvitationToken() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = 'inv_';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Envoyer une notification au client
 */
async function sendClientNotification(env, clientEmail, coachName) {
  // TODO: Implémenter avec Resend ou autre service d'email
  const emailData = {
    to: clientEmail,
    from: env.EMAIL_FROM,
    subject: `${coachName} vous a ajouté comme client sur AI-Ikigai`,
    html: `
      <h2>Nouveau coach ajouté</h2>
      <p>${coachName} vous a ajouté à sa liste de clients sur AI-Ikigai.</p>
      <p>Vous pouvez maintenant collaborer ensemble sur votre développement professionnel.</p>
    `
  };
  
  // await sendEmail(env, emailData);
  console.log('Notification sent to:', clientEmail);
}

/**
 * Envoyer l'email d'invitation
 */
async function sendInvitationEmail(env, data) {
  const { clientEmail, clientName, coachName, invitationUrl, personalMessage, phone } = data;
  
  // TODO: Implémenter avec Resend ou autre service d'email
  const emailData = {
    to: clientEmail,
    from: env.EMAIL_FROM,
    subject: `${coachName} vous invite à découvrir votre Ikigai`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #ec4899 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .header h1 { color: white; margin: 0; }
          .content { background: #f8fafc; padding: 30px; }
          .message { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #8b5cf6; }
          .button { display: inline-block; background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #ec4899 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 50px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🌸 AI-Ikigai</h1>
            <p style="color: white; margin: 10px 0 0 0;">Découvrez votre raison d'être professionnelle</p>
          </div>
          
          <div class="content">
            <h2>Bonjour ${clientName},</h2>
            
            <p><strong>${coachName}</strong> vous invite à découvrir votre Ikigai grâce à l'intelligence artificielle.</p>
            
            ${personalMessage ? `
              <div class="message">
                <strong>Message de ${coachName} :</strong><br>
                ${personalMessage}
              </div>
            ` : ''}
            
            <h3>Qu'est-ce que l'Ikigai ?</h3>
            <p>L'Ikigai est un concept japonais qui représente votre raison d'être, l'intersection entre :</p>
            <ul>
              <li>❤️ Ce que vous aimez</li>
              <li>⭐ Ce en quoi vous êtes doué(e)</li>
              <li>💰 Ce pour quoi vous pouvez être payé(e)</li>
              <li>🌍 Ce dont le monde a besoin</li>
            </ul>
            
            <h3>Comment ça marche ?</h3>
            <ol>
              <li>Créez votre compte en quelques secondes</li>
              <li>Complétez le questionnaire Ikigai (15-20 min)</li>
              <li>Recevez votre analyse personnalisée</li>
              <li>Collaborez avec ${coachName} sur votre développement</li>
            </ol>
            
            <center>
              <a href="${invitationUrl}" class="button">
                🚀 Découvrir mon Ikigai
              </a>
            </center>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Cette invitation expire dans 7 jours.<br>
              ${phone ? `Pour toute question, contactez ${coachName} au ${phone}` : ''}
            </p>
          </div>
          
          <div class="footer">
            <p>© 2024 AI-Ikigai. Tous droits réservés.</p>
            <p>Vous recevez cet email car ${coachName} vous a invité à rejoindre AI-Ikigai.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };
  
  // await sendEmail(env, emailData);
  console.log('Invitation email sent to:', clientEmail);
}

/**
 * Hasher un mot de passe (utiliser bcrypt en production)
 */
async function hashPassword(password) {
  // TODO: Implémenter avec bcrypt ou argon2
  // Pour l'instant, simple hash (NE PAS UTILISER EN PRODUCTION)
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Générer un JWT
 */
async function generateJWT(env, userId) {
  // TODO: Implémenter la génération JWT réelle
  return 'jwt_token_' + userId;
}
