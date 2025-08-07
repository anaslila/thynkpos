// Thynk POS - Main JavaScript File
// Version 0.5 - Created by Anas Lila Software
// Complete rewrite with bug fixes and PWA features

'use strict';

// Global Variables
let deferredPrompt;
let isIOSDevice = false;
let isStandalone = false;
let engagementStartTime = Date.now();
let scrollTimeout;
let isMenuOpen = false;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Initializing Thynk POS v0.5');
    
    // Core setup functions
    setupDeviceDetection();
    setupPWAInstall();
    setupNavigation();
    setupSmoothScrolling();
    setupScrollAnimations();
    setupInteractiveElements();
    setupFormHandling();
    setupPerformanceOptimizations();
    setupAccessibility();
    setupErrorHandling();
    
    // Load external assets
    loadLogo();
    loadFavicon();
    
    // Mark app as loaded
    document.body.classList.add('loaded');
    
    console.log('✅ Thynk POS initialized successfully');
}

// Device Detection
function setupDeviceDetection() {
    // Detect iOS devices
    isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    // Check if app is already installed/standalone
    isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                  window.navigator.standalone || 
                  document.referrer.includes('android-app://');
    
    // Add device-specific classes
    document.body.classList.add(isIOSDevice ? 'ios-device' : 'non-ios-device');
    if (isStandalone) document.body.classList.add('standalone-app');
    
    // Detect touch capability
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('touch-device');
    }
    
    console.log(`📱 Device detected: ${isIOSDevice ? 'iOS' : 'Other'}, Standalone: ${isStandalone}`);
}

// PWA Installation Management
function setupPWAInstall() {
    if (isStandalone) {
        console.log('📱 App is already installed');
        return;
    }

    // Listen for beforeinstallprompt event (Android/Chrome)
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('📥 beforeinstallprompt event fired');
        e.preventDefault();
        deferredPrompt = e;
        
        // Show install prompt after user has engaged with the site
        setTimeout(() => {
            showPWAInstallPrompt('android');
        }, 3000);
    });

    // Listen for app installation
    window.addEventListener('appinstalled', (e) => {
        console.log('✅ PWA was installed');
        showNotification('🎉 Thynk POS installed successfully!', 'success');
        deferredPrompt = null;
        dismissPWAPrompt();
    });

    // For iOS devices
    if (isIOSDevice && !isStandalone) {
        setTimeout(() => {
            showPWAInstallPrompt('ios');
        }, 5000);
    }

    // For other browsers that don't support beforeinstallprompt
    setTimeout(() => {
        if (!deferredPrompt && !isIOSDevice && !isStandalone && !sessionStorage.getItem('pwaPromptShown')) {
            showPWAInstallPrompt('generic');
        }
    }, 8000);
}

function showPWAInstallPrompt(type = 'generic') {
    // Don't show if already dismissed in this session
    if (sessionStorage.getItem('pwaPromptDismissed')) {
        return;
    }

    const popup = document.getElementById('pwaInstallPopup');
    const titleEl = popup.querySelector('.pwa-popup-title');
    const subtitleEl = popup.querySelector('.pwa-popup-subtitle');
    const installBtn = popup.querySelector('.pwa-btn-install');
    
    if (!popup) {
        console.error('❌ PWA install popup not found');
        return;
    }

    // Customize popup based on device type
    switch (type) {
        case 'ios':
            titleEl.textContent = 'Add to Home Screen';
            subtitleEl.textContent = 'Install Thynk POS for the best experience';
            installBtn.innerHTML = '<span class="material-icons">ios_share</span> Show Instructions';
            installBtn.onclick = showIOSInstructions;
            break;
        
        case 'android':
            titleEl.textContent = 'Install Thynk POS';
            subtitleEl.textContent = 'Get the full app experience on your device';
            installBtn.innerHTML = '<span class="material-icons">download</span> Install App';
            installBtn.onclick = installPWA;
            break;
        
        default:
            titleEl.textContent = 'Install Thynk POS';
            subtitleEl.textContent = 'Add this app to your home screen for quick access';
            installBtn.innerHTML = '<span class="material-icons">get_app</span> Install';
            installBtn.onclick = installPWA;
    }

    popup.classList.add('show');
    sessionStorage.setItem('pwaPromptShown', 'true');
    
    console.log(`📱 Showing PWA install prompt: ${type}`);
}

