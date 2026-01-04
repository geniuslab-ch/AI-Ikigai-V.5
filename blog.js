/**
 * AI-IKIGAI Blog - JavaScript
 * Gestion des articles, filtres et interactions
 */

// =============================================
// Configuration
// =============================================

const BlogConfig = {
    articlesPerPage: 9,
    currentPage: 1,
    currentCategory: 'all',
    articles: []
};

// =============================================
// Données des articles (exemple)
// =============================================

const blogArticles = [
    {
        id: 1,
        title: "Qu'est-ce que l'Ikigai et pourquoi est-il essentiel pour votre carrière ?",
        slug: "quest-ce-que-ikigai",
        excerpt: "Découvrez le concept japonais de l'Ikigai et comment il peut transformer votre vision de la carrière professionnelle et du bonheur au travail.",
        category: "ikigai",
        categoryLabel: "🌸 Ikigai",
        date: "2024-12-10",
        readTime: "8 min",
        author: {
            name: "Marie Dubois",
            avatar: "MD"
        },
        image: "/assets/blog/ikigai-intro.jpg",
        featured: false
    },
    {
        id: 2,
        title: "5 Signes que vous n'êtes pas aligné avec votre Ikigai",
        slug: "5-signes-desalignement",
        excerpt: "Fatigue chronique, ennui au travail, manque de motivation... Identifiez les signaux d'alerte qui montrent que vous n'êtes pas sur la bonne voie.",
        category: "carriere",
        categoryLabel: "💼 Carrière",
        date: "2024-12-08",
        readTime: "6 min",
        author: {
            name: "Thomas Martin",
            avatar: "TM"
        },
        image: "/assets/blog/signes-desalignement.jpg",
        featured: false
    },
    {
        id: 3,
        title: "Comment l'IA révolutionne l'orientation professionnelle",
        slug: "ia-orientation-professionnelle",
        excerpt: "L'intelligence artificielle transforme la manière dont nous découvrons nos talents et orientons notre carrière. Découvrez comment.",
        category: "ia",
        categoryLabel: "🤖 Intelligence Artificielle",
        date: "2024-12-05",
        readTime: "10 min",
        author: {
            name: "Sophie Bernard",
            avatar: "SB"
        },
        image: "/assets/blog/ia-orientation.jpg",
        featured: false
    },
    {
        id: 4,
        title: "Reconversion professionnelle : Par où commencer ?",
        slug: "reconversion-guide",
        excerpt: "Vous envisagez une reconversion ? Ce guide complet vous accompagne étape par étape dans votre transition de carrière.",
        category: "carriere",
        categoryLabel: "💼 Carrière",
        date: "2024-12-03",
        readTime: "12 min",
        author: {
            name: "Lucas Petit",
            avatar: "LP"
        },
        image: "/assets/blog/reconversion.jpg",
        featured: false
    },
    {
        id: 5,
        title: "Les 4 piliers de l'Ikigai expliqués simplement",
        slug: "4-piliers-ikigai",
        excerpt: "Ce que vous aimez, ce en quoi vous êtes doué, ce pour quoi vous pouvez être payé, ce dont le monde a besoin. Décryptage des 4 dimensions.",
        category: "ikigai",
        categoryLabel: "🌸 Ikigai",
        date: "2024-12-01",
        readTime: "7 min",
        author: {
            name: "Emma Roux",
            avatar: "ER"
        },
        image: "/assets/blog/4-piliers.jpg",
        featured: false
    },
    {
        id: 6,
        title: "Témoignage : Comment j'ai trouvé ma voie grâce à l'Ikigai",
        slug: "temoignage-marie",
        excerpt: "Marie, 35 ans, raconte comment la découverte de son Ikigai l'a amenée à quitter son emploi en banque pour devenir coach en développement personnel.",
        category: "temoignages",
        categoryLabel: "💬 Témoignages",
        date: "2024-11-28",
        readTime: "9 min",
        author: {
            name: "Marie Dupont",
            avatar: "MD"
        },
        image: "/assets/blog/temoignage-marie.jpg",
        featured: false
    },
    {
        id: 7,
        title: "10 exercices pratiques pour découvrir votre passion",
        slug: "10-exercices-passion",
        excerpt: "Des exercices concrets et efficaces pour identifier ce qui vous anime vraiment et transformer votre relation au travail.",
        category: "developpement",
        categoryLabel: "📈 Développement Personnel",
        date: "2024-11-25",
        readTime: "11 min",
        author: {
            name: "Antoine Laurent",
            avatar: "AL"
        },
        image: "/assets/blog/exercices-passion.jpg",
        featured: false
    },
    {
        id: 8,
        title: "Le rôle du coach dans votre quête d'Ikigai",
        slug: "role-coach-ikigai",
        excerpt: "Pourquoi un coach peut accélérer votre découverte de l'Ikigai et comment choisir le bon accompagnateur pour votre parcours.",
        category: "coaching",
        categoryLabel: "🎓 Coaching",
        date: "2024-11-22",
        readTime: "8 min",
        author: {
            name: "Camille Moreau",
            avatar: "CM"
        },
        image: "/assets/blog/role-coach.jpg",
        featured: false
    },
    {
        id: 9,
        title: "Ikigai et entrepreneuriat : Créer une entreprise alignée",
        slug: "ikigai-entrepreneuriat",
        excerpt: "Comment utiliser votre Ikigai comme boussole pour créer une entreprise qui a du sens et génère de l'impact.",
        category: "carriere",
        categoryLabel: "💼 Carrière",
        date: "2024-11-20",
        readTime: "13 min",
        author: {
            name: "Hugo Dubois",
            avatar: "HD"
        },
        image: "/assets/blog/entrepreneuriat.jpg",
        featured: false
    }
];

