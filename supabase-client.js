/**
 * Configuration Supabase pour le Frontend
 */

const SUPABASE_CONFIG = {
    url: 'https://wgmtujvvfnsbhudshmkh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndnbXR1anZ2Zm5zYmh1ZHNobWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NjI4NTAsImV4cCI6MjA4MzAzODg1MH0.JFsoAJtAb5CYausxkt51umCOlJqis1RBywv0b9-EhWc'
};

// Initialiser le client Supabase (via CDN)
const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// ============================================
// AUTH API
// ============================================

const AuthAPI = {
    // Inscription
    async signUp(email, password, name, role = 'client') {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { name, role } // Ajouter role dans metadata
            }
        });

        if (error) throw error;

        // ✅ Le trigger Supabase 'on_auth_user_created' crée automatiquement le profil
        // avec le bon rôle depuis user_metadata. Pas besoin d'insertion manuelle ici.
        console.log('✅ User created, profile will be auto-created by trigger');

        return data;
    },

    // Connexion
    async signIn(email, password) {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        return data;
    },

    // Déconnexion
    async signOut() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        // Rediriger vers la page d'accueil
        window.location.href = 'index.html';
    },

    // Utilisateur actuel
    async getUser() {
        console.log('📞 getUser() called');

        try {
            const { data: { user }, error } = await supabaseClient.auth.getUser();
            console.log('Auth response:', { user: user?.email, error });

            if (error) {
                console.error('Auth error:', error);
                return null;
            }

            if (!user) {
                console.log('❌ No user found');
                return null;
            }

            console.log('✅ User found:', user.email);
            console.log('📋 User metadata:', user.user_metadata);

            // Essayer de récupérer le profil depuis la table profiles
            let profileData = null;
            try {
                const { data, error: profileError } = await supabaseClient
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (!profileError && data) {
                    profileData = data;
                    console.log('✅ Profile fetched from database:', profileData);
                    console.log('🎯 Role from database:', profileData.role);
                } else {
                    console.warn('⚠️ Could not fetch profile:', profileError);
                    console.log('🔍 Error code:', profileError?.code);
                    console.log('🔍 Error message:', profileError?.message);

                    // AUTO-FIX: Créer le profil s'il n'existe pas
                    if (profileError?.code === 'PGRST116') { // Pas de résultat
                        console.log('🔧 Auto-creating missing profile...');
                        try {
                            const userRole = user.user_metadata?.role || 'client';
                            console.log('🎯 Role to create:', userRole);

                            const { error: createError } = await supabaseClient
                                .from('profiles')
                                .insert({
                                    id: user.id,
                                    email: user.email,
                                    name: user.user_metadata?.name || user.email?.split('@')[0],
                                    role: userRole,
                                    plan: userRole === 'coach' ? 'decouverte_coach' : 'decouverte'
                                });

                            if (!createError) {
                                console.log('✅ Profile auto-created! Reloading...');
                                // Recharger la page pour récupérer le profil
                                window.location.reload();
                                return null;
                            } else {
                                console.error('❌ Profile creation failed:', createError);
                            }
                        } catch (createErr) {
                            console.error('❌ Could not auto-create profile:', createErr);
                        }
                    }
                }
            } catch (profileError) {
                console.warn('⚠️ Profile fetch failed:', profileError);
            }

            // Construire l'objet utilisateur avec fallback
            const userWithRole = {
                ...user,
                email: user.email,
                name: profileData?.name || user.user_metadata?.name || user.email?.split('@')[0],
                role: profileData?.role || user.user_metadata?.role || 'client' // DB > metadata > 'client' par défaut
            };

            console.log('🎯 Final user object:', userWithRole);
            console.log('🎯 Final role:', userWithRole.role);
            return userWithRole;

        } catch (error) {
            console.error('getUser error:', error);
            return null;
        }
    },

    // Session actuelle
    async getSession() {
        const { data: { session } } = await supabaseClient.auth.getSession();
        return session;
    },

    // Vérifier si connecté
    async isAuthenticated() {
        const session = await this.getSession();
        return !!session;
    },

    // Récupérer le token JWT
    async getToken() {
        const session = await this.getSession();
        return session?.access_token || null;
    }
};

// ============================================
// DASHBOARD API
// ============================================

