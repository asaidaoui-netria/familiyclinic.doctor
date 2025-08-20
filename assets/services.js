// Services Page JavaScript

document.addEventListener('DOMContentLoaded', function () {
    // Handle page load with hash in URL (navigation from other pages)
    if (window.location.hash) {
        setTimeout(() => {
            const targetElement = document.querySelector(window.location.hash);
            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                // Extra offset for cross-page navigation to ensure title visibility
                const targetPosition = targetElement.offsetTop - headerHeight - 160;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        }, 100); // Small delay to ensure page is fully loaded
    }

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');

    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                // Account for header height, sidebar, and provide extra space for better visibility
                const targetPosition = targetElement.offsetTop - headerHeight - 120;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });



    // Enhanced button interactions
    const serviceButtons = document.querySelectorAll('.service-detail__actions .btn');

    serviceButtons.forEach(button => {
        button.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px) scale(1.02)';
        });

        button.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });

        // Add click feedback
        button.addEventListener('click', function () {
            this.style.transform = 'translateY(0) scale(0.98)';
            setTimeout(() => {
                this.style.transform = 'translateY(0) scale(1)';
            }, 150);
        });
    });

    // Service navigation (if needed for future enhancements)
    // Detect language and use appropriate service IDs
    const currentLang = document.documentElement.lang || 'en';

    const serviceIds = currentLang === 'fr' ? [
        'medecine-familiale',
        'consultations-holistiques',
        'quantum-scan',
        'naturopathie',
        'hijamah',
        'physiotherapie',
        'dermatologie',
        'expertise-medicale-judiciaire',
        'perte-de-poids'
    ] : [
        'family-medicine',
        'holistic-consultations',
        'quantum-scan',
        'naturopathy',
        'hijamah',
        'physiotherapy',
        'dermatology',
        'judiciary-medical-expertise',
        'weight-loss'
    ];

    // Service navigation is now in HTML, no need to create dynamically

    // Active navigation highlighting
    function updateActiveNavigation() {
        const navLinks = document.querySelectorAll('.services-nav__link');
        const headerHeight = document.querySelector('.header').offsetHeight;
        // Use same offset calculation as scroll function for consistency
        const scrollPosition = window.scrollY + headerHeight + 120;

        serviceIds.forEach((serviceId, index) => {
            const serviceElement = document.getElementById(serviceId);
            if (serviceElement) {
                const serviceTop = serviceElement.offsetTop;
                const serviceBottom = serviceTop + serviceElement.offsetHeight;

                if (scrollPosition >= serviceTop && scrollPosition < serviceBottom) {
                    navLinks.forEach(link => link.classList.remove('services-nav__link--active'));
                    if (navLinks[index]) {
                        navLinks[index].classList.add('services-nav__link--active');
                    }
                }
            }
        });
    }

    // Update active navigation on scroll
    window.addEventListener('scroll', updateActiveNavigation);

    // Initialize active state
    updateActiveNavigation();

    // Enhanced accessibility
    const serviceCards = document.querySelectorAll('.service-detail');
    serviceCards.forEach(card => {
        // Add keyboard navigation
        card.setAttribute('tabindex', '0');

        card.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const button = this.querySelector('.btn');
                if (button) {
                    button.click();
                }
            }
        });

        // Add ARIA labels
        const title = card.querySelector('.service-detail__title');
        if (title) {
            card.setAttribute('aria-labelledby', title.id || 'service-title');
        }
    });

    // Performance optimization: Debounce scroll events
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

    // Apply debouncing to scroll events
    const debouncedUpdateNavigation = debounce(updateActiveNavigation, 10);
    window.removeEventListener('scroll', updateActiveNavigation);
    window.addEventListener('scroll', debouncedUpdateNavigation);

    // Error handling for missing elements
    function handleMissingElements() {
        const requiredElements = [
            '.services-hero',
            '.services-grid',
            '.service-detail'
        ];

        requiredElements.forEach(selector => {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`Required element not found: ${selector}`);
            }
        });
    }

    handleMissingElements();

    // Analytics tracking (if needed)
    function trackServiceInteraction(serviceName) {
        // Placeholder for analytics tracking
        console.log(`Service interaction: ${serviceName}`);
    }

    // Track service button clicks
    serviceButtons.forEach(button => {
        button.addEventListener('click', function () {
            const serviceCard = this.closest('.service-detail');
            const serviceTitle = serviceCard?.querySelector('.service-detail__title')?.textContent;
            if (serviceTitle) {
                trackServiceInteraction(serviceTitle);
            }
        });
    });
});