// =============================================
// Initialisation
// =============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎯 Blog initialization...');
    
    // Charger les articles
    BlogConfig.articles = blogArticles;
    renderArticles();
    
    // Initialiser les filtres
    initCategoryFilters();
    
    // Initialiser les animations
    initScrollAnimations();
});

// =============================================
// Rendu des articles
// =============================================

function renderArticles(category = 'all') {
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    
    // Filtrer les articles
    let filteredArticles = BlogConfig.articles;
    if (category !== 'all') {
        filteredArticles = BlogConfig.articles.filter(article => article.category === category);
    }
    
    // Afficher un message si aucun article
    if (filteredArticles.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
                <h3 style="font-family: 'Sora', sans-serif; font-size: 1.5rem; margin-bottom: 0.5rem;">
                    Aucun article dans cette catégorie
                </h3>
                <p style="color: var(--gray);">
                    Revenez bientôt, de nouveaux articles arrivent !
                </p>
            </div>
        `;
        return;
    }
    
    // Générer le HTML des articles
    grid.innerHTML = filteredArticles.map(article => `
        <article class="article-card" onclick="goToArticle('${article.slug}')">
            <div class="article-image">
                <img 
                    src="${article.image}" 
                    alt="${article.title}"
                    onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'400\\' height=\\'300\\'%3E%3Crect width=\\'400\\' height=\\'300\\' fill=\\'%2312121a\\'/%3E%3Ctext x=\\'50%25\\' y=\\'50%25\\' dominant-baseline=\\'middle\\' text-anchor=\\'middle\\' font-family=\\'Outfit, sans-serif\\' font-size=\\'16\\' fill=\\'%2394a3b8\\'%3EImage à venir%3C/text%3E%3C/svg%3E'"
                >
                <span class="article-category">${article.categoryLabel}</span>
            </div>
            <div class="article-content">
                <div class="article-meta">
                    <span>📅 ${formatDate(article.date)}</span>
                    <span>⏱️ ${article.readTime}</span>
                </div>
                <h3>${article.title}</h3>
                <p class="article-excerpt">${article.excerpt}</p>
                <div class="article-footer">
                    <div class="author">
                        <div class="author-avatar">${article.author.avatar}</div>
                        <span class="author-name">${article.author.name}</span>
                    </div>
                    <span class="read-time">${article.readTime}</span>
                </div>
            </div>
        </article>
    `).join('');
    
    // Animer l'apparition
    setTimeout(() => {
        document.querySelectorAll('.article-card').forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            setTimeout(() => {
                card.style.transition = 'all 0.6s ease';
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, index * 100);
        });
    }, 10);
}

// =============================================
// Filtres par catégorie
// =============================================

function initCategoryFilters() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    
    categoryButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Retirer la classe active de tous les boutons
            categoryButtons.forEach(btn => btn.classList.remove('active'));
            
            // Ajouter la classe active au bouton cliqué
            button.classList.add('active');
            
            // Récupérer la catégorie
            const category = button.dataset.category;
            BlogConfig.currentCategory = category;
            
            // Filtrer et afficher les articles
            renderArticles(category);
        });
    });
}

// =============================================
// Navigation vers un article
// =============================================

function goToArticle(slug) {
    // Rediriger vers la page de l'article
    window.location.href = `/blog/${slug}`;
    
    // Alternative : Ouvrir dans un nouvel onglet
    // window.open(`/blog/${slug}`, '_blank');
}

// =============================================
// Newsletter
// =============================================

function subscribeNewsletter(event) {
    event.preventDefault();
    
    const form = event.target;
    const email = form.querySelector('input[type="email"]').value;
    
    // TODO: Implémenter l'inscription réelle
    // await ApiClient.post('/api/newsletter/subscribe', { email });
    
    // Simuler un délai
    const button = form.querySelector('.newsletter-btn');
    const originalText = button.textContent;
    button.textContent = 'Inscription...';
    button.disabled = true;
    
    setTimeout(() => {
        alert(`✅ Merci ! Vous êtes inscrit avec l'email : ${email}`);
        form.reset();
        button.textContent = originalText;
        button.disabled = false;
    }, 1500);
}