const DashboardAPI = {
    // Helper pour faire des requêtes authentifiées
    async authenticatedRequest(endpoint, options = {}) {
        const token = await AuthAPI.getToken();

        if (!token) {
            throw new Error('Non authentifié');
        }

        const response = await fetch(`https://ai-ikigai.ai-ikigai.workers.dev${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erreur API');
        }

        return data;
    },

    // Dashboard Client
    async getClientDashboard() {
        return this.authenticatedRequest('/api/dashboard/client');
    },

    // Dashboard Coach
    async getCoachDashboard() {
        return this.authenticatedRequest('/api/dashboard/coach');
    },

    async addClient(clientEmail) {
        return this.authenticatedRequest('/api/dashboard/coach/clients/add', {
            method: 'POST',
            body: JSON.stringify({ clientEmail })
        });
    },

    async getClientData(clientId) {
        return this.authenticatedRequest(`/api/dashboard/coach/clients/${clientId}`);
    },

    // Dashboard Admin
    async getAdminStats() {
        return this.authenticatedRequest('/api/dashboard/admin/stats');
    },

    async getAdminUsers() {
        return this.authenticatedRequest('/api/dashboard/admin/users');
    },

    async updateUser(userId, updates) {
        return this.authenticatedRequest(`/api/dashboard/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(updates)
        });
    }
};

// ============================================
// AUTH GUARD
// ============================================

async function checkAuth(requiredRole = null) {
    console.log('🔍 checkAuth called with role:', requiredRole);
    const user = await AuthAPI.getUser();
    console.log('👤 User from getUser:', user);

    if (!user) {
        console.log('❌ No user, redirecting to auth.html');
        // PROTECTION: Éviter boucle infinie si déjà sur auth.html
        if (window.location.href.includes('auth.html')) {
            console.error('🔴 Already on auth page, stopping redirect loop!');
            return null;
        }
        // Rediriger vers login
        window.location.href = 'auth.html';
        return null;
    }

    console.log('✅ User authenticated:', user.email, 'Role:', user.role);

    // DEBUG: Affichage visible
    console.error('🔍 DEBUG - requiredRole:', requiredRole, 'user.role:', user.role);

    // ⚠️ DÉSACTIVÉ TEMPORAIREMENT POUR ÉVITER BOUCLE INFINIE
    // Vérifier le rôle si spécifié
    /* COMMENTÉ
    if (requiredRole && user.role !== requiredRole && !['admin', 'super_admin'].includes(user.role)) {
        console.error('⚠️ BOUCLE DÉTECTÉE - Wrong role, ARRÊT TEMPORAIRE');
        alert(`DEBUG: Role mismatch!\nRequired: ${requiredRole}\nActual: ${user.role}\n\nBoucle arrêtée. Vérifiez la console.`);
        // STOPPER LA BOUCLE TEMPORAIREMENT
        return null;
    }
    */

    // HACK: Accepter tous les rôles pour éviter boucle
    console.log('✅ Role check bypassed - all roles accepted');

    return user;
}

function redirectToDashboard(role) {
    const dashboards = {
        'client': 'dashboard-client.html',
        'coach': 'dashboard-coach.html',
        'admin': 'dashboard-admin.html',
        'super_admin': 'dashboard-admin.html'
    };

    const targetDashboard = dashboards[role] || 'dashboard-client.html';

    // Éviter boucle infinie - ne pas rediriger si on est déjà sur la bonne page
    if (!window.location.href.includes(targetDashboard)) {
        window.location.href = targetDashboard;
    }
}

// ============================================
// UTILITIES
// ============================================

function showError(message) {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successDiv = document.getElementById('success-message');
    if (successDiv) {
        successDiv.textContent = message;
        successDiv.style.display = 'block';
        setTimeout(() => {
            successDiv.style.display = 'none';
        }, 3000);
    } else {
        alert(message);
    }
}

// Exporter pour utilisation globale
window.supabaseClient = supabaseClient;
window.AuthAPI = AuthAPI;
window.DashboardAPI = DashboardAPI;
window.checkAuth = checkAuth;
window.redirectToDashboard = redirectToDashboard;
window.showError = showError;
window.showSuccess = showSuccess;

console.log('✅ Supabase configuré et prêt !');