function installPWA() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('✅ User accepted the install prompt');
                showNotification('📱 Installing Thynk POS...', 'success');
                trackEvent('pwa_install_accepted');
            } else {
                console.log('❌ User dismissed the install prompt');
                trackEvent('pwa_install_dismissed');
            }
            deferredPrompt = null;
        });
    } else if (isIOSDevice) {
        showIOSInstructions();
    } else {
        showNotification('Use your browser menu to install this app', 'info');
        trackEvent('pwa_install_generic');
    }
    
    dismissPWAPrompt();
}

function showIOSInstructions() {
    const instructions = `
        📱 To install on iOS:
        1. Tap the Share button (⬆️) in Safari
        2. Scroll down and tap "Add to Home Screen"
        3. Tap "Add" to install Thynk POS
    `;
    
    showNotification(instructions, 'info', 10000);
    trackEvent('ios_install_instructions_shown');
    dismissPWAPrompt();
}

function dismissPWAPrompt() {
    const popup = document.getElementById('pwaInstallPopup');
    if (popup) {
        popup.classList.remove('show');
        sessionStorage.setItem('pwaPromptDismissed', 'true');
        trackEvent('pwa_prompt_dismissed');
    }
}

// Navigation Management
function setupNavigation() {
    const header = document.querySelector('.header');
    const navLinks = document.getElementById('navLinks');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    
    if (!header || !navLinks || !mobileToggle) {
        console.error('❌ Navigation elements not found');
        return;
    }

    let lastScrollTop = 0;
    let ticking = false;

    // Optimized scroll handler
    function handleScroll() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Add scrolled class for backdrop blur
        if (scrollTop > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Auto-hide header on scroll down (optional)
        if (Math.abs(scrollTop - lastScrollTop) > 5) {
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                header.style.transform = 'translateY(-100%)';
            } else {
                header.style.transform = 'translateY(0)';
            }
            lastScrollTop = scrollTop;
        }

        ticking = false;
    }

    // Throttled scroll event
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleScroll);
            ticking = true;
        }
    }, { passive: true });

    // Mobile menu toggle
    mobileToggle.addEventListener('click', toggleMobileMenu);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (isMenuOpen && !navLinks.contains(e.target) && !mobileToggle.contains(e.target)) {
            closeMobileMenu();
        }
    });

    // Close menu on window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && isMenuOpen) {
            closeMobileMenu();
        }
    });

    console.log('📱 Navigation setup complete');
}

function toggleMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (!navLinks || !toggle) return;
    
    isMenuOpen = !isMenuOpen;
    
    navLinks.classList.toggle('active', isMenuOpen);
    toggle.classList.toggle('active', isMenuOpen);
    
    // Prevent body scroll when menu is open
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    
    trackEvent('mobile_menu_toggle', { opened: isMenuOpen });
    console.log(`📱 Mobile menu ${isMenuOpen ? 'opened' : 'closed'}`);
}

function closeMobileMenu() {
    const navLinks = document.getElementById('navLinks');
    const toggle = document.querySelector('.mobile-menu-toggle');
    
    if (!navLinks || !toggle) return;
    
    isMenuOpen = false;
    navLinks.classList.remove('active');
    toggle.classList.remove('active');
    document.body.style.overflow = '';
}

// Smooth Scrolling
function setupSmoothScrolling() {
    // Add smooth scroll support for older browsers
    if (!('scrollBehavior' in document.documentElement.style)) {
        loadSmoothScrollPolyfill();
    }

    // Handle all anchor links
    document.addEventListener('click', (e) => {
        const target = e.target.closest('a[href^="#"]');
        if (target) {
            e.preventDefault();
            const targetId = target.getAttribute('href').substring(1);
            scrollToSection(targetId);
        }
    });
}

