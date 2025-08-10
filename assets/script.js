// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function () {
    const mobileMenuButton = document.querySelector('.header__mobile-menu');
    const nav = document.querySelector('.nav');

    if (mobileMenuButton && nav) {
        mobileMenuButton.addEventListener('click', function () {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            nav.classList.toggle('nav--open');
        });
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', function (event) {
        if (!event.target.closest('.header__mobile-menu') && !event.target.closest('.nav')) {
            if (mobileMenuButton) {
                mobileMenuButton.setAttribute('aria-expanded', 'false');
            }
            if (nav) {
                nav.classList.remove('nav--open');
            }
        }
    });

    // Smooth scrolling for anchor links
    const anchorLinks = document.querySelectorAll('a[href^="#"]');
    anchorLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Enhanced image loading with error handling
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        // Set initial opacity for smooth loading
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';

        // Add error handling
        img.addEventListener('error', function () {
            console.warn('Failed to load image:', this.src);
            this.style.display = 'none';

            // Add fallback content if needed
            const parent = this.parentElement;
            if (parent && parent.classList.contains('service-card__icon')) {
                parent.innerHTML = '<div class="service-card__icon-fallback">🏥</div>';
            } else if (parent && parent.classList.contains('team-member__photo')) {
                parent.innerHTML = '<div class="team-member__photo-fallback">👨‍⚕️</div>';
            }
        });

        // Add load success handling
        img.addEventListener('load', function () {
            this.style.opacity = '1';
        });

        // Add timeout for images that take too long
        setTimeout(() => {
            if (img.style.opacity === '0') {
                console.warn('Image loading timeout:', img.src);
                img.style.opacity = '1';
            }
        }, 5000);
    });

    // Intersection Observer for animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function (entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    const animateElements = document.querySelectorAll('.service-card, .team-member, .about-preview__content');
    animateElements.forEach(el => {
        observer.observe(el);
    });
});

// Add CSS for mobile menu, animations, and fallback styles
const style = document.createElement('style');
style.textContent = `
    .nav--open {
        display: block !important;
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 1rem;
    }
    
    .nav--open .nav__list {
        flex-direction: column;
        gap: 1rem;
    }
    
    .animate-in {
        animation: fadeInUp 0.6s ease forwards;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(30px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .service-card__icon-fallback {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 2rem;
        margin: 0 auto 1.5rem;
    }
    
    .team-member__photo-fallback {
        width: 200px;
        height: 200px;
        border-radius: 50%;
        background: #e2e8f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 4rem;
        margin: 0 auto 1.5rem;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    @media (max-width: 768px) {
        .nav {
            display: none;
        }
        
        .team-member__photo-fallback {
            width: 150px;
            height: 150px;
            font-size: 3rem;
        }
    }
`;
document.head.appendChild(style);