// =============================================
// Menu Mobile
// =============================================

function toggleMobileMenu() {
    const navLinks = document.querySelector('.nav-links');
    if (!navLinks) return;
    
    // Toggle la classe active
    navLinks.classList.toggle('active');
    
    // Changer l'icône du menu
    const menuBtn = document.querySelector('.mobile-menu-btn');
    if (menuBtn) {
        menuBtn.textContent = navLinks.classList.contains('active') ? '✕' : '☰';
    }
}

// =============================================
// Utilitaires
// =============================================

function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
}

// =============================================
// Animations au scroll
// =============================================

function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observer les sections
    document.querySelectorAll('.blog-section, .newsletter, .featured').forEach(element => {
        observer.observe(element);
    });
}

// =============================================
// Recherche (optionnel)
// =============================================

function searchArticles(query) {
    const filtered = BlogConfig.articles.filter(article => {
        const searchText = `${article.title} ${article.excerpt}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
    });
    
    const grid = document.getElementById('blogGrid');
    if (!grid) return;
    
    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔍</div>
                <h3 style="font-family: 'Sora', sans-serif; font-size: 1.5rem; margin-bottom: 0.5rem;">
                    Aucun résultat pour "${query}"
                </h3>
                <p style="color: var(--gray);">
                    Essayez avec d'autres mots-clés
                </p>
            </div>
        `;
    } else {
        renderArticles(BlogConfig.currentCategory);
    }
}

// =============================================
// Export global
// =============================================

window.goToArticle = goToArticle;
window.subscribeNewsletter = subscribeNewsletter;
window.toggleMobileMenu = toggleMobileMenu;
window.searchArticles = searchArticles;

console.log('✅ Blog JS loaded successfully');
console.log(`📚 ${blogArticles.length} articles available`);