function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    if (!element) {
        console.warn(`⚠️ Section not found: ${sectionId}`);
        return;
    }

    const headerHeight = document.querySelector('.header')?.offsetHeight || 80;
    const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
    const offsetPosition = elementPosition - headerHeight - 20;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    // Close mobile menu if open
    closeMobileMenu();
    
    // Track navigation
    trackEvent('section_navigate', { section: sectionId });
    
    console.log(`🎯 Scrolled to section: ${sectionId}`);
}

// Scroll Animations
function setupScrollAnimations() {
    // Check for Intersection Observer support
    if (!('IntersectionObserver' in window)) {
        console.warn('⚠️ IntersectionObserver not supported, using fallback');
        // Add all animations immediately as fallback
        document.querySelectorAll('.feature-card, .section-title, .pricing-card, .footer-content').forEach(el => {
            el.classList.add('animate');
        });
        return;
    }

    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const animationObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Stagger animations for better visual effect
                setTimeout(() => {
                    entry.target.classList.add('animate');
                    trackEvent('element_animated', { element: entry.target.className });
                }, index * 100);
                
                animationObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll(
        '.feature-card, .section-title, .pricing-card, .footer-content'
    );
    
    animateElements.forEach(el => {
        animationObserver.observe(el);
    });

    console.log(`🎬 Setup animations for ${animateElements.length} elements`);
}

// Interactive Elements
function setupInteractiveElements() {
    // Add ripple effect to clickable elements
    const clickableElements = document.querySelectorAll(
        '.btn, .feature-card, .hero-feature, .pricing-card, .features-list li'
    );

    clickableElements.forEach(element => {
        element.addEventListener('click', createRippleEffect);
    });

    // Add hover effects for non-touch devices
    if (!document.body.classList.contains('touch-device')) {
        setupHoverEffects();
    }

    // Setup keyboard navigation
    setupKeyboardNavigation();

    console.log(`🖱️ Setup interactions for ${clickableElements.length} elements`);
}

