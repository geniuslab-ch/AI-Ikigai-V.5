/**
 * AI-IKIGAI - API Configuration & Client
 * 
 * Ce fichier gère toutes les communications avec le backend.
 * Incluez ce fichier avant main.js et questionnaire.js
 */

// ============================================
// Configuration
// ============================================

const API_CONFIG = {
    // URL de l'API backend
    // En production, remplacez par votre URL
    baseUrl: 'https://api.ai-ikigai.com',
    
    // En développement local, décommentez cette ligne :
    // baseUrl: 'http://localhost:8787',
    
    // Timeout des requêtes (ms)
    timeout: 30000,
};

// ============================================
// API Client
// ============================================

const ApiClient = {
    // Token JWT stocké
    token: localStorage.getItem('ai-ikigai-token'),

    // Headers par défaut
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    },

    // Requête générique
    async request(endpoint, options = {}) {
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        
        const config = {
            ...options,
            headers: {
                ...this.getHeaders(),
                ...options.headers,
            },
        };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

            const response = await fetch(url, {
                ...config,
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Une erreur est survenue');
            }

            return data;
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('La requête a pris trop de temps');
            }
            throw error;
        }
    },

    // GET request
    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    // POST request
    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        });
    },

    // POST avec FormData (pour upload)
    async postForm(endpoint, formData) {
        const url = `${API_CONFIG.baseUrl}${endpoint}`;
        const headers = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        // Ne pas définir Content-Type pour FormData (le navigateur le fait automatiquement)

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Une erreur est survenue');
        }
        return data;
    },

    // Sauvegarder le token
    setToken(token) {
        this.token = token;
        localStorage.setItem('ai-ikigai-token', token);
    },

    // Supprimer le token
    clearToken() {
        this.token = null;
        localStorage.removeItem('ai-ikigai-token');
    },

    // Vérifier si authentifié
    isAuthenticated() {
        return !!this.token;
    },
};

// ============================================
// Auth API
// ============================================

const AuthAPI = {
    // Inscription
    async register(email, password, name = '') {
        const data = await ApiClient.post('/api/auth/register', { email, password, name });
        if (data.token) {
            ApiClient.setToken(data.token);
        }
        return data;
    },

    // Connexion
    async login(email, password) {
        const data = await ApiClient.post('/api/auth/login', { email, password });
        if (data.token) {
            ApiClient.setToken(data.token);
        }
        return data;
    },

    // Récupérer l'utilisateur courant
    async getCurrentUser() {
        return ApiClient.get('/api/auth/me');
    },

    // Déconnexion
    logout() {
        ApiClient.clearToken();
    },
};

// ============================================
// Questionnaire API
// ============================================

const QuestionnaireAPI = {
    // Soumettre les réponses
    async submit(answers, email = null) {
        const body = { answers };
        if (email) {
            body.email = email;
        }
        const data = await ApiClient.post('/api/questionnaire/submit', body);
        
        // Sauvegarder l'ID du questionnaire
        if (data.questionnaireId) {
            localStorage.setItem('ai-ikigai-questionnaire-id', data.questionnaireId);
        }
        
        return data;
    },

    // Upload CV
    async uploadCV(file, questionnaireId = null) {
        const formData = new FormData();
        formData.append('cv', file);
        
        if (questionnaireId) {
            formData.append('questionnaireId', questionnaireId);
        } else {
            const savedId = localStorage.getItem('ai-ikigai-questionnaire-id');
            if (savedId) {
                formData.append('questionnaireId', savedId);
            }
        }

        return ApiClient.postForm('/api/questionnaire/upload-cv', formData);
    },

    // Récupérer un questionnaire
    async get(id) {
        return ApiClient.get(`/api/questionnaire/${id}`);
    },

    // Récupérer le questionnaire sauvegardé
    async getCurrent() {
        const id = localStorage.getItem('ai-ikigai-questionnaire-id');
        if (!id) {
            return null;
        }
        return this.get(id);
    },
};

// ============================================
// Payment API
// ============================================

const PaymentAPI = {
    // Créer une session de paiement
    async createCheckout(plan) {
        const data = await ApiClient.post('/api/payment/create-checkout', { plan });
        
        // Rediriger vers Stripe
        if (data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
        }
        
        return data;
    },

    // Vérifier le statut du paiement (après retour de Stripe)
    async checkPaymentStatus() {
        const urlParams = new URLSearchParams(window.location.search);
        const payment = urlParams.get('payment');
        const sessionId = urlParams.get('session_id');

        if (payment === 'success' && sessionId) {
            return { success: true, sessionId };
        } else if (payment === 'cancelled') {
            return { success: false, cancelled: true };
        }
        
        return null;
    },
};

// ============================================
// Newsletter API
// ============================================

const NewsletterAPI = {
    // S'inscrire à la newsletter
    async subscribe(email, type = 'b2b') {
        return ApiClient.post('/api/newsletter/subscribe', { email, type });
    },
};

// ============================================
// Health Check
// ============================================

const HealthAPI = {
    async check() {
        try {
            const data = await ApiClient.get('/api/health');
            return data.status === 'ok';
        } catch {
            return false;
        }
    },
};

// ============================================
// Export pour utilisation globale
// ============================================

window.API_CONFIG = API_CONFIG;
window.ApiClient = ApiClient;
window.AuthAPI = AuthAPI;
window.QuestionnaireAPI = QuestionnaireAPI;
window.PaymentAPI = PaymentAPI;
window.NewsletterAPI = NewsletterAPI;
window.HealthAPI = HealthAPI;

// Log de connexion
console.log('🔌 AI-Ikigai API Client loaded');
console.log(`📡 API URL: ${API_CONFIG.baseUrl}`);
