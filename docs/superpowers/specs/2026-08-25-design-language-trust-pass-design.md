# Design Language & Trust Pass

## Objective

Follow-up to the Eleventy migration (which fixed infrastructure: SEO, i18n contracts, CI). This pass improves the design language and patient trust signals without restructuring pages. Decisions confirmed with the clinic: phone-first conversion (no form/WhatsApp), self-hosted web fonts.

## A. Phone-First Conversion

- Persistent `tel:` call button in the header on all pages, all locales, sourced from `src/_data/site.js` phone data.
- Hero and page CTAs renamed from "Book Appointment" to honest call labels (EN "Call to Book an Appointment", FR "Appelez pour réserver", AR equivalent) and point at `tel:` directly.
- No booking form, no WhatsApp.

## B. Factual Trust Content

- Homepage info band below the hero: address, phone, hours rendered from `site.js`.
- Out of scope (owner-provided content, listed as follow-ups): testimonials, license/registration numbers, pricing/insurance, emergency guidance, Gmail→domain email.

## C. Design Tokens & Brand Unification

- `:root` custom properties in `assets/styles.css` for colors (primary scale, slate neutrals, semantic), border radii, shadows, font stacks. Page CSS files (`about.css`, `contact.css`, `services.css`, `localization.css`) consume tokens instead of hex literals.
- Retire the purple `#667eea→#764ba2` gradient: services/contact heroes use the same blue treatment as the home hero. `#667eea` accents replaced with the primary blue; link colors verified ≥4.5:1 contrast on white (fall back to blue-700 if not).
- Legacy neutrals (`#333`, `#666`, Tailwind "gray" scale) unified onto the slate scale.

## D. Self-Hosted Fonts

- Inter (latin, 400/500/600/700) and Cairo (arabic, 400/700) woff2 committed under `assets/fonts/`.
- `@font-face` with `font-display: swap`; body stack trimmed to `Inter` + system fallbacks; Arabic stack trimmed to `Cairo` + system fallbacks.

## E. Accessibility

- Exactly one `h1` per generated page (logo demoted from h1; page title is the h1).
- Skip-to-content link in the base layout with visible focus styling.
- `aria-hidden="true"` on decorative emoji/icons (contact detail icons, FAQ toggles, switcher chevron).
- FAQ accordion: remove the 200px `max-height` clip, add `aria-controls`/`id` pairs, hide collapsed answers from all users.
- `:focus-visible` styles for hamburger, language toggle/menu, FAQ buttons, pagination-free pages.
- Touch targets ≥44×44px for hamburger and language switcher.

## F. Performance

- Hero image: `loading="eager"` + `fetchpriority="high"`; all other images keep lazy loading.
- `width`/`height` attributes on all template images (dimensions are encoded in filenames).

## G. Auto-Redirect Flash

- Language auto-detect moves to a small inline `<head>` script in the base layout (same guards: `localStorage.userLanguageChoice`, `sessionStorage.langAutoDetected`, `localStorage.autoDetectDisabled`; same root-page scope), so redirect happens before first paint. `assets/localization.js` keeps switcher behavior only.

## Verification

New node:test contracts, written first and observed failing:

- every generated page has exactly one `h1`
- every page has a skip link targeting the main region
- every page header exposes a `tel:` CTA using the site phone number
- hero CTA links use `tel:` (no "Book Appointment" label remains)
- homepage renders an info band with address, phone, hours
- no `#667eea`/`#764ba2` remains in published CSS
- `assets/styles.css` defines `:root` custom properties consumed by page CSS
- all `<img>` in generated pages carry `width` and `height`; home hero image is eager
- declared font families resolve to committed woff2 files
- inline head script present with the language guards

Full `npm run verify` (build + script syntax checks + tests) must stay green.

## Non-Goals

- No new pages or routes; no changes to sitemap/robots behavior.
- No fabricated trust content (testimonials, credentials, pricing).
- No service-card photo→icon redesign (needs new artwork).
- No changes to `assets/images/original` archival folder.
