#!/usr/bin/env python3
"""
Script pour ajouter l'endpoint /api/send-invitation
et la fonction generateInvitationEmailHTML
"""

import re

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def add_send_invitation_endpoint(content):
    """Ajoute l'endpoint /api/send-invitation et generateInvitationEmailHTML"""
    
    # Code de l'endpoint
    endpoint_code = '''\t\t// ============ INVITATION ENDPOINT ============

\t\t// POST /api/send-invitation
\t\tif (path === '/api/send-invitation' && method === 'POST') {
\t\t\ttry {
\t\t\t\tconst { to, clientName, coachName, personalMessage, inviteLink } = await request.json();

\t\t\t\tif (!to || !clientName || !coachName || !inviteLink) {
\t\t\t\t\treturn errorResponse('Champs requis manquants: to, clientName, coachName, inviteLink', 400);
\t\t\t\t}

\t\t\t\tif (!env.RESEND_API_KEY) {
\t\t\t\t\tconsole.error('❌ RESEND_API_KEY non configurée');
\t\t\t\t\treturn errorResponse('Service d\\'envoi d\\'email non configuré', 500);
\t\t\t\t}

\t\t\t\tconst emailHTML = generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink);

\t\t\t\tconst resendPayload = {
\t\t\t\t\tfrom: `${coachName} via AI-Ikigai <noreply@ai-ikigai.com>`,
\t\t\t\t\tto: [to],
\t\t\t\t\treply_to: 'contact@ai-ikigai.com',
\t\t\t\t\tsubject: `${coachName} vous invite à découvrir votre Ikigai ✨`,
\t\t\t\t\thtml: emailHTML
\t\t\t\t};

\t\t\t\tconsole.log('📧 Envoi email invitation via Resend:', to);

\t\t\t\tconst response = await fetch('https://api.resend.com/emails', {
\t\t\t\t\tmethod: 'POST',
\t\t\t\t\theaders: {
\t\t\t\t\t\t'Content-Type': 'application/json',
\t\t\t\t\t\t'Authorization': `Bearer ${env.RESEND_API_KEY}`
\t\t\t\t\t},
\t\t\t\t\tbody: JSON.stringify(resendPayload)
\t\t\t\t});

\t\t\t\tconst result = await response.json();

\t\t\t\tif (!response.ok) {
\t\t\t\t\tconsole.error('❌ Erreur Resend:', result);
\t\t\t\t\tconst errorMessage = result.message || result.error || 'Échec envoi email';
\t\t\t\t\treturn errorResponse(`Erreur Resend: ${errorMessage}`, 500);
\t\t\t\t}

\t\t\t\tconsole.log('✅ Email envoyé via Resend:', result.id);

\t\t\t\treturn jsonResponse({
\t\t\t\t\tsuccess: true,
\t\t\t\t\tmessage: 'Email envoyé avec succès',
\t\t\t\t\temailId: result.id
\t\t\t\t});

\t\t\t} catch (error) {
\t\t\t\tconsole.error('❌ Erreur endpoint send-invitation:', error);
\t\t\t\treturn errorResponse(error.message, 500);
\t\t\t}
\t\t}

'''
    
    # Template email (à ajouter avant generatePDFHTML)
    email_template = '''// ============================================
// EMAIL TEMPLATE: Invitation Client
// ============================================

function generateInvitationEmailHTML(to, clientName, coachName, personalMessage, inviteLink) {
\treturn `
<!DOCTYPE html>
<html lang="fr">
<head>
\t<meta charset="UTF-8">
\t<meta name="viewport" content="width=device-width, initial-scale=1.0">
\t<style>
\t\tbody { font-family: Arial, sans-serif; background: #f8fafc; margin: 0; padding: 20px; }
\t\t.container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
\t\t.logo { font-size: 2.5rem; font-weight: bold; background: linear-gradient(90deg, #00d4ff, #d946ef); -webkit-background-clip: text; -webkit-text-fill-color: transparent; text-align: center; }
\t\t.personal-message { background: linear-gradient(135deg, #f1f5f9 0%, #e0e7ff 100%); padding: 20px; border-radius: 12px; margin: 25px 0; font-style: italic; border-left: 4px solid #8b5cf6; }
\t\t.cta-button { display: inline-block; background: linear-gradient(135deg, #00d4ff, #8b5cf6); color: white; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 600; box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3); }
\t</style>
</head>
<body>
\t<div class="container">
\t\t<div class="logo">AI-Ikigai</div>
\t\t<h2>Bonjour ${clientName} 👋</h2>
\t\t<p><strong>${coachName}</strong> vous invite à découvrir votre Ikigai avec AI-Ikigai !</p>
\t\t${personalMessage ? `<div class="personal-message">"${personalMessage}"<div style="text-align: right; margin-top: 10px; font-style: normal; color: #64748b;">— ${coachName}</div></div>` : ''}
\t\t<div style="margin: 30px 0;">
\t\t\t<div style="margin: 15px 0;"><span style="font-size: 1.5rem; margin-right: 12px;">🎯</span><strong>Analyse personnalisée</strong><br>Découvrez les 4 dimensions de votre Ikigai</div>
\t\t\t<div style="margin: 15px 0;"><span style="font-size: 1.5rem; margin-right: 12px;">📊</span><strong>Dashboard interactif</strong><br>Suivez votre progression</div>
\t\t\t<div style="margin: 15px 0;"><span style="font-size: 1.5rem; margin-right: 12px;">🤝</span><strong>Accompagnement coach</strong><br>Bénéficiez de l'expertise de ${coachName}</div>
\t\t</div>
\t\t<div style="text-align: center;">
\t\t\t<a href="${inviteLink}" class="cta-button">✨ Créer mon compte gratuitement</a>
\t\t</div>
\t\t<p style="text-align: center; color: #94a3b8; font-size: 0.9rem; margin-top: 30px;">Ce lien est valide pendant 7 jours</p>
\t</div>
</body>
</html>
\t`;
}

'''
    
    # Find the admin stats endpoint
    admin_match = re.search(r'(\t\t// GET /api/dashboard/admin/stats)', content)
    if not admin_match:
        raise Exception("Cannot find admin stats endpoint")
    
    insert_pos = admin_match.start()
    
    # Insert endpoint before admin
    new_content = content[:insert_pos] + endpoint_code + content[insert_pos:]
    
    # Now insert email template before generatePDFHTML
    pdf_match = re.search(r'// ============================================\n// PDF TEMPLATE: Rapport Ikigai', new_content)
    if not pdf_match:
        raise Exception("Cannot find PDF template marker")
    
    template_pos = pdf_match.start()
    final_content = new_content[:template_pos] + email_template + new_content[template_pos:]
    
    return final_content

if __name__ == '__main__':
    filepath = 'index-supabase.js'
    
    print("📖 Reading index-supabase.js...")
    content = read_file(filepath)
    
    print("✏️  Adding /api/send-invitation endpoint...")
    new_content = add_send_invitation_endpoint(content)
    
    print("💾 Writing updated file...")
    write_file(filepath, new_content)
    
    print("✅ Done! Endpoint /api/send-invitation added")
    print("   - generateInvitationEmailHTML() added")
    print("   - POST /api/send-invitation added before admin endpoints")