function createRippleEffect(e) {
    const button = e.currentTarget;
    const ripple = document.createElement('div');
    
    // Calculate ripple size and position
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    // Style the ripple
    ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
        z-index: 1;
    `;
    
    // Ensure button has relative positioning
    const originalPosition = button.style.position;
    button.style.position = 'relative';
    button.style.overflow = 'hidden';
    
    // Add ripple and remove after animation
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
        if (!originalPosition) {
            button.style.position = '';
        }
    }, 600);
}

function setupHoverEffects() {
    // Add enhanced hover effects for desktop
    const hoverElements = document.querySelectorAll('.feature-card, .btn');
    
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            element.style.transform = element.style.transform + ' scale(1.02)';
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = element.style.transform.replace(' scale(1.02)', '');
        });
    });
}

function setupKeyboardNavigation() {
    // Add keyboard support for interactive elements
    document.addEventListener('keydown', (e) => {
        // ESC to close mobile menu
        if (e.key === 'Escape' && isMenuOpen) {
            closeMobileMenu();
        }
        
        // Enter/Space to activate focused elements
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('btn')) {
            e.preventDefault();
            e.target.click();
        }
    });
}

// Form Handling
function setupFormHandling() {
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

    console.log(`📝 Setup form handling for ${forms.length} forms`);
}

function handleFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    
    // Validate all fields
    const isValid = validateForm(form);
    
    if (isValid) {
        showLoadingState(form);
        
        // Simulate form submission
        setTimeout(() => {
            hideLoadingState(form);
            showNotification('✅ Form submitted successfully!', 'success');
            form.reset();
            trackEvent('form_submitted', { form: form.id || 'unknown' });
        }, 2000);
    }
}

function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    const fieldType = field.type;
    
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = `${field.name || 'This field'} is required.`;
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
    
    // Password validation
    if (fieldType === 'password' && value && value.length < 8) {
        isValid = false;
        errorMessage = 'Password must be at least 8 characters long.';
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
    errorDiv.innerHTML = `<span class="material-icons">error</span>${message}`;
    
    field.parentNode.insertBefore(errorDiv, field.nextSibling);
}

function clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
}

function showLoadingState(form) {
    form.classList.add('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="material-icons rotating">hourglass_empty</span> Processing...';
    }
}

function hideLoadingState(form) {
    form.classList.remove('loading');
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="material-icons">send</span> Submit';
    }
}

// Asset Loading
function loadLogo() {
    const logoImg = document.getElementById('logoImg');
    if (!logoImg) return;
    
    // Try multiple logo sources
    const logoSources = [
        'https://www.canva.com/design/DAGvYPE5J44/view?utm_content=DAGvYPE5J44&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton',
        'https://via.placeholder.com/40x40/3b82f6/ffffff?text=T',
        'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" fill="#3b82f6"/><text x="20" y="25" text-anchor="middle" fill="white" font-family="Arial" font-size="20" font-weight="bold">T</text></svg>')
    ];
    
    let currentIndex = 0;
    
    function tryLoadLogo() {
        if (currentIndex >= logoSources.length) {
            console.warn('⚠️ All logo sources failed, using fallback');
            return;
        }
        
        const img = new Image();
        img.onload = () => {
            logoImg.src = logoSources[currentIndex];
            console.log(`✅ Logo loaded from source ${currentIndex + 1}`);
        };
        img.onerror = () => {
            currentIndex++;
            tryLoadLogo();
        };
        img.src = logoSources[currentIndex];
    }
    
    tryLoadLogo();
}

function loadFavicon() {
    // Try to load Canva favicon, fallback to generated one
    const favicon = document.querySelector('link[rel="icon"]');
    if (!favicon) return;
    
    const canvaFavicon = 'https://www.canva.com/design/DAGvYY3lktU/view';
    const fallbackFavicon = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#3b82f6"/><text x="16" y="20" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">T</text></svg>');
    
    const testImg = new Image();
    testImg.onload = () => favicon.href = canvaFavicon;
    testImg.onerror = () => favicon.href = fallbackFavicon;
    testImg.src = canvaFavicon;
}

// Performance Optimizations
function setupPerformanceOptimizations() {
    // Lazy load images
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    if (img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                        img.classList.add('loaded');
                        imageObserver.unobserve(img);
                    }
                }
            });
        });
        
        document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
        });
    }
    
    // Preload critical resources
    preloadCriticalResources();
    
    // Setup service worker
    registerServiceWorker();
    
    console.log('⚡ Performance optimizations applied');
}

function preloadCriticalResources() {
    const criticalResources = [
        { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap', as: 'style' },
        { href: 'https://fonts.googleapis.com/icon?family=Material+Icons', as: 'style' }
    ];
    
    criticalResources.forEach(resource => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = resource.href;
        link.as = resource.as;
        document.head.appendChild(link);
    });
}

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('✅ Service Worker registered:', registration.scope);
                    
                    // Check for updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                showNotification('🔄 App update available! Refresh to get the latest version.', 'info', 10000);
                            }
                        });
                    });
                })
                .catch(error => {
                    console.warn('⚠️ Service Worker registration failed:', error);
                });
        });
    }
}

// Accessibility Features
function setupAccessibility() {
    // Add skip navigation link
    const skipLink = document.createElement('a');
    skipLink.href = '#main-content';
    skipLink.textContent = 'Skip to main content';
    skipLink.className = 'skip-link';
    skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 6px;
        background: #000;
        color: #fff;
        padding: 8px;
        text-decoration: none;
        z-index: 10001;
        transition: top 0.3s;
    `;
    skipLink.addEventListener('focus', () => skipLink.style.top = '6px');
    skipLink.addEventListener('blur', () => skipLink.style.top = '-40px');
    document.body.insertBefore(skipLink, document.body.firstChild);
    
    // Improve focus indicators
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            document.body.classList.add('keyboard-navigation');
        }
    });
    
    document.addEventListener('mousedown', () => {
        document.body.classList.remove('keyboard-navigation');
    });
    
    // Add ARIA labels where needed
    enhanceARIA();
    
    console.log('♿ Accessibility features enabled');
}

function enhanceARIA() {
    // Add ARIA labels to buttons without text
    document.querySelectorAll('button .material-icons:only-child').forEach(icon => {
        const button = icon.parentElement;
        if (!button.getAttribute('aria-label')) {
            const iconName = icon.textContent;
            button.setAttribute('aria-label', iconName.replace(/_/g, ' '));
        }
    });
    
    // Mark decorative images
    document.querySelectorAll('img:not([alt])').forEach(img => {
        img.setAttribute('alt', '');
        img.setAttribute('role', 'presentation');
    });
}

