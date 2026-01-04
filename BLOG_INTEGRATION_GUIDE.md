# 📝 Guide d'Intégration Blog AI-Ikigai

## Vue d'ensemble

Ce guide explique comment intégrer et déployer le blog AI-Ikigai. Deux options principales :
1. **Cloudflare Pages** (recommandé) - Blog statique avec articles en Markdown/HTML
2. **WordPress Headless** - WordPress comme CMS, front-end statique sur Cloudflare

## 🎯 Option 1 : Blog Statique sur Cloudflare Pages (Recommandé)

### Avantages
- ✅ Performances maximales
- ✅ Coût minimal (gratuit)
- ✅ Sécurité optimale
- ✅ SEO excellent
- ✅ Maintenance simplifiée

### Structure des Fichiers

```
public/
├── blog.html                    # Page principale du blog
├── blog.js                      # Logique JavaScript
├── blog/
│   ├── quest-ce-que-ikigai/
│   │   └── index.html          # Article 1
│   ├── 5-signes-desalignement/
│   │   └── index.html          # Article 2
│   └── ...
└── assets/
    └── blog/
        ├── featured.jpg
        ├── ikigai-intro.jpg
        └── ...
```

### Ajout d'un Nouvel Article

#### Méthode 1 : HTML Direct

```html
<!-- public/blog/mon-nouvel-article/index.html -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <title>Titre de l'Article | Blog AI-Ikigai</title>
    <!-- Copier le head de blog-article-template.html -->
</head>
<body>
    <!-- Copier la structure de blog-article-template.html -->
    <!-- Remplacer le contenu -->
</body>
</html>
```

#### Méthode 2 : Générateur de Blog Statique (Recommandé)

Utilisez un générateur comme **11ty** ou **Hugo** :

**Avec 11ty** :

```bash
# Installation
npm install -g @11ty/eleventy

# Créer un article en Markdown
```

```markdown
---
title: Mon Nouvel Article
date: 2024-12-15
category: ikigai
author: Marie Dubois
excerpt: Description courte de l'article
image: /assets/blog/mon-article.jpg
---

# Mon Nouvel Article

Contenu de l'article en Markdown...

## Section 1

Texte...
```

**Configuration 11ty** :

```.eleventy.js
// .eleventy.js
module.exports = function(eleventyConfig) {
  return {
    dir: {
      input: "src",
      output: "public"
    }
  };
};
```

### Workflow de Publication

```bash
# 1. Créer un nouvel article
mkdir -p public/blog/mon-article
cp blog-article-template.html public/blog/mon-article/index.html

# 2. Éditer le contenu
# Ouvrir public/blog/mon-article/index.html
# Remplacer le contenu

# 3. Ajouter l'article à la liste (blog.js)
# Éditer public/blog.js
# Ajouter dans blogArticles[]

# 4. Commit et push
git add .
git commit -m "Ajout article: Mon Nouvel Article"
git push

# 5. Cloudflare déploie automatiquement !
```

### Mise à Jour de la Liste des Articles

```javascript
// Dans public/blog.js

const blogArticles = [
    // ... articles existants ...
    
    // Nouvel article
    {
        id: 10,
        title: "Mon Nouvel Article",
        slug: "mon-nouvel-article",
        excerpt: "Description courte...",
        category: "ikigai",
        categoryLabel: "🌸 Ikigai",
        date: "2024-12-15",
        readTime: "7 min",
        author: {
            name: "Marie Dubois",
            avatar: "MD"
        },
        image: "/assets/blog/mon-article.jpg",
        featured: false // true pour l'article en vedette
    }
];
```

---

## 🎯 Option 2 : WordPress Headless + Cloudflare

### Architecture

```
WordPress (Backend)          Cloudflare Pages (Frontend)
     CMS                            Blog UI
      ↓                                ↑
   WP REST API  ─────────────────> Fetch Articles
```

### Setup WordPress

#### 1. Installer WordPress

```bash
# Sur votre serveur
# Installer WordPress normalement
```

#### 2. Configurer l'API REST

WordPress inclut l'API REST par défaut. Testez :

```
https://votre-wordpress.com/wp-json/wp/v2/posts
```

#### 3. Activer CORS (si nécessaire)

