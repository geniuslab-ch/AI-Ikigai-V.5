#!/bin/bash

# ============================================
# AI-Ikigai Dashboards - Setup Script
# Prépare la structure pour le déploiement
# ============================================

echo "🚀 AI-Ikigai Dashboards - Setup Script"
echo "========================================"
echo ""

# Créer la structure des dossiers
echo "📁 Création de la structure des dossiers..."
mkdir -p public

# Copier les fichiers dashboards dans public/
echo "📋 Copie des fichiers dashboards..."

# Dashboard Client
if [ -f "dashboard.html" ]; then
    cp dashboard.html public/
    echo "✅ dashboard.html copié"
fi

if [ -f "dashboard.js" ]; then
    cp dashboard.js public/
    echo "✅ dashboard.js copié"
fi

if [ -f "dashboard.css" ]; then
    cp dashboard.css public/
    echo "✅ dashboard.css copié"
fi

# Dashboard Coach
if [ -f "coach-dashboard.html" ]; then
    cp coach-dashboard.html public/
    echo "✅ coach-dashboard.html copié"
fi

if [ -f "coach-dashboard.js" ]; then
    cp coach-dashboard.js public/
    echo "✅ coach-dashboard.js copié"
fi

# Dashboard Admin
if [ -f "admin-dashboard.html" ]; then
    cp admin-dashboard.html public/
    echo "✅ admin-dashboard.html copié"
fi

if [ -f "admin-dashboard.js" ]; then
    cp admin-dashboard.js public/
    echo "✅ admin-dashboard.js copié"
fi

# Fichiers communs
if [ -f "api.js" ]; then
    cp api.js public/
    echo "✅ api.js copié"
fi

if [ -f "invite.html" ]; then
    cp invite.html public/
    echo "✅ invite.html copié"
fi

if [ -f "add-client-modal.html" ]; then
    cp add-client-modal.html public/
    echo "✅ add-client-modal.html copié"
fi

if [ -f "add-client-functions.js" ]; then
    cp add-client-functions.js public/
    echo "✅ add-client-functions.js copié"
fi

# Fichiers de configuration
if [ -f "_headers" ]; then
    cp _headers public/
    echo "✅ _headers copié"
fi

if [ -f "_redirects" ]; then
    cp _redirects public/
    echo "✅ _redirects copié"
fi

# Créer une page 404 si elle n'existe pas
if [ ! -f "public/404.html" ]; then
    echo "📄 Création de la page 404..."
    cat > public/404.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>404 - Page non trouvée | AI-Ikigai</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Outfit', sans-serif;
            background: #0a0a0f;
            color: #f8fafc;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        .bg-gradient {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(ellipse at 20% 20%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%);
            z-index: 0;
        }
        .container {
            max-width: 600px;
            padding: 2rem;
            position: relative;
            z-index: 1;
        }
        h1 {
            font-family: 'Sora', sans-serif;
            font-size: clamp(4rem, 10vw, 8rem);
            background: linear-gradient(90deg, #00d4ff 0%, #d946ef 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin: 0;
            font-weight: 700;
        }
        h2 {
            font-family: 'Sora', sans-serif;
            font-size: clamp(1.5rem, 4vw, 2.5rem);
            margin: 1rem 0;
            font-weight: 600;
        }
        p {
            color: #94a3b8;
            margin-bottom: 2rem;
            font-size: 1.1rem;
            line-height: 1.6;
        }
        a {
            display: inline-block;
            background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 50%, #ec4899 100%);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        a:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 40px rgba(139, 92, 246, 0.4);
        }
        .icon {
            font-size: 4rem;
            margin-bottom: 1rem;
        }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="container">
        <div class="icon">🌸</div>
        <h1>404</h1>
        <h2>Page non trouvée</h2>
        <p>Désolé, la page que vous recherchez n'existe pas ou a été déplacée.</p>
        <a href="/">← Retour à l'accueil</a>
    </div>
</body>
</html>
EOF
    echo "✅ 404.html créé"
fi

# Créer une page d'index si elle n'existe pas
if [ ! -f "public/index.html" ]; then
    echo "📄 Création de la page index..."
    cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI-Ikigai Dashboards</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Sora:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Outfit', sans-serif;
            background: #0a0a0f;
            color: #f8fafc;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        .bg-gradient {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(ellipse at 20% 20%, rgba(0, 212, 255, 0.15) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%);
            z-index: 0;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            text-align: center;
            position: relative;
            z-index: 1;
        }
        h1 {
            font-family: 'Sora', sans-serif;
            font-size: clamp(2.5rem, 6vw, 4rem);
            background: linear-gradient(90deg, #00d4ff 0%, #d946ef 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 1rem;
            font-weight: 700;
        }
        p {
            color: #94a3b8;
            font-size: 1.2rem;
            margin-bottom: 3rem;
        }
        .dashboards {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-top: 3rem;
        }
        .dashboard-card {
            background: #12121a;
            border: 1px solid #1f1f2e;
            border-radius: 20px;
            padding: 2rem;
            text-decoration: none;
            color: #f8fafc;
            transition: all 0.3s ease;
        }
        .dashboard-card:hover {
            border-color: #8b5cf6;
            transform: translateY(-4px);
        }
        .dashboard-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        .dashboard-title {
            font-family: 'Sora', sans-serif;
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .dashboard-desc {
            color: #94a3b8;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <div class="bg-gradient"></div>
    <div class="container">
        <h1>🌸 AI-Ikigai Dashboards</h1>
        <p>Choisissez votre interface</p>
        
        <div class="dashboards">
            <a href="/dashboard.html" class="dashboard-card">
                <div class="dashboard-icon">🎯</div>
                <div class="dashboard-title">Client</div>
                <div class="dashboard-desc">Votre analyse Ikigai personnalisée</div>
            </a>
            
            <a href="/coach-dashboard.html" class="dashboard-card">
                <div class="dashboard-icon">🎓</div>
                <div class="dashboard-title">Coach</div>
                <div class="dashboard-desc">Gérez vos clients et analyses</div>
            </a>
            
            <a href="/admin-dashboard.html" class="dashboard-card">
                <div class="dashboard-icon">⚡</div>
                <div class="dashboard-title">Admin</div>
                <div class="dashboard-desc">Administration de la plateforme</div>
            </a>
        </div>
    </div>
</body>
</html>
EOF
    echo "✅ index.html créé"
fi

echo ""
echo "✅ Setup terminé !"
echo ""
echo "📦 Structure créée :"
echo "   public/"
echo "   ├── dashboard.html (Client)"
echo "   ├── coach-dashboard.html (Coach)"
echo "   ├── admin-dashboard.html (Admin)"
echo "   ├── *.js (Scripts)"
echo "   ├── _headers"
echo "   ├── _redirects"
echo "   ├── 404.html"
echo "   └── index.html"
echo ""
echo "🚀 Prochaines étapes :"
echo "   1. git init (si pas déjà fait)"
echo "   2. git add ."
echo "   3. git commit -m 'Initial commit'"
echo "   4. git remote add origin https://github.com/username/repo.git"
echo "   5. git push -u origin main"
echo "   6. Connecter à Cloudflare Pages"
echo ""
echo "📖 Voir DEPLOYMENT_README.md pour plus de détails"
echo ""