// Error Handling
function setupErrorHandling() {
    // Global error handler
    window.addEventListener('error', (e) => {
        console.error('❌ JavaScript Error:', e.error);
        trackEvent('javascript_error', {
            message: e.message,
            filename: e.filename,
            line: e.lineno,
            column: e.colno
        });
        
        // Show user-friendly error message for critical errors
        if (e.error && e.error.name === 'ChunkLoadError') {
            showNotification('⚠️ Loading error. Please refresh the page.', 'error');
        }
    });
    
    // Promise rejection handler
    window.addEventListener('unhandledrejection', (e) => {
        console.error('❌ Unhandled Promise Rejection:', e.reason);
        trackEvent('promise_rejection', { reason: e.reason?.toString() });
    });
    
    // Network status handling
    window.addEventListener('online', () => {
        showNotification('✅ Connection restored!', 'success');
        trackEvent('network_online');
    });
    
    window.addEventListener('offline', () => {
        showNotification('⚠️ You are offline. Some features may be limited.', 'warning');
        trackEvent('network_offline');
    });
    
    console.log('🛡️ Error handling setup complete');
}

// Notification System
function showNotification(message, type = 'info', duration = 5000) {
    // Remove existing notifications to prevent spam
    document.querySelectorAll('.notification').forEach(n => n.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icon = getNotificationIcon(type);
    const color = getNotificationColor(type);
    
    notification.innerHTML = `
        <span class="material-icons" style="color: ${color}">${icon}</span>
        <span class="notification-message">${message}</span>
        <button class="notification-close" onclick="removeNotification(this.parentElement)">
            <span class="material-icons">close</span>
        </button>
    `;
    
    // Apply styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: white;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        max-width: 400px;
        z-index: 10000;
        transform: translateX(100%);
        opacity: 0;
        transition: all 0.3s ease;
        border-left: 4px solid ${color};
        font-family: Inter, sans-serif;
        font-size: 0.9rem;
        line-height: 1.4;
    `;
    
    // Mobile responsive positioning
    if (window.innerWidth <= 768) {
        notification.style.left = '10px';
        notification.style.right = '10px';
        notification.style.maxWidth = 'none';
        notification.style.transform = 'translateY(-100%)';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    requestAnimationFrame(() => {
        if (window.innerWidth <= 768) {
            notification.style.transform = 'translateY(0)';
        } else {
            notification.style.transform = 'translateX(0)';
        }
        notification.style.opacity = '1';
    });
    
    // Auto remove
    setTimeout(() => {
        removeNotification(notification);
    }, duration);
    
    // Track notification
    trackEvent('notification_shown', { type, message: message.substring(0, 50) });
    
    console.log(`📢 Notification: ${type} - ${message.substring(0, 50)}...`);
}

function getNotificationIcon(type) {
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    return icons[type] || 'info';
}

function getNotificationColor(type) {
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    return colors[type] || '#3b82f6';
}

function removeNotification(notification) {
    if (notification && notification.parentNode) {
        if (window.innerWidth <= 768) {
            notification.style.transform = 'translateY(-100%)';
        } else {
            notification.style.transform = 'translateX(100%)';
        }
        notification.style.opacity = '0';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
}

// User Action Handlers
function showGetStarted() {
    showNotification('🚀 Registration opening soon! Join our waitlist for early access to Thynk POS.', 'info', 6000);
    trackEvent('get_started_clicked');
}

function showDemo() {
    showNotification('🎥 Interactive demo coming soon! Experience all features before launch.', 'info', 6000);
    trackEvent('demo_requested');
}

function showComingSoon() {
    showNotification('🔐 Login portal launching soon! Current users will receive access details.', 'info', 6000);
    trackEvent('login_attempted');
}

function showFeatureDetail(feature) {
    const featureMessages = {
        menu: '🍽️ Menu Management: Create stunning digital menus with photos, descriptions, and real-time pricing!',
        table: '🪑 Table Management: Visual floor plans, real-time status tracking, and seamless order assignment!',
        billing: '🧾 Smart Billing: Auto-calculate taxes, apply discounts, and generate professional invoices instantly!',
        print: '🖨️ Print & Share: Thermal printer support plus digital sharing via WhatsApp, email, and SMS!',
        analytics: '📊 Sales Analytics: Comprehensive dashboards with revenue tracking, popular items, and growth insights!',
        inventory: '📦 Inventory Control: Smart stock alerts, automated reordering, and waste reduction tools!',
        unlimited: '∞ Unlimited Everything: No restrictions on menu items, tables, or orders - scale as you grow!',
        tables: '🪑 Advanced Table Management: Handle hundreds of tables with visual status indicators!',
        invoicing: '📄 Professional Invoicing: Customizable templates with your branding and tax compliance!',
        bills: '📱 Digital Bill Sharing: Send bills instantly via multiple channels with payment links!',
        users: '👥 Multi-User System: Role-based access for staff with activity tracking and permissions!',
        support: '🆘 24/7 Expert Support: Get help anytime via chat, email, or phone - we\'re always here!',
        ads: '🚫 Ad-Free Experience: Clean, professional interface without distractions or interruptions!'
    };
    
    const message = featureMessages[feature] || '✨ This powerful feature will transform your restaurant operations!';
    showNotification(message, 'info', 5000);
    trackEvent('feature_explored', { feature });
}

// Analytics and Tracking
function trackEvent(eventName, data = {}) {
    const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        ...data
    };
    
    // In production, send to analytics service
    console.log('📊 Event tracked:', eventData);
    
    // Store locally for now
    const events = JSON.parse(localStorage.getItem('thynk_analytics') || '[]');
    events.push(eventData);
    localStorage.setItem('thynk_analytics', JSON.stringify(events.slice(-100))); // Keep last 100 events
}

// Utility Functions
const utils = {
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
    },
    
    formatCurrency: (amount, currency = '₹') => {
        return `${currency}${parseFloat(amount).toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    },
    
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
    
    generateId: () => Date.now().toString(36) + Math.random().toString(36).substr(2),
    
    isMobile: () => window.innerWidth <= 768,
    
    isLocalhost: () => ['localhost', '127.0.0.1', ''].includes(window.location.hostname)
};

// Feature Detection
const features = {
    touch: 'ontouchstart' in window,
    standalone: isStandalone,
    ios: isIOSDevice,
    serviceWorker: 'serviceWorker' in navigator,
    intersectionObserver: 'IntersectionObserver' in window,
    localStorage: (() => {
        try {
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            return true;
        } catch (e) {
            return false;
        }
    })(),
    webGL: (() => {
        try {
            const canvas = document.createElement('canvas');
            return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch (e) {
            return false;
        }
    })()
};

// Global API
window.ThynkPOS = {
    version: '0.5',
    creator: 'Anas Lila Software',
    utils,
    features,
    showNotification,
    trackEvent,
    scrollToSection,
    toggleMobileMenu,
    installPWA,
    showGetStarted,
    showDemo,
    showComingSoon,
    showFeatureDetail
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    const engagementTime = Date.now() - engagementStartTime;
    trackEvent('session_end', { 
        engagementTime,
        pageViews: parseInt(sessionStorage.getItem('pageViews') || '1')
    });
});

// Page visibility tracking
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        trackEvent('page_hidden');
    } else {
        trackEvent('page_visible');
    }
});

// Development helpers
if (utils.isLocalhost()) {
    console.log('🔧 Development mode enabled');
    console.log('Available features:', features);
    console.log('Global API:', window.ThynkPOS);
    window.ThynkPOS.debug = true;
}

// Add required CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes ripple {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .rotating {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .field-error {
        color: #ef4444;
        font-size: 0.875rem;
        margin-top: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .field-error .material-icons {
        font-size: 16px;
    }
    
    input.error, textarea.error, select.error {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    }
    
    .skip-link:focus {
        top: 6px !important;
    }
    
    .keyboard-navigation *:focus {
        outline: 2px solid #3b82f6 !important;
        outline-offset: 2px !important;
    }
    
    @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
        }
    }
`;
document.head.appendChild(style);

console.log('✅ Thynk POS JavaScript loaded successfully!');
