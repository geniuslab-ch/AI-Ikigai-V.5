/**
 * Cloudflare Worker to handle newsletter subscriptions via Brevo API
 * This worker acts as a secure proxy to protect the Brevo API key
 */

// IMPORTANT: Set this in Cloudflare Worker Environment Variables
// Don't hardcode the API key here!
// Go to: Workers → Your Worker → Settings → Variables
// Add: BREVO_API_KEY

const BREVO_API_URL = 'https://api.brevo.com/v3';
const LIST_ID = 2; // Your Brevo contact list ID (update this!)

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

/**
 * Handle incoming requests
 */
async function handleRequest(request) {
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*', // In production: use your domain
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders })
    }

    // Only accept POST
    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }

    try {
        // Get email from request body
        const { email } = await request.json()

        if (!email || !isValidEmail(email)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Invalid email address'
            }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Subscribe to Brevo
        const result = await subscribeToBrevo(email, BREVO_API_KEY)

        return new Response(JSON.stringify(result), {
            status: result.success ? 200 : 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        return new Response(JSON.stringify({
            success: false,
            error: 'Server error'
        }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
}

/**
 * Subscribe email to Brevo list
 */
async function subscribeToBrevo(email, apiKey) {
    try {
        const response = await fetch(`${BREVO_API_URL}/contacts`, {
            method: 'POST',
            headers: {
                'api-key': apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                listIds: [LIST_ID],
                updateEnabled: false  // Don't update if already exists
            })
        })

        const data = await response.json()

        if (response.ok) {
            return {
                success: true,
                message: 'Inscription confirmée ! Vous recevrez un email à chaque nouvelle publication.'
            }
        } else if (response.status === 400 && data.code === 'duplicate_parameter') {
            return {
                success: true, // Still success, just already subscribed
                message: 'Vous êtes déjà inscrit(e) !'
            }
        } else {
            return {
                success: false,
                error: 'Erreur lors de l\'inscription'
            }
        }

    } catch (error) {
        return {
            success: false,
            error: 'Impossible de se connecter au service d\'emails'
        }
    }
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
}
