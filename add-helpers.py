#!/usr/bin/env python3
"""
Script pour ajouter les fonctions helper et les endpoints manquants
dans index-supabase.js de manière sécurisée
"""

import re

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

def add_helper_functions(content):
    """Ajoute generatePDFHTML et sendBrevoEmail avant export default"""
    
    helper_functions = '''
// ============================================
// PDF TEMPLATE: Rapport Ikigai
// ============================================

function generatePDFHTML(client, analysis) {
\tconst date = new Date().toLocaleDateString('fr-FR');
\t
\t// Support both legacy and new structures
\tconst score = analysis.score || analysis.ikigai_dimensions || {};
\tconst passionScore = score.passion_score || score.passion || 0;
\tconst professionScore = score.profession_score || score.profession || 0;
\tconst missionScore = score.mission_score || score.mission || 0;
\tconst vocationScore = score.vocation_score || score.vocation || 0;
\t
\tconst globalScore = Math.round((passionScore + professionScore + missionScore + vocationScore) / 4);

\treturn `
<!DOCTYPE html>
<html lang="fr">
<head>
\t<meta charset="UTF-8">
\t<title>Rapport Ikigai - ${client.name}</title>
\t<style>
\t\tbody { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; }
\t\t.header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; }
\t\t.logo { font-size: 2.5rem; font-weight: bold; color: #8b5cf6; }
\t\t.dimension { margin: 25px 0; padding: 20px; background: #f8fafc; border-left: 4px solid #8b5cf6; }
\t\t.score-value { font-size: 4rem; font-weight: bold; color: #8b5cf6; }
\t\t.dimension-score { font-size: 2rem; color: #8b5cf6; }
\t\t.progress-bar { width: 100%; height: 20px; background: #e2e8f0; border-radius: 10px; overflow: hidden; }
\t\t.progress- fill { height: 100%; background: linear-gradient(90deg, #00d4ff, #8b5cf6); }
\t\t@media print { .no-print { display: none; } }
\t</style>
</head>
<body>
\t<div class="header">
\t\t<div class="logo">AI-Ikigai</div>
\t\t<h1>Rapport d'Analyse Ikigai</h1>
\t</div>
\t<div style="margin: 30px 0; background: #f8fafc; padding: 20px; border-radius: 8px;">
\t\t<h2>${client.name}</h2>
\t\t<p><strong>Email:</strong> ${client.email}</p>
\t\t<p><strong>Date:</strong> ${date}</p>
\t</div>
\t<div style="text-align: center; margin: 40px 0;">
\t\t<h2>Score Global</h2>
\t\t<div class="score-value">${globalScore}%</div>
\t</div>
\t<h2>Les 4 Dimensions</h2>
\t<div class="dimension">
\t\t<h3>🎯 Passion</h3>
\t\t<div class="dimension-score">${passionScore}%</div>
\t\t<div class="progress-bar"><div class="progress-fill" style="width: ${passionScore}%"></div></div>
\t</div>
\t<div class="dimension">
\t\t<h3>⭐ Profession</h3>
\t\t<div class="dimension-score">${professionScore}%</div>
\t\t<div class="progress-bar"><div class="progress-fill" style="width: ${professionScore}%"></div></div>
\t</div>
\t<div class="dimension">
\t\t<h3>🌍 Mission</h3>
\t\t<div class="dimension-score">${missionScore}%</div>
\t\t<div class="progress-bar"><div class="progress-fill" style="width: ${missionScore}%"></div></div>
\t</div>
\t<div class="dimension">
\t\t<h3>💰 Vocation</h3>
\t\t<div class="dimension-score">${vocationScore}%</div>
\t\t<div class="progress-bar"><div class="progress-fill" style="width: ${vocationScore}%"></div></div>
\t</div>
\t<div class="no-print" style="text-align: center; margin: 40px 0;">
\t\t<button onclick="window.print()" style="padding: 12px 30px; background: #8b5cf6; color: white; border: none; border-radius: 6px; cursor: pointer;">
\t\t\t📄 Imprimer / Sauvegarder PDF
\t\t</button>
\t</div>
</body>
</html>
\t`;
}

// ============================================
// BREVO EMAIL: Envoi via API
// ============================================

async function sendBrevoEmail(env, templateId, toEmail, params) {
\tif (!env.BREVO_API_KEY) {
\t\tthrow new Error('BREVO_API_KEY not configured');
\t}

\tconst response = await fetch('https://api.brevo.com/v3/smtp/email', {
\t\tmethod: 'POST',
\t\theaders: {
\t\t\t'api-key': env.BREVO_API_KEY,
\t\t\t'Content-Type': 'application/json'
\t\t},
\t\tbody:JSON.stringify({
\t\t\ttemplateId: parseInt(templateId),
\t\t\tto: [{ email: toEmail }],
\t\t\tparams: params
\t\t})
\t});

\tif (!response.ok) {
\t\tconst errorData = await response.json();
\t\tconsole.error('Brevo API Error:', errorData);
\t\tthrow new Error(`Brevo error: ${errorData.message || response.statusText}`);
\t}

\treturn await response.json();
}

'''
    
    # Find the export default position
    export_match = re.search(r'export default \{', content)
    if not export_match:
        raise Exception("Cannot find 'export default {' in file")
    
    insert_pos = export_match.start()
    
    # Insert helper functions before export
    new_content = content[:insert_pos] + helper_functions + content[insert_pos:]
    
    return new_content

if __name__ == '__main__':
    filepath = 'index-supabase.js'
    
    print("📖 Reading index-supabase.js...")
    content = read_file(filepath)
    
    print("✏️  Adding helper functions...")
    new_content = add_helper_functions(content)
    
    print("💾 Writing updated file...")
    write_file(filepath, new_content)
    
    print("✅ Done! Helper functions added before 'export default'")
