// Thynk POS - Main JavaScript File
// Version 0.5 - Created by Anas Lila Software

'use strict';

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Initialize Application
function initializeApp() {
    setupSmoothScrolling();
    setupScrollAnimations();
    setupNavigation();
    setupFormValidation();
    setupLoadingStates();
    setupPerformanceOptimizations();
}

// Smooth Scrolling for Navigation Links
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Scroll Animations and Intersection Observer
function setupScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Add staggered animation delay
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                    entry.target.classList.add('animate-in');
                }, index * 100);
                
                fadeInObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for fade-in animation
    const animateElements = document.querySelectorAll(
        '.feature-card, .section-title, .pricing-card, .footer-content, .hero-feature'
    );
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        fadeInObserver.observe(el);
    });
}

// Navigation Functionality
function setupNavigation() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;

    // Header scroll behavior
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add background blur on scroll
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Hide/show header on scroll (optional)
        if (scrollTop > lastScrollTop && scrollTop > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        
        lastScrollTop = scrollTop;
    });

    // Mobile menu toggle (for future mobile menu implementation)
    const setupMobileMenu = () => {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const navLinks = document.querySelector('.nav-links');
        
        if (mobileToggle && navLinks) {
            mobileToggle.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                mobileToggle.classList.toggle('active');
            });
        }
    };

    setupMobileMenu();
}

// Form Validation and Handling
function setupFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', handleFormSubmit);
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', validateField);
            input.addEventListener('input', clearFieldError);
        });
    });
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    
    // Show loading state
    showLoadingState(form);
    
    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
        hideLoadingState(form);
        showNotification('Success! Your request has been submitted.', 'success');
        form.reset();
    }, 2000);
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldType = field.type;
    const fieldName = field.name;
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = `${fieldName} is required.`;
    }
    
    // Email validation
    if (fieldType === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address.';
        }
    }
    
    // Phone validation
    if (fieldType === 'tel' && value) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            isValid = false;
            errorMessage = 'Please enter a valid phone number.';
        }
    }
    
    // Display validation result
    if (!isValid) {
        showFieldError(field, errorMessage);
    } else {
        clearFieldError(field);
    }
    
    return isValid;
}

function showFieldError(field, message) {
    clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    
    field.parentNode.appendChild(errorDiv);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

// Loading States
function setupLoadingStates() {
    // Page loading
    window.addEventListener('load', () => {
        document.body.classList.add('loaded');
        hidePageLoader();
    });
}

function showLoadingState(element) {
    element.classList.add('loading');
    const button = element.querySelector('button[type="submit"]');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="material-icons rotating">hourglass_empty</span> Processing...';
    }
}

function hideLoadingState(element) {
    element.classList.remove('loading');
    const button = element.querySelector('button[type="submit"]');
    if (button) {
        button.disabled = false;
        button.innerHTML = '<span class="material-icons">send</span> Submit';
    }
}

function hidePageLoader() {
    const loader = document.querySelector('.page-loader');
    if (loader) {
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.remove();
        }, 500);
    }
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    notification.innerHTML = `
        <span class="material-icons">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close">
            <span class="material-icons">close</span>
        </button>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Auto remove
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        removeNotification(notification);
    });
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check_circle';
        case 'error': return 'error';
        case 'warning': return 'warning';
        default: return 'info';
    }
}

function removeNotification(notification) {
    notification.classList.add('hide');
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}

// Performance Optimizations
function setupPerformanceOptimizations() {
    // Lazy load images
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
    
    // Debounced scroll handler
    let scrollTimeout;
    const debouncedScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
            // Handle scroll-dependent updates here
        }, 16); // ~60fps
    };
    
    window.addEventListener('scroll', debouncedScroll, { passive: true });
}

// Utility Functions
const utils = {
    // Format currency
    formatCurrency: (amount, currency = '₹') => {
        return `${currency}${parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    },
    
    // Format date
    formatDate: (date, format = 'dd/mm/yyyy') => {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        
        switch (format) {
            case 'dd/mm/yyyy': return `${day}/${month}/${year}`;
            case 'mm/dd/yyyy': return `${month}/${day}/${year}`;
            case 'yyyy-mm-dd': return `${year}-${month}-${day}`;
            default: return d.toLocaleDateString();
        }
    },
    
    // Generate unique ID
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },
    
    // Debounce function
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Throttle function
    throttle: (func, limit) => {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
};

// Analytics and Tracking (Basic Implementation)
const analytics = {
    track: (event, data = {}) => {
        // Basic event tracking - replace with actual analytics service
        console.log('Analytics Event:', {
            event,
            data,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            userAgent: navigator.userAgent
        });
    },
    
    pageView: () => {
        analytics.track('page_view', {
            page: window.location.pathname,
            title: document.title
        });
    }
};

// Error Handling
window.addEventListener('error', (e) => {
    console.error('JavaScript Error:', e);
    // Could send to error tracking service here
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise Rejection:', e);
});

// Feature Detection
const features = {
    touch: 'ontouchstart' in window,
    localStorage: (() => {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    })(),
    serviceWorker: 'serviceWorker' in navigator,
    webGL: (() => {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    })()
};

// Local Storage Management
const storage = {
    set: (key, value) => {
        if (features.localStorage) {
            try {
                localStorage.setItem(`thynk_pos_${key}`, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('LocalStorage is full or unavailable');
                return false;
            }
        }
        return false;
    },
    
    get: (key) => {
        if (features.localStorage) {
            try {
                const item = localStorage.getItem(`thynk_pos_${key}`);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.warn('Error reading from localStorage');
                return null;
            }
        }
        return null;
    },
    
    remove: (key) => {
        if (features.localStorage) {
            localStorage.removeItem(`thynk_pos_${key}`);
        }
    },
    
    clear: () => {
        if (features.localStorage) {
            Object.keys(localStorage)
                .filter(key => key.startsWith('thynk_pos_'))
                .forEach(key => localStorage.removeItem(key));
        }
    }
};

// Initialize analytics
analytics.pageView();

// Global object for external access
window.ThynkPOS = {
    utils,
    analytics,
    storage,
    features,
    showNotification,
    version: '0.5',
    creator: 'Anas Lila Software'
};

// Development helpers (remove in production)
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('Thynk POS v0.5 - Development Mode');
    console.log('Created by Anas Lila Software');
    console.log('Available features:', features);
    window.ThynkPOS.debug = true;
}
