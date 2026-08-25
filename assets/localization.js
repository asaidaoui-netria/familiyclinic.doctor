// Language Switcher and Localization JavaScript


class LanguageSwitcher {
    constructor(options = {}) {
        this.currentLang = document.documentElement.lang || 'en';
        this.supportedLanguages = ['en', 'fr', 'ar'];
        this.config = {
            debug: false,
            ...options
        };
        this.init();
    }

    init() {
        // Language auto-detection happens in the inline <head> script of the
        // base layout (before first paint). This class only drives the switcher UI.
        this.setupLanguageSwitcher();
        this.updateCurrentLanguageDisplay();
    }

    recordUserLanguageChoice(language) {
        // Store user's manual language choice (persistent)
        localStorage.setItem('userLanguageChoice', language);
    }

    extractLanguageFromHref(href) {
        // Extract language from URL structure
        try {
            const url = new URL(href);
            const pathParts = url.pathname.split('/');

            // Check if the first path segment is a language code
            if (pathParts.length > 1 && this.supportedLanguages.includes(pathParts[1])) {
                return pathParts[1];
            }

            // Default to English if no language prefix found
            return 'en';
        } catch (e) {
            return 'en';
        }
    }

    debug(message) {
        if (this.config.debug) {
            console.log(`[LanguageSwitcher] ${message}`);
        }
    }

    // Static methods for external control
    static disableAutoDetection() {
        localStorage.setItem('autoDetectDisabled', 'true');
    }

    static enableAutoDetection() {
        localStorage.removeItem('autoDetectDisabled');
        sessionStorage.removeItem('langAutoDetected');
    }

    static clearLanguagePreferences() {
        localStorage.removeItem('userLanguageChoice');
        localStorage.removeItem('autoDetectDisabled');
        sessionStorage.removeItem('langAutoDetected');
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

        // Handle menu item clicks - record user choice and close menu
        menu.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                // Record user's manual language choice
                const selectedLang = e.target.getAttribute('data-lang') ||
                    this.extractLanguageFromHref(e.target.href);
                if (selectedLang) {
                    this.recordUserLanguageChoice(selectedLang);
                }

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

/*
USAGE EXAMPLES:

1. Default initialization:
   new LanguageSwitcher();

2. Initialize with debugging enabled:
   new LanguageSwitcher({ debug: true });

3. Control auto-detection programmatically (affects the inline head detector):
   LanguageSwitcher.disableAutoDetection();   // Disable for all future visits
   LanguageSwitcher.enableAutoDetection();    // Re-enable auto-detection
   LanguageSwitcher.clearLanguagePreferences(); // Reset all language preferences

4. Debug current state in browser console:
   sessionStorage.getItem('langAutoDetected')    // Check if auto-detection has run
   localStorage.getItem('userLanguageChoice')    // Check user's manual choice
   localStorage.getItem('autoDetectDisabled')    // Check if auto-detection is disabled
*/
