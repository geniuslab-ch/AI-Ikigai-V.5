/**
 * AI-IKIGAI - Main JavaScript
 */

// DOM Elements
const navbar = document.getElementById('navbar');
const mobileMenu = document.getElementById('mobileMenu');
const toast = document.getElementById('toast');
const notifyForm = document.getElementById('notifyForm');

// =============================================
// Navigation
// =============================================

// Navbar scroll effect
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Mobile menu toggle
function toggleMobileMenu() {
    mobileMenu.classList.toggle('active');
    document.body.style.overflow = mobileMenu.classList.contains('active') ? 'hidden' : '';
}

// B2C/B2B Mode Switch
function switchMode(mode) {
    const b2cContent = document.getElementById('b2c-content');
    const b2bContent = document.getElementById('b2b-content');
    const navToggleBtns = document.querySelectorAll('.nav-toggle button');

    if (mode === 'b2c') {
        b2cContent.classList.add('active');
        b2bContent.classList.remove('active');
        if (navToggleBtns.length >= 2) {
            navToggleBtns[0].classList.add('active');
            navToggleBtns[1].classList.remove('active');
        }
    } else {
        b2cContent.classList.remove('active');
        b2bContent.classList.add('active');
        if (navToggleBtns.length >= 2) {
            navToggleBtns[0].classList.remove('active');
            navToggleBtns[1].classList.add('active');
        }
    }

    // Scroll to top when switching
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// =============================================
// FAQ Accordion
// =============================================

document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Close all FAQ items
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // Open clicked item if it wasn't active
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// =============================================
// Smooth Scroll
// =============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
            const offsetTop = target.offsetTop - 80; // Account for fixed navbar
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// =============================================
// Toast Notifications
// =============================================

function showToast(message, duration = 4000) {
    const toastMessage = toast.querySelector('.toast-message');
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, duration);
}

// =============================================
// Newsletter / Notify Form
// =============================================

if (notifyForm) {
    notifyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const emailInput = document.getElementById('notifyEmail');
        const email = emailInput.value.trim();
        
        if (!email) return;
        
        const submitBtn = notifyForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Envoi...';
        submitBtn.disabled = true;
        
        try {
            // Use API if available
            if (typeof NewsletterAPI !== 'undefined') {
                const result = await NewsletterAPI.subscribe(email, 'b2b');
                if (result.success) {
                    showToast('✓ Inscription réussie ! Vous serez notifié du lancement.');
                    emailInput.value = '';
                } else {
                    throw new Error(result.error || 'Erreur');
                }
            } else {
                // Fallback: simulate success
                await new Promise(resolve => setTimeout(resolve, 1000));
                showToast('✓ Inscription réussie ! Vous serez notifié du lancement.');
                emailInput.value = '';
            }
        } catch (error) {
            console.error('Newsletter error:', error);
            showToast('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// =============================================
// Scroll Animations
// =============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const animateOnScroll = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
            animateOnScroll.unobserve(entry.target);
        }
    });
}, observerOptions);

// Apply animation to cards
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll(
        '.step-card, .feature-card, .pricing-card, .testimonial-card'
    );
    
    animatedElements.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = `opacity 0.6s ease ${index * 0.1}s, transform 0.6s ease ${index * 0.1}s`;
        animateOnScroll.observe(el);
    });
});

// =============================================
// Utility Functions
// =============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Check if element is in viewport
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// =============================================
// Analytics Events (placeholder)
// =============================================

function trackEvent(eventName, eventData = {}) {
    // Replace with your analytics implementation
    // Example: Google Analytics, Mixpanel, etc.
    console.log('Track Event:', eventName, eventData);
    
    // Google Analytics 4 example:
    // gtag('event', eventName, eventData);
}

// Track CTA clicks
document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
    btn.addEventListener('click', () => {
        trackEvent('cta_click', {
            button_text: btn.textContent.trim(),
            page_location: window.location.pathname
        });
    });
});

// Track pricing card views
document.querySelectorAll('.pricing-card').forEach(card => {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const planName = card.querySelector('.pricing-name')?.textContent;
                trackEvent('pricing_view', { plan: planName });
                observer.unobserve(card);
            }
        });
    }, { threshold: 0.5 });
    
    observer.observe(card);
});

// =============================================
// Initialize
// =============================================

console.log('AI-Ikigai initialized');
