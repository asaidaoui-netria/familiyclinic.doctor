// Language Switcher and Localization JavaScript

class LanguageSwitcher {
    constructor(options = {}) {
        this.currentLang = document.documentElement.lang || 'en';
        this.supportedLanguages = ['en', 'fr', 'ar'];
        this.config = {
            autoDetect: true,
            debug: false,
            ...options
        };
        this.languageMap = {
            // English variants
            'en': 'en',
            'en-US': 'en',
            'en-GB': 'en',
            'en-CA': 'en',
            // French variants
            'fr': 'fr',
            'fr-FR': 'fr',
            'fr-CA': 'fr',
            'fr-BE': 'fr',
            'fr-CH': 'fr',
            'fr-MA': 'fr', // French (Morocco)
            // Arabic variants
            'ar': 'ar',
            'ar-MA': 'ar', // Arabic (Morocco)
            'ar-SA': 'ar',
            'ar-EG': 'ar',
            'ar-AE': 'ar'
        };
        this.init();
    }

    init() {
        // Auto-detect language only on first visit to root pages
        if (this.config.autoDetect) {
            this.autoDetectLanguage();
        }
        this.setupLanguageSwitcher();
        this.updateCurrentLanguageDisplay();
    }

    autoDetectLanguage() {
        // Only auto-detect on root pages and if user hasn't already chosen a language
        if (!this.shouldAutoDetect()) {
            this.debug('Auto-detection skipped: conditions not met');
            return;
        }

        const detectedLang = this.detectBrowserLanguage();
        this.debug(`Browser language detected: ${detectedLang}, Current page: ${this.currentLang}`);

        // If detected language is different from current page language and we support it
        if (detectedLang && detectedLang !== this.currentLang) {
            this.debug(`Redirecting to ${detectedLang} version`);

            // Mark that we've attempted auto-detection to prevent future redirects
            this.setLanguagePreferenceDetected();

            // Redirect to the detected language
            this.redirectToLanguage(detectedLang);
        } else {
            this.debug('No redirect needed - language matches or not supported');
            // Mark that we've checked, even if no redirect was needed
            this.setLanguagePreferenceDetected();
        }
    }

    shouldAutoDetect() {
        // Don't auto-detect if:
        // 1. User has already been auto-redirected (stored in sessionStorage)
        // 2. User has manually chosen a language (stored in localStorage) 
        // 3. Auto-detection has been disabled (stored in localStorage)
        // 4. Not on a root page (avoid redirecting from deep links)

        const hasBeenDetected = sessionStorage.getItem('langAutoDetected');
        const userPreference = localStorage.getItem('userLanguageChoice');
        const autoDetectDisabled = localStorage.getItem('autoDetectDisabled');
        const isRootPage = this.isRootPage();

        this.debug(`Auto-detect conditions - hasBeenDetected: ${!!hasBeenDetected}, userPreference: ${!!userPreference}, disabled: ${!!autoDetectDisabled}, isRootPage: ${isRootPage}`);

        return !hasBeenDetected && !userPreference && !autoDetectDisabled && isRootPage;
    }

    isRootPage() {
        const path = window.location.pathname;
        const rootPages = [
            '/',
            '/index.html',
            '/about.html',
            '/services.html',
            '/contact.html',
            '/blog/',
            '/blog/catalog.html'
        ];

        return rootPages.includes(path) || path === '';
    }

    detectBrowserLanguage() {
        // Get user's language preferences in order of preference
        const languages = navigator.languages || [navigator.language || navigator.userLanguage];

        // Find the first supported language
        for (const lang of languages) {
            // Try exact match first
            if (this.languageMap[lang]) {
                return this.languageMap[lang];
            }

            // Try language code without region (e.g., 'fr' from 'fr-CA')
            const shortLang = lang.split('-')[0];
            if (this.languageMap[shortLang]) {
                return this.languageMap[shortLang];
            }
        }

        // Default to English if no supported language found
        return 'en';
    }

    redirectToLanguage(targetLang) {
        if (targetLang === 'en') {
            // English is the default, no redirect needed
            return;
        }

        const currentPath = window.location.pathname;
        let newPath;

        if (currentPath === '/' || currentPath === '/index.html' || currentPath === '') {
            newPath = `/${targetLang}/index.html`;
        } else if (currentPath.startsWith('/blog/')) {
            newPath = `/${targetLang}${currentPath}`;
        } else {
            // For other root pages like about.html, services.html, etc.
            const fileName = currentPath.split('/').pop() || 'index.html';
            newPath = `/${targetLang}/${fileName}`;
        }

        // Perform the redirect
        window.location.href = newPath;
    }

    setLanguagePreferenceDetected() {
        // Mark that auto-detection has been attempted (session-based)
        sessionStorage.setItem('langAutoDetected', 'true');
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
    // Initialize with default options
    // To customize, you can pass options like:
    // new LanguageSwitcher({ autoDetect: false, debug: true });
    new LanguageSwitcher();
});

// Export for potential external use
window.LanguageSwitcher = LanguageSwitcher;

/*
USAGE EXAMPLES:

1. Default initialization (auto-detection enabled):
   new LanguageSwitcher();

2. Initialize with debugging enabled:
   new LanguageSwitcher({ debug: true });

3. Initialize without auto-detection:
   new LanguageSwitcher({ autoDetect: false });

4. Control auto-detection programmatically:
   LanguageSwitcher.disableAutoDetection();  // Disable for all future visits
   LanguageSwitcher.enableAutoDetection();   // Re-enable auto-detection
   LanguageSwitcher.clearLanguagePreferences(); // Reset all language preferences

5. Debug current state in browser console:
   // Open browser console and run:
   sessionStorage.getItem('langAutoDetected')    // Check if auto-detection has run
   localStorage.getItem('userLanguageChoice')    // Check user's manual choice
   localStorage.getItem('autoDetectDisabled')    // Check if auto-detection is disabled
*/
