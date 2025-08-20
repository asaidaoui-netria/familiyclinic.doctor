// Language Switcher and Localization JavaScript

class LanguageSwitcher {
    constructor() {
        this.currentLang = document.documentElement.lang || 'en';
        this.init();
    }

    init() {
        this.setupLanguageSwitcher();
        this.updateCurrentLanguageDisplay();
    }

    setupLanguageSwitcher() {
        const switcher = document.querySelector('.language-switcher');
        if (!switcher) return;

        const toggle = switcher.querySelector('.language-switcher__toggle');
        const menu = switcher.querySelector('.language-switcher__menu');

        if (!toggle || !menu) return;

        // Toggle menu visibility
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
            toggle.setAttribute('aria-expanded', !isExpanded);
            menu.classList.toggle('show', !isExpanded);
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!switcher.contains(e.target)) {
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('show');
            }
        });

        // Handle menu item clicks - no JavaScript navigation, just close menu
        menu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                // Close the menu when any link is clicked
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('show');
                // Let the browser handle navigation normally
            }
        });

        // Close menu on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                toggle.setAttribute('aria-expanded', 'false');
                menu.classList.remove('show');
            }
        });
    }

    updateCurrentLanguageDisplay() {
        const currentSpan = document.querySelector('.language-switcher__current');
        if (currentSpan) {
            const langMap = {
                'en': 'EN',
                'fr': 'FR',
                'ar': 'AR'
            };
            currentSpan.textContent = langMap[this.currentLang] || 'EN';
        }

        // Update active state in menu
        const menuLinks = document.querySelectorAll('.language-switcher__menu a');
        menuLinks.forEach(link => {
            const linkLang = link.getAttribute('data-lang');
            if (linkLang === this.currentLang) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    
}

// Initialize language switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new LanguageSwitcher();
});

// Export for potential external use
window.LanguageSwitcher = LanguageSwitcher;