```php
// wp-content/themes/votre-theme/functions.php

add_action('rest_api_init', function() {
    remove_filter('rest_pre_serve_request', 'rest_send_cors_headers');
    add_filter('rest_pre_serve_request', function($value) {
        header('Access-Control-Allow-Origin: https://votre-site.pages.dev');
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Credentials: true');
        return $value;
    });
}, 15);
```

### Frontend (Cloudflare Pages)

#### Modifier blog.js pour Fetcher WordPress

```javascript
// public/blog.js

async function loadArticlesFromWordPress() {
    try {
        const response = await fetch('https://votre-wordpress.com/wp-json/wp/v2/posts?_embed&per_page=100');
        const posts = await response.json();
        
        // Transformer les posts WordPress en format blog
        BlogConfig.articles = posts.map(post => ({
            id: post.id,
            title: post.title.rendered,
            slug: post.slug,
            excerpt: post.excerpt.rendered.replace(/<[^>]*>/g, ''), // Retirer HTML
            category: post.categories[0], // À adapter
            categoryLabel: getCategoryLabel(post.categories[0]),
            date: post.date,
            readTime: calculateReadTime(post.content.rendered),
            author: {
                name: post._embedded.author[0].name,
                avatar: getInitials(post._embedded.author[0].name)
            },
            image: post._embedded['wp:featuredmedia']?.[0]?.source_url || '/assets/blog/default.jpg',
            featured: post.sticky || false
        }));
        
        renderArticles();
    } catch (error) {
        console.error('Error loading WordPress articles:', error);
        // Fallback vers articles statiques
        BlogConfig.articles = blogArticles;
        renderArticles();
    }
}

// Charger au démarrage
document.addEventListener('DOMContentLoaded', () => {
    loadArticlesFromWordPress();
});
```

#### Fonctions Utilitaires

```javascript
function getCategoryLabel(categoryId) {
    const categories = {
        1: "🌸 Ikigai",
        2: "💼 Carrière",
        3: "📈 Développement Personnel",
        4: "🎓 Coaching",
        5: "💬 Témoignages",
        6: "🤖 Intelligence Artificielle"
    };
    return categories[categoryId] || "📚 Article";
}

function calculateReadTime(content) {
    const wordsPerMinute = 200;
    const text = content.replace(/<[^>]*>/g, '');
    const wordCount = text.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} min`;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
}
```

### Page Article Individuel

```javascript
// public/blog-article.js

async function loadArticleFromWordPress() {
    // Récupérer le slug depuis l'URL
    const slug = window.location.pathname.split('/').filter(Boolean).pop();
    
    try {
        const response = await fetch(`https://votre-wordpress.com/wp-json/wp/v2/posts?slug=${slug}&_embed`);
        const posts = await response.json();
        
        if (posts.length === 0) {
            window.location.href = '/404.html';
            return;
        }
        
        const post = posts[0];
        
        // Mettre à jour le titre
        document.title = post.title.rendered + ' | Blog AI-Ikigai';
        document.querySelector('.article-title').innerHTML = post.title.rendered;
        
        // Mettre à jour le contenu
        document.querySelector('.article-content').innerHTML = post.content.rendered;
        
        // Mettre à jour les métadonnées
        document.querySelector('.author-name-large').textContent = post._embedded.author[0].name;
        document.querySelector('.article-date').textContent = formatDate(post.date) + ' • ' + calculateReadTime(post.content.rendered);
        
        // Mettre à jour l'image featured
        if (post._embedded['wp:featuredmedia']) {
            document.querySelector('.article-featured-image img').src = post._embedded['wp:featuredmedia'][0].source_url;
        }
        
    } catch (error) {
        console.error('Error loading article:', error);
        window.location.href = '/404.html';
    }
}

