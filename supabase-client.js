/**
 * Configuration Supabase pour le Frontend
 */

const SUPABASE_CONFIG = {
    url: 'https://gtpkzfpvqlcwnvekcxhy.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0cGt6ZnB2cWxjd252ZWtjeGh5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcyODI0MTAsImV4cCI6MjA4Mjg1ODQxMH0.Q4Y9iheI4EFAJhjH6MptiTodrypC8UIPIz4YN-rHksU'
};

// Initialiser le client Supabase (via CDN)
const supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

// ============================================
// AUTH API
// ============================================

const AuthAPI = {
    // Inscription
    async signUp(email, password, name) {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });

        if (error) throw error;
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
                } else {
                    console.warn('⚠️ Could not fetch profile:', profileError);
                }
            } catch (profileError) {
                console.warn('⚠️ Profile fetch failed:', profileError);
            }

            // Construire l'objet utilisateur avec fallback
            const userWithRole = {
                ...user,
                email: user.email,
                name: profileData?.name || user.user_metadata?.name || user.email?.split('@')[0],
                role: profileData?.role || 'client' // Utiliser le rôle de la DB ou 'client' par défaut
            };

            console.log('Final user object:', userWithRole);
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

        const response = await fetch(`https://ai-ikagai.dallyhermann-71e.workers.dev${endpoint}`, {
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
        // Rediriger vers login
        window.location.href = 'auth.html';
        return null;
    }

    console.log('✅ User authenticated:', user.email, 'Role:', user.role);

    // Vérifier le rôle si spécifié
    if (requiredRole && user.role !== requiredRole && !['admin', 'super_admin'].includes(user.role)) {
        console.log('⚠️ Wrong role, redirecting to correct dashboard');
        // Rediriger vers le bon dashboard
        redirectToDashboard(user.role);
        return null;
    }

    return user;
}

function redirectToDashboard(role) {
    const dashboards = {
        'client': 'dashboard-client.html',
        'coach': 'dashboard-coach.html',
        'admin': 'dashboard-admin.html',
        'super_admin': 'dashboard-admin.html'
    };

    window.location.href = dashboards[role] || 'dashboard-client.html';
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