document.addEventListener('DOMContentLoaded', loadArticleFromWordPress);
```

---

## 📊 SEO & Performance

### Meta Tags Dynamiques

```javascript
// Générer meta tags pour chaque article
function updateMetaTags(post) {
    // Title
    document.title = post.title + ' | Blog AI-Ikigai';
    
    // Description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        document.head.appendChild(metaDesc);
    }
    metaDesc.content = post.excerpt;
    
    // Open Graph
    updateMetaProperty('og:title', post.title);
    updateMetaProperty('og:description', post.excerpt);
    updateMetaProperty('og:image', post.image);
    updateMetaProperty('og:url', window.location.href);
    
    // Twitter
    updateMetaProperty('twitter:card', 'summary_large_image');
    updateMetaProperty('twitter:title', post.title);
    updateMetaProperty('twitter:description', post.excerpt);
    updateMetaProperty('twitter:image', post.image);
}

function updateMetaProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
    }
    meta.content = content;
}
```

### Sitemap XML

Créer `/public/sitemap.xml` :

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    <url>
        <loc>https://votre-site.com/blog</loc>
        <lastmod>2024-12-15</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://votre-site.com/blog/quest-ce-que-ikigai</loc>
        <lastmod>2024-12-10</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.8</priority>
    </url>
    <!-- Ajouter chaque article -->
</urlset>
```

### Robots.txt

```
# /public/robots.txt
User-agent: *
Allow: /
Sitemap: https://votre-site.com/sitemap.xml
```

---

## 🚀 Déploiement Cloudflare

### Configuration

```toml
# wrangler.toml (ajouter)

[[redirects]]
from = "/blog/*"
to = "/blog/:splat"
status = 200

# Cache pour les articles
[[headers]]
for = "/blog/*"
[headers.values]
Cache-Control = "public, max-age=3600, s-maxage=86400"
```

### Variables d'Environnement

```bash
# Si WordPress headless
WORDPRESS_API_URL=https://votre-wordpress.com/wp-json/wp/v2
```

---

## 📝 Workflow de Publication

### Option 1 : Blog Statique

```bash
1. Créer l'article en HTML ou Markdown
2. Ajouter les métadonnées dans blog.js
3. Commit et push
4. Cloudflare déploie automatiquement
```

### Option 2 : WordPress Headless

```bash
1. Écrire l'article dans WordPress
2. Publier
3. Frontend fetch automatiquement via API
4. Article apparaît immédiatement
```

---

## 🎨 Personnalisation

### Ajouter une Catégorie

```javascript
// Dans blog.js

// 1. Ajouter dans les boutons de filtre (blog.html)
<button class="category-btn" data-category="nouvelle-categorie">
    🆕 Nouvelle Catégorie
</button>

// 2. Ajouter dans les articles
{
    category: "nouvelle-categorie",
    categoryLabel: "🆕 Nouvelle Catégorie",
    // ...
}
```

### Modifier le Design

Tous les styles sont dans le `<style>` de `blog.html`. Variables CSS à modifier :

```css
:root {
    --cyan: #00d4ff;          /* Couleur primaire */
    --purple: #8b5cf6;        /* Couleur secondaire */
    /* ... */
}
```

---

## 🔍 Analytics

### Google Analytics

```html
<!-- Dans blog.html, avant </head> -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>
```

### Événements à Tracker

```javascript
// Clic sur un article
gtag('event', 'article_click', {
    article_title: article.title,
    article_category: article.category
});

// Lecture complète
gtag('event', 'article_read', {
    article_title: article.title,
    read_time: article.readTime
});

// Newsletter
gtag('event', 'newsletter_subscribe', {
    location: 'blog'
});
```

---

## ✅ Checklist de Déploiement

- [ ] blog.html créé et stylé
- [ ] blog.js avec logique de filtrage
- [ ] Articles ajoutés (au moins 3)
- [ ] Images optimisées (WebP, < 200KB)
- [ ] Meta tags SEO configurés
- [ ] Sitemap.xml créé
- [ ] Robots.txt configuré
- [ ] Analytics installé
- [ ] Tests sur mobile
- [ ] Tests sur desktop
- [ ] Vitesse testée (Lighthouse > 90)
- [ ] Links internes vérifiés
- [ ] 404 page configurée
- [ ] Déployé sur Cloudflare
- [ ] DNS configuré (si domaine custom)

---

## 📚 Resources

- **Cloudflare Pages Docs** : https://developers.cloudflare.com/pages
- **WordPress REST API** : https://developer.wordpress.org/rest-api
- **11ty** : https://www.11ty.dev
- **Markdown Guide** : https://www.markdownguide.org

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024
