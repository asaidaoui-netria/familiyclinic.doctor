# Quiet Clinic Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the trilingual Family Clinic site with the approved "Quiet Clinic" design language (white surfaces, one blue accent, hairlines instead of shadows, typographic heroes) and restructure page layouts, without losing any existing content.

**Architecture:** Eleventy static site with per-locale Nunjucks templates (`src/en|fr|ar/*.njk`), shared includes, centralized data in `src/_data/site.js`, plain CSS per page under `assets/`, and Node built-in test runner contract tests over the built output (`_site/`). The refresh rewrites the presentation layer (5 CSS files) and restructures templates; JS behavior and data stay.

**Tech Stack:** Eleventy (11ty), Nunjucks, plain CSS (custom properties), Node ≥18 `node:test`, npm scripts (`npm run build`, `npm run verify`).

## Global Constraints

- Phone-first: every primary CTA uses `tel:{{ site.contact.phone }}` (`+212-641-745-441`). No booking form, no WhatsApp.
- Trilingual EN/FR/AR; Arabic mirrors via existing `dir="rtl"` + `assets/localization.css`. Phone numbers keep `dir="ltr"` in AR.
- No `box-shadow` and no `linear-gradient`/`radial-gradient` may appear in any `assets/*.css` file (sole exception: mobile-nav shadow injected by `assets/script.js`, which is runtime chrome, not a stylesheet).
- Fonts stay self-hosted Inter/Cairo (`assets/fonts/*.woff2`); keep the three existing `@font-face` blocks and their `unicode-range`s verbatim.
- No content loss: all 9 services with full copy, both team profiles, 4 values, 3 mission features, 6 FAQ items, address/phone/email/hours, map embed, directions, footer sections survive in all locales.
- No invented marketing claims. New copy is limited to the exact strings written in this plan.
- Never touch contact data in `src/_data/site.js` (mapUrl, phone, email, hours, addressLines).
- Every `<img>` keeps explicit `width`/`height` attributes.
- `npm run verify` must pass before every commit.
- Do not commit `.DS_Store` files or `11ty-implementation-guide.md`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `tests/visual-refresh.test.mjs` | New design-language contracts | Create (Task 1) |
| `tests/design-trust.test.mjs` | Existing trust contracts | Modify (Task 1) |
| `assets/styles.css` | Shared design system: tokens, base, buttons, header, footer, hero, info band, section primitives, featured cards, about/team/visit/cta-band, 404 | Rewrite (Task 2) |
| `src/en/index.njk`, `src/fr/index.njk`, `src/ar/index.njk` | Homepage per locale | Rewrite (Tasks 3–4) |
| `assets/services.css`, `src/*/services.njk` | Services page | Rewrite CSS + targeted template edits (Task 5) |
| `assets/about.css`, `src/*/about.njk` | About page | Rewrite CSS + targeted template edits (Task 6) |
| `assets/contact.css`, `src/*/contact.njk` | Contact page | Rewrite CSS + targeted template edits (Task 7) |
| `src/en/404.njk` | 404 page (EN only) | Edit (Task 8) |
| `assets/localization.css` | Language switcher + RTL | Targeted edits (Task 9) |

---

### Task 0: Baseline — commit the pending trust-pass work

The working tree contains the completed (verified) trust/design-language pass, still uncommitted. Commit it as its own baseline before the refresh starts.

**Files:**
- Modify: `.gitignore` (already contains `.superpowers/` and `.DS_Store`)

- [ ] **Step 1: Inspect the working tree**

Run: `git status --short`
Expected: modified `assets/*`, `src/**`, `eleventy.config.js`, `tests/*`; untracked `assets/fonts/`, `docs/superpowers/specs/2026-08-25-design-language-trust-pass-design.md`, `tests/design-trust.test.mjs`, `11ty-implementation-guide.md`, several `.DS_Store`.

- [ ] **Step 2: Untrack the `.DS_Store` files that were committed before the ignore rule existed**

```bash
git rm -r --cached --quiet .DS_Store assets/.DS_Store assets/images/.DS_Store fr/.DS_Store
```

- [ ] **Step 3: Stage everything except the user-owned guide**

```bash
git add assets docs eleventy.config.js src tests .gitignore
git status --short | grep -v '^A\|^M\|^R\|^D' || true
```
Expected: only `?? 11ty-implementation-guide.md` (and possibly `?? .DS_Store` entries) remain unstaged.

- [ ] **Step 4: Verify the baseline is green**

Run: `npm run verify`
Expected: `tests 40`, `pass 40`, `fail 0`.

- [ ] **Step 5: Commit**

```bash
git commit -m "feat: trust and design-language pass — tokens, self-hosted fonts, phone-first CTAs, a11y contracts"
```

---

### Task 1: Write the failing design contracts (RED)

**Files:**
- Create: `tests/visual-refresh.test.mjs`
- Modify: `tests/design-trust.test.mjs`
- Test: both files

**Interfaces:**
- Consumes: `readOutput(relativePath)` and `EXPECTED_HTML_ROUTES` from `tests/helpers/site.mjs`
- Produces: the contracts every later task must satisfy — token names `--surface/--surface-soft/--surface-tint/--ink/--accent/--hairline/--radius-card`; homepage `data-section` markers `services/about/team/visit`; `class="featured-card"` ×3; `class="hero__eyebrow"`; `class="service-detail"` ×9 each followed by a `tel:` CTA; footer anchors; 404 `h1.error-title` + tel.

- [ ] **Step 1: Write the new contract file**

Create `tests/visual-refresh.test.mjs`:

```js
import assert from "node:assert/strict";
import test from "node:test";

import { readOutput } from "./helpers/site.mjs";

const SITE_PHONE = "+212-641-745-441";
const PHONE_HREF = new RegExp(`href="tel:${SITE_PHONE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);

const HOME_ROUTES = ["index.html", "fr/index.html", "ar/index.html"];
const SERVICES_ROUTES = ["services.html", "fr/services.html", "ar/services.html"];
const PAGE_CSS = ["styles.css", "about.css", "contact.css", "services.css", "localization.css"];

const SERVICE_ANCHORS = {
  "services.html": ["family-medicine", "holistic-consultations", "quantum-scan", "naturopathy", "hijamah", "physiotherapy", "dermatology", "judiciary-medical-expertise", "weight-loss"],
  "fr/services.html": ["medecine-familiale", "consultations-holistiques", "quantum-scan", "naturopathie", "hijamah", "physiotherapie", "dermatologie", "expertise-medicale-judiciaire", "perte-de-poids"],
  "ar/services.html": ["family-medicine", "holistic-consultations", "quantum-scan", "naturopathy", "hijamah", "physiotherapy", "dermatology", "judiciary-medical-expertise", "weight-loss"]
};

test("published stylesheets contain no shadows and no gradients", async () => {
  for (const file of PAGE_CSS) {
    const css = await readOutput(`assets/${file}`);
    assert.doesNotMatch(css, /box-shadow/i, `${file} has no box-shadow`);
    assert.doesNotMatch(css, /linear-gradient|radial-gradient/i, `${file} has no gradient fills`);
  }
});

test("styles.css defines the Quiet Clinic token set", async () => {
  const css = await readOutput("assets/styles.css");
  for (const token of ["--surface:", "--surface-soft:", "--surface-tint:", "--ink:", "--accent:", "--hairline:", "--radius-card:"]) {
    assert.ok(css.includes(token), `styles.css defines ${token}`);
  }
  assert.match(css, /var\(--accent\)/, "styles.css consumes the accent token");
});

test("page stylesheets consume the shared Quiet Clinic tokens", async () => {
  for (const file of ["about.css", "contact.css", "services.css"]) {
    const css = await readOutput(`assets/${file}`);
    assert.match(css, /var\(--(accent|ink|hairline|surface)/, `${file} consumes shared tokens`);
  }
});

test("the homepage hero is typographic", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/);
    assert.ok(hero, `${route} renders a hero`);
    assert.match(hero[0], /class="hero__eyebrow"/, `${route} hero has an eyebrow`);
    assert.doesNotMatch(hero[0], /<img/, `${route} hero has no image`);
  }
});

test("homepage sections follow the approved order", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const order = ["services", "about", "team", "visit"].map((name) => html.indexOf(`data-section="${name}"`));
    assert.ok(order.every((index) => index > -1), `${route} renders all four numbered sections`);
    for (let i = 1; i < order.length; i++) {
      assert.ok(order[i] > order[i - 1], `${route} keeps the approved section order`);
    }
  }
});

test("the homepage features exactly three service cards", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    assert.equal((html.match(/class="featured-card"/g) ?? []).length, 3, `${route} shows three featured cards`);
  }
});

test("the footer keeps quick links, nine service links, and contact details", async () => {
  const anchorsByRoute = {
    "index.html": SERVICE_ANCHORS["services.html"],
    "fr/index.html": SERVICE_ANCHORS["fr/services.html"],
    "ar/index.html": SERVICE_ANCHORS["ar/services.html"]
  };
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
    for (const anchor of anchorsByRoute[route]) {
      assert.ok(footer.includes(`#${anchor}`), `${route} footer links to ${anchor}`);
    }
    assert.match(footer, PHONE_HREF, `${route} footer keeps the phone number`);
    assert.ok(footer.includes("https://maps.app.goo.gl/sPxKYDMUdsN9dVV2A"), `${route} footer keeps the map link`);
  }
});

test("services pages keep all nine detailed services, each with a phone CTA", async () => {
  for (const route of SERVICES_ROUTES) {
    const html = await readOutput(route);
    const articles = html.split('class="service-detail"');
    assert.equal(articles.length, 10, `${route} renders nine service articles`);
    for (const anchor of SERVICE_ANCHORS[route]) {
      assert.ok(html.includes(`id="${anchor}"`), `${route} keeps anchor ${anchor}`);
    }
    for (let i = 1; i < articles.length; i++) {
      assert.match(articles[i], PHONE_HREF, `${route} service article ${i} exposes a tel CTA`);
    }
  }
});

test("the 404 page pairs the not-found heading with a call CTA", async () => {
  const html = await readOutput("404.html");
  assert.match(html, /<h1 class="error-title">/, "404 heading is an h1");
  assert.match(html, PHONE_HREF, "404 offers a call CTA");
});
```

- [ ] **Step 2: Update the two outdated contracts in `tests/design-trust.test.mjs`**

The typographic hero replaces the photo hero, and the token set changes. Replace this block (the "stylesheets are driven by shared design tokens" test):

```js
test("stylesheets are driven by shared design tokens", async () => {
  const css = await readOutput("assets/styles.css");
  assert.match(css, /:root\s*{[^}]*--accent/, "styles.css defines color tokens");
  assert.match(css, /var\(--accent/, "styles.css consumes its own tokens");
  for (const file of ["about.css", "contact.css", "services.css"]) {
    const pageCss = await readOutput(`assets/${file}`);
    assert.match(pageCss, /var\(--/, `${file} consumes design tokens`);
  }
});
```

Delete the entire test named `"the homepage hero image loads eagerly with high fetch priority"` (the hero no longer has an image; the typographic-hero contract lives in `visual-refresh.test.mjs`).

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npm run build && node --test tests/`
Expected: FAIL — the new `visual-refresh` tests fail (current CSS has shadows/gradients, old tokens, photo hero, no `data-section` markers), and the edited `design-trust` token/hero tests fail. All other tests still pass.

- [ ] **Step 4: Commit the red contracts**

```bash
git add tests/visual-refresh.test.mjs tests/design-trust.test.mjs
git commit -m "test: add Quiet Clinic design-language contracts (red)"
```

---

### Task 2: Rewrite the shared design system (`assets/styles.css`)

**Files:**
- Rewrite: `assets/styles.css`
- Test: `tests/visual-refresh.test.mjs`, `tests/design-trust.test.mjs`, `tests/foundation.test.mjs`

**Interfaces:**
- Consumes: nothing new; keeps the class names used by `header.njk`, `footer.njk`, `base.njk`
- Produces: the token names consumed by Tasks 5–7 (`--surface`, `--surface-soft`, `--surface-tint`, `--ink`, `--ink-soft`, `--ink-faint`, `--ink-label`, `--accent`, `--accent-hover`, `--hairline`, `--radius-card`, `--radius-pill`) plus compat aliases (`--color-primary`, `--color-primary-dark`, `--color-primary-tint`, `--color-primary-border`, `--color-surface`, `--color-border`, `--color-heading`, `--color-body`, `--color-muted`) so `localization.css` keeps working mid-migration; classes `.hero__eyebrow`, `.section`, `.section__container`, `.section-eyebrow`, `.section-title`, `.section-subtitle`, `.section-cta`, `.featured-grid`, `.featured-card`, `.visit-band`, `.cta-band`

- [ ] **Step 1: Replace `assets/styles.css` with the Quiet Clinic design system**

Write exactly this content:

```css
/* Quiet Clinic design tokens */
:root {
    --surface: #ffffff;
    --surface-soft: #f8fafc;
    --surface-tint: #eff6ff;
    --ink: #0f172a;
    --ink-soft: #475569;
    --ink-faint: #64748b;
    --ink-label: #94a3b8;
    --accent: #1d4ed8;
    --accent-hover: #1e40af;
    --hairline: #e2e8f0;
    --radius-card: 10px;
    --radius-pill: 999px;
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --header-height: 72px;
    --header-height-mobile: 64px;

    /* Compat aliases for stylesheets still referencing legacy token names */
    --color-primary: var(--accent);
    --color-primary-dark: var(--accent-hover);
    --color-primary-tint: var(--surface-tint);
    --color-primary-border: var(--hairline);
    --color-surface: var(--surface-soft);
    --color-border: var(--hairline);
    --color-heading: var(--ink);
    --color-body: var(--ink-soft);
    --color-muted: var(--ink-faint);
}

/* Self-hosted fonts */
@font-face {
    font-family: 'Inter';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('/assets/fonts/inter-latin.woff2') format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

@font-face {
    font-family: 'Cairo';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('/assets/fonts/cairo-arabic.woff2') format('woff2');
    unicode-range: U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0898-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC;
}

@font-face {
    font-family: 'Cairo';
    font-style: normal;
    font-weight: 400 700;
    font-display: swap;
    src: url('/assets/fonts/cairo-latin.woff2') format('woff2');
    unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}

/* Reset and base */
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

html {
    scroll-behavior: smooth;
}

body {
    font-family: var(--font-sans);
    line-height: 1.6;
    color: var(--ink-soft);
    background-color: var(--surface);
}

/* Skip link */
.skip-link {
    position: absolute;
    top: -4rem;
    inset-inline-start: 1rem;
    z-index: 2000;
    padding: 0.75rem 1.5rem;
    background-color: var(--accent);
    color: #fff;
    border-radius: var(--radius-card);
    font-weight: 500;
    transition: top 0.2s ease;
}

.skip-link:focus {
    top: 1rem;
    color: #fff;
}

/* Typography */
h1,
h2,
h3,
h4,
h5,
h6 {
    font-weight: 600;
    line-height: 1.25;
    margin-bottom: 1rem;
    color: var(--ink);
}

h1 {
    font-size: 2.5rem;
    letter-spacing: -0.02em;
}

h2 {
    font-size: 2rem;
    letter-spacing: -0.01em;
}

h3 {
    font-size: 1.5rem;
}

h4 {
    font-size: 1.25rem;
}

p {
    margin-bottom: 1rem;
}

a {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.15s ease;
}

a:hover {
    color: var(--accent-hover);
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.6875rem 1.375rem;
    border-radius: var(--radius-card);
    font-weight: 600;
    font-size: 0.9375rem;
    line-height: 1.5;
    text-align: center;
    border: 1px solid transparent;
    cursor: pointer;
    transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.btn--primary {
    background-color: var(--accent);
    color: #fff;
}

.btn--primary:hover {
    background-color: var(--accent-hover);
    color: #fff;
}

.btn--secondary {
    background-color: transparent;
    color: var(--ink);
    border-color: var(--hairline);
}

.btn--secondary:hover {
    border-color: var(--accent);
    color: var(--accent);
}

/* Container */
.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* Header */
.header {
    background-color: var(--surface);
    border-bottom: 1px solid var(--hairline);
    position: sticky;
    top: 0;
    z-index: 1000;
}

.header__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height);
    gap: 1rem;
}

.header__logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
}

.header__logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
    transition: opacity 0.15s ease;
}

.header__logo-link:hover {
    opacity: 0.8;
}

.header__logo-img {
    width: 44px;
    height: 44px;
    object-fit: contain;
}

.header__logo-text {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
}

.header__call {
    padding: 0.5rem 1.125rem;
    font-size: 0.875rem;
    white-space: nowrap;
    border-radius: var(--radius-pill);
}

/* Navigation */
.nav__list {
    display: flex;
    list-style: none;
    gap: 2rem;
    margin: 0;
}

.nav__link {
    font-weight: 500;
    color: var(--ink-soft);
    padding: 0.5rem 0;
    position: relative;
}

.nav__link:hover,
.nav__link--active {
    color: var(--accent);
}

.nav__link--active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background-color: var(--accent);
}

/* Mobile menu button */
.header__mobile-menu {
    display: none;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    width: 44px;
    height: 44px;
    gap: 4px;
}

.header__mobile-menu-line {
    width: 25px;
    height: 3px;
    background-color: var(--ink);
    transition: all 0.15s ease;
}

/* Main content */
.main {
    min-height: calc(100vh - var(--header-height) - 300px);
}

/* Typographic hero */
.hero {
    background-color: var(--surface);
    border-bottom: 1px solid var(--hairline);
    padding: 5rem 0 4rem;
}

.hero__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.hero__eyebrow {
    font-size: 0.8125rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--accent);
    margin-bottom: 1rem;
}

.hero__title {
    font-size: clamp(2.25rem, 5vw, 3.25rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin-bottom: 1rem;
    max-width: 22ch;
}

.hero__description {
    font-size: 1.25rem;
    color: var(--ink-faint);
    max-width: 52ch;
    margin-bottom: 2rem;
}

.hero__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
}

/* Practical information band */
.info-band {
    background-color: var(--surface);
    border-bottom: 1px solid var(--hairline);
    padding: 1.5rem 0;
}

.info-band__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

.info-band__item {
    border-inline-start: 1px solid var(--hairline);
    padding-inline-start: 1.5rem;
}

.info-band__item:first-child {
    border-inline-start: 0;
    padding-inline-start: 0;
}

.info-band__label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-label);
    margin-bottom: 0.25rem;
}

.info-band__text {
    margin: 0;
    font-size: 0.9375rem;
    color: var(--ink-soft);
    line-height: 1.5;
}

.info-band__link {
    color: var(--accent);
}

.info-band__link:hover {
    color: var(--accent-hover);
}

/* Section primitives */
.section {
    padding: 4.5rem 0;
    background-color: var(--surface);
}

.section + .section {
    border-top: 1px solid var(--hairline);
}

.section__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.section-eyebrow {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--ink-label);
    margin-bottom: 0.75rem;
}

.section-title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 0.75rem;
}

.section-subtitle {
    font-size: 1.125rem;
    color: var(--ink-faint);
    max-width: 60ch;
    margin-bottom: 2.5rem;
}

.section-cta {
    margin-top: 2.5rem;
}

/* Featured service cards */
.featured-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
}

.featured-card {
    display: flex;
    align-items: flex-start;
    gap: 0.875rem;
    padding: 1.25rem;
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    color: inherit;
    transition: border-color 0.15s ease, background-color 0.15s ease;
}

.featured-card:hover {
    border-color: var(--accent);
    background-color: var(--surface-soft);
    color: inherit;
}

.featured-card__chip {
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 8px;
    background-color: var(--surface-tint);
    color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
}

.featured-card__body {
    display: block;
    min-width: 0;
}

.featured-card__title {
    display: block;
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0.25rem;
}

.featured-card__desc {
    display: block;
    font-size: 0.9375rem;
    color: var(--ink-faint);
    line-height: 1.5;
}

.featured-card__arrow {
    margin-inline-start: auto;
    color: var(--accent);
    flex: none;
}

[dir="rtl"] .featured-card__arrow {
    transform: scaleX(-1);
}

/* About preview */
.about-preview {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 3rem;
    align-items: center;
}

.about-preview__description {
    font-size: 1.0625rem;
    color: var(--ink-soft);
    margin-bottom: 1.25rem;
}

.about-preview__img {
    width: 100%;
    height: auto;
    max-height: 400px;
    object-fit: cover;
    border-radius: var(--radius-card);
    border: 1px solid var(--hairline);
}

/* Team */
.team-preview__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
    margin-bottom: 0;
}

.team-member {
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    padding: 2rem 1.5rem;
    text-align: center;
}

.team-member__photo,
.team-member__image {
    margin-bottom: 1.25rem;
}

.team-member__img {
    width: 160px;
    height: 160px;
    object-fit: cover;
    border-radius: 50%;
    border: 1px solid var(--hairline);
}

.team-member__name {
    font-size: 1.25rem;
    color: var(--ink);
    margin-bottom: 0.25rem;
}

.team-member__title {
    font-size: 1rem;
    color: var(--accent);
    font-weight: 600;
    margin-bottom: 0.75rem;
}

.team-member__description {
    color: var(--ink-faint);
    font-size: 0.9375rem;
    margin-bottom: 0;
}

.team-preview__cta {
    margin-top: 2rem;
}

/* Visit band */
.visit-band {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 2rem;
    align-items: start;
}

.visit-band__address {
    font-size: 1.125rem;
    color: var(--ink);
    font-weight: 500;
}

.visit-band__note {
    color: var(--ink-faint);
}

.visit-band__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1rem;
}

.visit-band__hours {
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    background-color: var(--surface-soft);
    padding: 1.5rem;
}

.visit-band__hours-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-label);
    margin-bottom: 0.75rem;
}

.visit-band__hours-line {
    font-size: 0.9375rem;
    color: var(--ink-soft);
    margin-bottom: 0.375rem;
}

.visit-band__hours-line:last-child {
    margin-bottom: 0;
}

/* CTA band */
.cta-band {
    background-color: var(--surface-soft);
    border-top: 1px solid var(--hairline);
    padding: 4rem 1rem;
    text-align: center;
}

.cta-band__title {
    font-size: 1.75rem;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin-bottom: 0.5rem;
}

.cta-band__text {
    color: var(--ink-faint);
    margin-bottom: 1.5rem;
}

/* 404 */
.error-page {
    padding: 5rem 1rem;
    text-align: center;
}

.error-content {
    max-width: 42rem;
    margin: 0 auto;
}

.error-code {
    font-size: 5rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1;
    color: var(--accent);
}

.error-title {
    font-size: 2rem;
    color: var(--ink);
    margin: 1rem 0;
}

.error-message {
    color: var(--ink-faint);
    margin-bottom: 2rem;
}

.error-actions {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2.5rem;
}

.error-links {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    text-align: start;
}

.error-link {
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    padding: 1rem;
    color: inherit;
    transition: border-color 0.15s ease;
}

.error-link:hover {
    border-color: var(--accent);
    color: inherit;
}

.error-link-title {
    font-weight: 600;
    color: var(--ink);
    margin-bottom: 0.25rem;
}

.error-link-desc {
    font-size: 0.875rem;
    color: var(--ink-faint);
}

/* Footer */
.footer {
    background-color: var(--surface);
    border-top: 1px solid var(--hairline);
    color: var(--ink-soft);
    padding: 3rem 0 1rem;
}

.footer__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.footer__content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 2rem;
    margin-bottom: 2rem;
}

.footer__section {
    margin-bottom: 1rem;
}

.footer__logo {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
}

.footer__logo-link {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    text-decoration: none;
    color: inherit;
    transition: opacity 0.15s ease;
}

.footer__logo-link:hover {
    opacity: 0.8;
}

.footer__logo-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
}

.footer__logo-text {
    font-size: 1.125rem;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
}

.footer__description {
    color: var(--ink-faint);
    line-height: 1.6;
}

.footer__section-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-label);
    margin-bottom: 1rem;
}

.footer__links {
    list-style: none;
}

.footer__links li {
    margin-bottom: 0.5rem;
}

.footer__link {
    color: var(--ink-soft);
}

.footer__link:hover {
    color: var(--accent);
}

.footer__contact-item {
    color: var(--ink-soft);
    margin-bottom: 1rem;
    line-height: 1.6;
}

.footer__bottom {
    border-top: 1px solid var(--hairline);
    padding-top: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.footer__copyright {
    color: var(--ink-faint);
    margin: 0;
    font-size: 0.875rem;
}

.footer__powered-by {
    color: var(--ink-faint);
    margin: 0;
    font-size: 0.875rem;
}

.footer__netria-logo {
    height: 1rem;
    width: auto;
    vertical-align: middle;
    margin: 0 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
    .header__container {
        height: var(--header-height-mobile);
    }

    .nav {
        display: none;
    }

    .header__mobile-menu {
        display: flex;
    }

    h1 {
        font-size: 2rem;
    }

    h2 {
        font-size: 1.75rem;
    }

    h3 {
        font-size: 1.25rem;
    }

    .hero {
        padding: 3rem 0 2.5rem;
    }

    .info-band__container {
        grid-template-columns: 1fr;
        gap: 1rem;
    }

    .info-band__item {
        border-inline-start: 0;
        padding-inline-start: 0;
        border-top: 1px solid var(--hairline);
        padding-top: 1rem;
    }

    .info-band__item:first-child {
        border-top: 0;
        padding-top: 0;
    }

    .section {
        padding: 3rem 0;
    }

    .featured-grid {
        grid-template-columns: 1fr;
    }

    .about-preview {
        grid-template-columns: 1fr;
        gap: 2rem;
    }

    .team-preview__grid {
        grid-template-columns: 1fr;
    }

    .visit-band {
        grid-template-columns: 1fr;
    }

    .error-links {
        grid-template-columns: 1fr;
    }

    .footer {
        padding: 2rem 0 1rem;
    }

    .footer__content {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .footer__bottom {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
    }
}

@media (max-width: 480px) {
    .container {
        padding: 0 0.75rem;
    }

    .btn {
        padding: 0.625rem 1.25rem;
        font-size: 0.875rem;
    }

    .header__call {
        padding: 0.5rem 0.75rem;
        font-size: 0.8125rem;
    }

    .team-member__img {
        width: 130px;
        height: 130px;
    }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
    html {
        scroll-behavior: auto;
    }

    * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
}

/* Focus styles for keyboard navigation */
.btn:focus-visible,
.nav__link:focus-visible,
.featured-card:focus-visible,
.error-link:focus-visible,
.footer__link:focus-visible,
.info-band__link:focus-visible,
.header__logo-link:focus-visible,
.header__call:focus-visible,
.header__mobile-menu:focus-visible,
.language-switcher__toggle:focus-visible,
.language-switcher__menu a:focus-visible,
.faq-item__question:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .btn--primary {
        background-color: #000;
        color: #fff;
        border: 2px solid #000;
    }

    .btn--secondary {
        background-color: #fff;
        color: #000;
        border: 2px solid #000;
    }
}
```

- [ ] **Step 2: Build and run the full suite**

Run: `npm run verify`
Expected: the no-shadow/no-gradient and token tests in `visual-refresh.test.mjs` now PASS; markup-dependent tests (typographic hero, section order, featured cards, services tel CTAs, 404 tel) still FAIL — templates come next. No new failures in `foundation.test.mjs`.

- [ ] **Step 3: Commit**

```bash
git add assets/styles.css
git commit -m "style: Quiet Clinic design system — tokens, hairlines, no shadows"
```

---

### Task 3: Rebuild the English homepage

**Files:**
- Rewrite: `src/en/index.njk`
- Test: `tests/visual-refresh.test.mjs` (home contracts), `tests/design-trust.test.mjs`

**Interfaces:**
- Consumes: Task 2 classes (`hero__eyebrow`, `section`, `featured-card`, `visit-band`, `cta-band`); `site.contact.phone`, `site.contact.mapUrl`, `site.locales[locale]`, `site.serviceAnchors[locale]`, `localizedUrl` filter
- Produces: the homepage structure FR/AR mirror in Task 4

- [ ] **Step 1: Replace `src/en/index.njk` with the new structure**

Keep the existing frontmatter block (lines 1–12) unchanged. Replace the body with:

```njk
        <!-- Typographic Hero -->
        <section class="hero">
            <div class="hero__container">
                <p class="hero__eyebrow">KENITRA · MOROCCO</p>
                <h1 class="hero__title">Comprehensive Healthcare for Your Family</h1>
                <p class="hero__description">
                    Experience personalized care in a welcoming environment. Our experienced team provides
                    comprehensive healthcare services for patients of all ages.
                </p>
                <div class="hero__actions">
                    <a href="tel:{{ site.contact.phone }}" class="btn btn--primary">{{ site.locales[locale].cta.heroCall }}</a>
                    <a href="#services-section" class="btn btn--secondary">Our Services</a>
                </div>
            </div>
        </section>

        <!-- Practical Information Band -->
        <section class="info-band">
            <div class="info-band__container">
                <div class="info-band__item">
                    <h2 class="info-band__label">{{ site.locales[locale].contact.addressLabel }}</h2>
                    <p class="info-band__text"><a href="{{ site.contact.mapUrl }}" class="info-band__link" target="_blank" rel="noopener noreferrer">{% for line in site.locales[locale].contact.addressLines %}{{ line }}{% if not loop.last %}, {% endif %}{% endfor %}</a></p>
                </div>
                <div class="info-band__item">
                    <h2 class="info-band__label">{{ site.locales[locale].contact.phoneLabel }}</h2>
                    <p class="info-band__text"><a href="tel:{{ site.contact.phone }}" class="info-band__link">{{ site.contact.phone }}</a></p>
                </div>
                <div class="info-band__item">
                    <h2 class="info-band__label">{{ site.locales[locale].contact.hoursLabel }}</h2>
                    <p class="info-band__text">{% for hour in site.locales[locale].contact.footerHours %}{{ hour }}{% if not loop.last %}<br>{% endif %}{% endfor %}</p>
                </div>
            </div>
        </section>

        <!-- 01 — Services -->
        <section class="section" id="services-section" data-section="services">
            <div class="section__container">
                <p class="section-eyebrow">01 — Services</p>
                <h2 class="section-title">Our Services</h2>
                <p class="section-subtitle">Comprehensive healthcare solutions combining traditional and holistic approaches</p>

                <div class="featured-grid">
                    <a class="featured-card" href="{{ 'services' | localizedUrl(locale) }}#{{ site.serviceAnchors[locale][0] }}">
                        <span class="featured-card__chip" aria-hidden="true">✚</span>
                        <span class="featured-card__body">
                            <span class="featured-card__title">{{ site.locales[locale].services[0] }}</span>
                            <span class="featured-card__desc">Comprehensive family healthcare with personalized medical follow-up, prevention, and trusted relationships for all ages.</span>
                        </span>
                        <span class="featured-card__arrow" aria-hidden="true">→</span>
                    </a>
                    <a class="featured-card" href="{{ 'services' | localizedUrl(locale) }}#{{ site.serviceAnchors[locale][1] }}">
                        <span class="featured-card__chip" aria-hidden="true">❋</span>
                        <span class="featured-card__body">
                            <span class="featured-card__title">{{ site.locales[locale].services[1] }}</span>
                            <span class="featured-card__desc">Take care of yourself differently with a global health approach that considers body, mind, and emotions.</span>
                        </span>
                        <span class="featured-card__arrow" aria-hidden="true">→</span>
                    </a>
                    <a class="featured-card" href="{{ 'services' | localizedUrl(locale) }}#{{ site.serviceAnchors[locale][2] }}">
                        <span class="featured-card__chip" aria-hidden="true">◎</span>
                        <span class="featured-card__body">
                            <span class="featured-card__title">{{ site.locales[locale].services[2] }}</span>
                            <span class="featured-card__desc">Advanced bioenergetic technology that analyzes internal imbalances and guides care toward optimal effectiveness.</span>
                        </span>
                        <span class="featured-card__arrow" aria-hidden="true">→</span>
                    </a>
                </div>

                <div class="section-cta">
                    <a href="services.html" class="btn btn--primary">View All Services</a>
                </div>
            </div>
        </section>

        <!-- 02 — About the clinic -->
        <section class="section" data-section="about">
            <div class="section__container">
                <p class="section-eyebrow">02 — About the clinic</p>
                <h2 class="section-title">About Our Clinic</h2>
                <div class="about-preview">
                    <div class="about-preview__content">
                        <p class="about-preview__description">
                            Family Clinic has been serving our community since 2021, providing compassionate and
                            comprehensive healthcare to families. Our team of experienced healthcare professionals is
                            dedicated to delivering personalized care in a warm, welcoming environment.
                        </p>
                        <p class="about-preview__description">
                            We believe in building lasting relationships with our patients and their families, ensuring
                            continuity of care and better health outcomes.
                        </p>
                        <a href="about.html" class="btn btn--secondary">Learn More About Us</a>
                    </div>
                    <div class="about-preview__image">
                        <img src="assets/images/optimized/clinic/about_clinic_desktop_800x400.jpg" width="800" height="400"
                            srcset="assets/images/optimized/clinic/about_clinic_mobile_600x300.jpg 600w, assets/images/optimized/clinic/about_clinic_desktop_800x400.jpg 800w"
                            sizes="(max-width: 768px) 100vw, 50vw" alt="Healthcare professionals in a modern clinic setting"
                            class="about-preview__img" loading="lazy" onerror="this.style.display='none'">
                    </div>
                </div>
            </div>
        </section>

        <!-- 03 — Your care team -->
        <section class="section" data-section="team">
            <div class="section__container">
                <p class="section-eyebrow">03 — Your care team</p>
                <h2 class="section-title">Meet Our Team</h2>
                <p class="section-subtitle">Experienced healthcare professionals dedicated to your family's health</p>

                <div class="team-preview__grid">
                    <div class="team-member">
                        <div class="team-member__photo">
                            <img src="assets/images/optimized/team/dr_my_abdellah_desktop_400x400.png" width="400" height="400"
                                srcset="assets/images/optimized/team/dr_my_abdellah_mobile_300x300.png 300w, assets/images/optimized/team/dr_my_abdellah_desktop_400x400.png 400w"
                                sizes="(max-width: 768px) 300px, 400px"
                                alt="Dr. Said-Alaoui Moulay Abdellah - Family Medicine Physician" class="team-member__img"
                                loading="lazy" onerror="this.style.display='none'">
                        </div>
                        <h3 class="team-member__name">Dr. Said-Alaoui Moulay Abdellah</h3>
                        <p class="team-member__title">Family Medicine Physician</p>
                        <p class="team-member__description">
                            Board-certified family medicine physician with over 40 years of experience in comprehensive
                            family care.
                        </p>
                    </div>

                    <div class="team-member">
                        <div class="team-member__photo">
                            <img src="assets/images/optimized/team/nurse_safae_desktop_400x400.png" width="400" height="400"
                                srcset="assets/images/optimized/team/nurse_safae_mobile_300x300.png 300w, assets/images/optimized/team/nurse_safae_desktop_400x400.png 400w"
                                sizes="(max-width: 768px) 300px, 400px" alt="Nurse Safae - Registered Nurse"
                                class="team-member__img" loading="lazy" onerror="this.style.display='none'">
                        </div>
                        <h3 class="team-member__name">Mrs. Imarhrane Safae</h3>
                        <p class="team-member__title">Registered Nurse</p>
                        <p class="team-member__description">
                            Experienced registered nurse specializing in patient care and health education.
                        </p>
                    </div>
                </div>

                <div class="team-preview__cta">
                    <a href="about.html#team" class="btn btn--secondary">Meet Our Full Team</a>
                </div>
            </div>
        </section>

        <!-- 04 — Visit us -->
        <section class="section" data-section="visit">
            <div class="section__container">
                <p class="section-eyebrow">04 — Visit us</p>
                <h2 class="section-title">Visit Us</h2>
                <div class="visit-band">
                    <div class="visit-band__details">
                        <p class="visit-band__address">{% for line in site.locales[locale].contact.addressLines %}{{ line }}{% if not loop.last %}, {% endif %}{% endfor %}</p>
                        <p class="visit-band__note">Directions and parking information are available on our contact page.</p>
                        <div class="visit-band__actions">
                            <a href="{{ site.contact.mapUrl }}" class="btn btn--primary" target="_blank" rel="noopener noreferrer">Open in Maps</a>
                            <a href="{{ 'contact' | localizedUrl(locale) }}#map-section" class="btn btn--secondary">Directions &amp; Parking</a>
                        </div>
                    </div>
                    <div class="visit-band__hours">
                        <h3 class="visit-band__hours-title">{{ site.locales[locale].contact.hoursLabel }}</h3>
                        {% for hour in site.locales[locale].contact.hours %}
                        <p class="visit-band__hours-line">{{ hour.day }}: {% for time in hour.time %}{{ time }}{% if not loop.last %}, {% endif %}{% endfor %}</p>
                        {% endfor %}
                    </div>
                </div>
            </div>
        </section>

        <!-- Call to action -->
        <section class="cta-band">
            <div class="cta-band__container">
                <h2 class="cta-band__title">Ready when you are.</h2>
                <p class="cta-band__text">Call to book your appointment — we answer during opening hours.</p>
                <a href="tel:{{ site.contact.phone }}" class="btn btn--primary">Call {{ site.contact.phone }}</a>
            </div>
        </section>
```

- [ ] **Step 2: Build and check the English home contracts**

Run: `npm run build && node --test tests/`
Expected: `index.html` passes the typographic-hero, section-order, and featured-card tests. FR/AR home tests still fail. Info-band and one-h1 contracts still pass.

- [ ] **Step 3: Commit**

```bash
git add src/en/index.njk
git commit -m "feat(home): rebuild English homepage with Quiet Clinic layout"
```

---

### Task 4: Rebuild the French and Arabic homepages

**Files:**
- Rewrite: `src/fr/index.njk`, `src/ar/index.njk`
- Test: `tests/visual-refresh.test.mjs`, `tests/design-trust.test.mjs`

**Interfaces:**
- Consumes: Task 3 structure (identical markup, localized copy below)
- Produces: green home contracts for all three locales

- [ ] **Step 1: Replace `src/fr/index.njk`**

Keep the existing frontmatter unchanged. The body is identical to Task 3's EN body with these substitutions (everything else byte-identical, including image paths with the `../assets/` prefix already used by `src/fr/index.njk`):

| EN string | FR string |
|---|---|
| `KENITRA · MOROCCO` | `KÉNITRA · MAROC` |
| `Comprehensive Healthcare for Your Family` (h1) | `Soins de santé complets pour votre famille` |
| Hero description | `Découvrez des soins personnalisés dans un environnement accueillant. Notre équipe expérimentée offre des services de santé complets pour les patients de tous âges.` |
| `Our Services` (ghost button) | `Nos services` |
| `01 — Services` | `01 — Services` |
| `Our Services` (h2) | `Nos Services` |
| Section subtitle | `Solutions de santé complètes combinant approches traditionnelles et holistiques` |
| FM featured desc | `Soins de santé familiaux complets avec suivi médical personnalisé, prévention et relations de confiance pour tous les âges.` |
| Holistic featured desc | `Explorez une approche globale de la santé qui prend en compte le corps, l'esprit et l'émotion.` |
| Quantum featured desc | `Technologie bioénergétique avancée qui analyse les déséquilibres internes et guide la recherche d'une efficacité optimale.` |
| `View All Services` | `Voir tous les services` |
| `02 — About the clinic` | `02 — La clinique` |
| `About Our Clinic` | `À propos de notre clinique` |
| About paragraph 1 | `Family Clinic incarne une nouvelle façon de vivre la santé : humaine, intégrative et tournée vers l'avenir. Nous mettons l'accent sur une médecine personnalisée et bienveillante, adaptée aux besoins réels des familles.` |
| About paragraph 2 | `Notre approche combine expertise médicale, écoute active et ouverture multiculturelle pour garantir une prise en charge de qualité, accessible à tous.` |
| `Learn More About Us` | `En savoir plus sur nous` |
| About image alt | `Professionnels de santé dans un environnement clinique moderne` |
| `03 — Your care team` | `03 — Votre équipe` |
| `Meet Our Team` | `Rencontrez notre équipe` |
| Team subtitle | `Professionnels de santé expérimentés dédiés à la santé de votre famille` |
| Doctor title | `Médecin de famille` |
| Doctor bio | `Médecin de famille certifié avec plus de 40 ans d'expérience dans les soins familiaux complets.` |
| Doctor img alt | `Dr. Said-Alaoui Moulay Abdellah - Médecin de famille` |
| Nurse title | `Infirmière diplômée` |
| Nurse bio | `Infirmière expérimentée spécialisée dans les soins aux patients et l'éducation à la santé.` |
| Nurse img alt | `Mme Imarhrane Safae - Infirmière diplômée` |
| `Meet Our Full Team` | `Rencontrer toute notre équipe` |
| `04 — Visit us` | `04 — Nous trouver` |
| `Visit Us` | `Nous trouver` |
| Visit note | `Les itinéraires et informations de stationnement sont disponibles sur notre page contact.` |
| `Open in Maps` | `Ouvrir dans Google Maps` |
| `Directions &amp; Parking` | `Itinéraires et stationnement` |
| `Ready when you are.` | `Nous sommes disponibles quand vous l'êtes.` |
| CTA band text | `Appelez pour prendre rendez-vous — nous répondons pendant les heures d'ouverture.` |
| `Call {{ site.contact.phone }}` | `Appelez au {{ site.contact.phone }}` |

The address join separator stays `, ` in FR.

- [ ] **Step 2: Replace `src/ar/index.njk`**

Same structure, with these substitutions (keep `../assets/` image paths; add `dir="ltr"` to the info-band phone link exactly as the current AR file does):

| EN string | AR string |
|---|---|
| `KENITRA · MOROCCO` | `القنيطرة · المغرب` |
| h1 | `رعاية صحية شاملة لعائلتك` |
| Hero description | `اختبر الرعاية الشخصية في بيئة ترحيبية. فريقنا ذو الخبرة يوفر خدمات رعاية صحية شاملة للمرضى من جميع الأعمار.` |
| `Our Services` (ghost button) | `خدماتنا` |
| `01 — Services` | `01 — الخدمات` |
| `Our Services` (h2) | `خدماتنا` |
| Section subtitle | `حلول الرعاية الصحية الشاملة التي تجمع بين الأساليب التقليدية والشمولية` |
| FM featured desc | `رعاية صحية شاملة للأسرة مع متابعة طبية شخصية ووقاية وعلاقات موثوقة لجميع الأعمار.` |
| Holistic featured desc | `اعتنِ بنفسك بطريقة مختلفة مع نهج صحي عالمي يأخذ في الاعتبار الجسم والعقل والعواطف.` |
| Quantum featured desc | `تقنية طاقة حيوية متقدمة تحلل الاختلالات الداخلية وتوجه الرعاية نحو تحقيق الفعالية المثلى.` |
| `View All Services` | `عرض جميع الخدمات` |
| `02 — About the clinic` | `02 — حول العيادة` |
| `About Our Clinic` | `حول عيادة الأسرة` |
| About paragraph 1 | `تخدم عيادة الأسرة مجتمعنا منذ عام 2021، حيث نقدم رعاية صحية شاملة ومتعاطفة للعائلات. فريقنا من المهنيين الصحيين ذوي الخبرة ملتزم بتقديم رعاية شخصية في بيئة دافئة وترحيبية.` |
| About paragraph 2 | `نؤمن ببناء علاقات دائمة مع مرضانا وعائلاتهم، مما يضمن استمرارية الرعاية ونتائج صحية أفضل.` |
| `Learn More About Us` | `اعرف المزيد عنا` |
| About image alt | `فريق عيادة الأسرة` |
| `03 — Your care team` | `03 — فريق الرعاية` |
| `Meet Our Team` | `التقي بفريقنا` |
| Team subtitle | `محترفون مخصصون ملتزمون برفاهيتك` |
| Doctor name | `الدكتور سعيد العلوي مولاي عبد الله` |
| Doctor title | `طبيب الأسرة` |
| Doctor bio | `طبيب معتمد في طب الأسرة مع أكثر من 40 عاماً من الخبرة في تقديم الرعاية الشاملة للأسرة.` |
| Doctor img alt | `الدكتور سعيد العلاوي مولاي عبد الله - طبيب الأسرة` |
| Nurse name | `امغران صفاء` |
| Nurse title | `ممرضة` |
| Nurse bio | `ممرضة مسجلة ذات خبرة متخصصة في رعاية المرضى والتثقيف الصحي. تجسد روح المؤسسة وتجمع بين الكفاءة الطبية والاستماع الدقيق.` |
| Nurse img alt | `إمرحان صفاء - ممرضة مسجلة` |
| `Meet Our Full Team` | `تعرف على فريقنا الكامل` |
| `04 — Visit us` | `04 — زورونا` |
| `Visit Us` | `زورونا` |
| Visit note | `تجد معلومات الاتجاهات ومواقف السيارات في صفحة الاتصال.` |
| `Open in Maps` | `افتح في خرائط جوجل` |
| `Directions &amp; Parking` | `الاتجاهات ومواقف السيارات` |
| `Ready when you are.` | `جاهزون من أجلك.` |
| CTA band text | `اتصل لحجز موعدك — نرد خلال ساعات العمل.` |
| `Call {{ site.contact.phone }}` | `اتصل بالرقم {{ site.contact.phone }}` |

Use the `، ` separator when joining `addressLines` in AR (both info band and visit band), matching the current AR template.

- [ ] **Step 3: Build and run the full suite**

Run: `npm run verify`
Expected: all homepage contracts green for EN/FR/AR. Remaining failures are only services/about/contact/404-related.

- [ ] **Step 4: Commit**

```bash
git add src/fr/index.njk src/ar/index.njk
git commit -m "feat(home): mirror Quiet Clinic homepage to French and Arabic"
```

---

### Task 5: Services page — tel CTAs, eyebrow, guidance band, CSS rewrite

**Files:**
- Modify: `src/en/services.njk`, `src/fr/services.njk`, `src/ar/services.njk` (targeted transforms)
- Rewrite: `assets/services.css`
- Test: `tests/visual-refresh.test.mjs` (services contracts)

**Interfaces:**
- Consumes: `.hero__eyebrow`, `.cta-band` from Task 2; keeps `services-hero`, `services-layout`, `services-nav`, `services-grid`, `service-detail` class names
- Produces: 9 `tel:` CTAs per locale, guidance band

- [ ] **Step 1: Apply the mechanical transforms to all three locale files**

Run this Node script (it inserts the eyebrow, swaps each per-service CTA to a primary tel button with the old label kept as secondary, and appends the guidance band):

```bash
node -e '
const fs = require("fs");
const files = {
  "src/en/services.njk": { eyebrow: "OUR SERVICES", bandTitle: "Not sure which service fits?", bandText: "Call us and we will guide you toward the right care.", bandButton: "Call" },
  "src/fr/services.njk": { eyebrow: "NOS SERVICES", bandTitle: "Vous ne savez pas quel service choisir ?", bandText: "Appelez-nous et nous vous guiderons vers le bon soin.", bandButton: "Appelez au" },
  "src/ar/services.njk": { eyebrow: "خدماتنا", bandTitle: "لست متأكداً من الخدمة المناسبة؟", bandText: "اتصل بنا وسنوجهك نحو الرعاية المناسبة.", bandButton: "اتصل بالرقم" }
};
for (const [file, copy] of Object.entries(files)) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace("<div class=\"services-hero__content\">", "<div class=\"services-hero__content\">\n                    <p class=\"hero__eyebrow\">" + copy.eyebrow + "</p>");
  const ctaPattern = /<div class="service-detail__actions">\s*<a href="contact\.html" class="btn btn--primary">([\s\S]*?)<\/a>\s*<\/div>/g;
  html = html.replace(ctaPattern, (match, label) => "<div class=\"service-detail__actions\">\n                                    <a href=\"tel:{{ site.contact.phone }}\" class=\"btn btn--primary\">{{ site.locales[locale].cta.headerCall }}</a>\n                                    <a href=\"contact.html\" class=\"btn btn--secondary\">" + label.trim() + "</a>\n                                </div>");
  html += "\n        <!-- Guidance CTA Band -->\n        <section class=\"cta-band\">\n            <div class=\"cta-band__container\">\n                <h2 class=\"cta-band__title\">" + copy.bandTitle + "</h2>\n                <p class=\"cta-band__text\">" + copy.bandText + "</p>\n                <a href=\"tel:{{ site.contact.phone }}\" class=\"btn btn--primary\">" + copy.bandButton + " {{ site.contact.phone }}</a>\n            </div>\n        </section>\n";
  fs.writeFileSync(file, html);
  console.log("updated", file);
}
'
```

- [ ] **Step 2: Verify the transform counts**

Run: `grep -c 'class="service-detail__actions"' src/en/services.njk src/fr/services.njk src/ar/services.njk`
Expected: 9 per file.
Run: `grep -c 'tel:{{ site.contact.phone }}' src/en/services.njk`
Expected: 10 (9 articles + 1 guidance band).

- [ ] **Step 3: Replace `assets/services.css` with the flat restyle**

```css
/* Services page — Quiet Clinic */

.services-hero {
    background-color: var(--surface);
    border-bottom: 1px solid var(--hairline);
    padding: 4rem 0 3rem;
}

.services-hero__content {
    max-width: 70ch;
}

.services-hero__title {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin-bottom: 1rem;
}

.services-hero__description {
    font-size: 1.125rem;
    color: var(--ink-faint);
    margin-bottom: 0;
}

.services-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    gap: 2.5rem;
    max-width: 1200px;
    margin: 0 auto;
    padding: 3rem 1rem 4rem;
    align-items: start;
}

.services-nav {
    position: sticky;
    top: calc(var(--header-height) + 1rem);
}

.services-nav__container {
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    padding: 1.25rem;
}

.services-nav__title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-label);
    margin-bottom: 0.75rem;
}

.services-nav__links {
    display: flex;
    flex-direction: column;
}

.services-nav__link {
    color: var(--ink-soft);
    padding: 0.375rem 0;
    font-size: 0.9375rem;
}

.services-nav__link:hover {
    color: var(--accent);
}

.service-detail {
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    background-color: var(--surface);
    padding: 2rem;
    margin-bottom: 1.5rem;
    scroll-margin-top: calc(var(--header-height) + 1rem);
}

.service-detail__title {
    font-size: 1.5rem;
    color: var(--ink);
    margin-bottom: 0.25rem;
}

.service-detail__subtitle {
    color: var(--accent);
    font-weight: 500;
    margin-bottom: 1.25rem;
}

.service-detail__description {
    color: var(--ink-soft);
}

.service-detail__body h3 {
    font-size: 1.0625rem;
    color: var(--ink);
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
}

.service-detail__list {
    padding-inline-start: 1.25rem;
    margin-bottom: 1rem;
}

.service-detail__list li {
    color: var(--ink-soft);
    margin-bottom: 0.375rem;
}

.service-detail__cta-text {
    color: var(--ink-faint);
    font-style: italic;
}

.service-detail__actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-top: 1.5rem;
}

@media (max-width: 900px) {
    .services-layout {
        grid-template-columns: 1fr;
        padding-top: 2rem;
    }

    .services-nav {
        position: static;
    }

    .services-nav__links {
        flex-direction: row;
        flex-wrap: wrap;
        gap: 0.25rem 1.25rem;
    }
}
```

- [ ] **Step 4: Build and run the full suite**

Run: `npm run verify`
Expected: services contracts green for all locales (9 anchors, 9 tel CTAs per page). No regressions.

- [ ] **Step 5: Commit**

```bash
git add src/en/services.njk src/fr/services.njk src/ar/services.njk assets/services.css
git commit -m "feat(services): flat Quiet Clinic layout with per-service phone CTAs"
```

---

### Task 6: About page — typographic hero, feature chips, CSS rewrite

**Files:**
- Modify: `src/en/about.njk`, `src/fr/about.njk`, `src/ar/about.njk`
- Rewrite: `assets/about.css`
- Test: full suite

**Interfaces:**
- Consumes: `.hero__eyebrow`, `.cta-band` from Task 2; keeps `about-clinic`, `team`, `values` class names
- Produces: emoji-free feature headings (glyphs become `aria-hidden` chips), tel CTA band

- [ ] **Step 1: Apply the mechanical transforms**

```bash
node -e '
const fs = require("fs");
const files = {
  "src/en/about.njk": { eyebrow: "ABOUT THE CLINIC", bandTitle: "Ready when you are.", bandText: "Call to book your appointment — we answer during opening hours.", bandButton: "Call" },
  "src/fr/about.njk": { eyebrow: "À PROPOS DE LA CLINIQUE", bandTitle: "Nous sommes disponibles quand vous l\u0027êtes.", bandText: "Appelez pour prendre rendez-vous — nous répondons pendant les heures d\u0027ouverture.", bandButton: "Appelez au" },
  "src/ar/about.njk": { eyebrow: "حول العيادة", bandTitle: "جاهزون من أجلك.", bandText: "اتصل لحجز موعدك — نرد خلال ساعات العمل.", bandButton: "اتصل بالرقم" }
};
for (const [file, copy] of Object.entries(files)) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace("<div class=\"hero__content\">", "<div class=\"hero__content\">\n                    <p class=\"hero__eyebrow\">" + copy.eyebrow + "</p>");
  html = html.replace(/\s*<div class="hero__image">\s*<img[^>]*>\s*<\/div>/, "");
  html = html.replace(/<h3>(\p{Extended_Pictographic}\uFE0F?)\s*/gu, "<h3><span class=\"feature-chip\" aria-hidden=\"true\">$1</span>");
  html += "\n        <!-- Call to action -->\n        <section class=\"cta-band\">\n            <div class=\"cta-band__container\">\n                <h2 class=\"cta-band__title\">" + copy.bandTitle + "</h2>\n                <p class=\"cta-band__text\">" + copy.bandText + "</p>\n                <a href=\"tel:{{ site.contact.phone }}\" class=\"btn btn--primary\">" + copy.bandButton + " {{ site.contact.phone }}</a>\n            </div>\n        </section>\n";
  fs.writeFileSync(file, html);
  console.log("updated", file);
}
'
```

- [ ] **Step 2: Verify**

Run: `grep -c "feature-chip" src/en/about.njk src/fr/about.njk src/ar/about.njk`
Expected: 3 per file.
Run: `grep -c 'class="hero__image"' src/en/about.njk src/fr/about.njk src/ar/about.njk`
Expected: 0 per file.

- [ ] **Step 3: Replace `assets/about.css` with the flat restyle**

```css
/* About page — Quiet Clinic */

.about-clinic {
    padding: 4.5rem 0;
}

.about-clinic__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.about-clinic__title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 1.5rem;
}

.about-clinic__description {
    font-size: 1.0625rem;
    color: var(--ink-soft);
    max-width: 75ch;
    margin-bottom: 2.5rem;
}

.about-clinic__features {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2rem;
}

.about-clinic__feature {
    border-inline-start: 2px solid var(--accent);
    padding-inline-start: 1rem;
}

.about-clinic__feature h3 {
    font-size: 1.0625rem;
    color: var(--ink);
    margin-bottom: 0.5rem;
}

.about-clinic__feature p {
    color: var(--ink-faint);
    font-size: 0.9375rem;
    margin-bottom: 0;
}

.feature-chip {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 1.75rem;
    height: 1.75rem;
    border-radius: 6px;
    background-color: var(--surface-tint);
    font-size: 0.9375rem;
    margin-inline-end: 0.5rem;
    vertical-align: middle;
}

.team {
    padding: 4.5rem 0;
    border-top: 1px solid var(--hairline);
}

.team__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.team__title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 0.5rem;
}

.team__subtitle {
    color: var(--ink-faint);
    margin-bottom: 2.5rem;
}

.team__grid {
    display: grid;
    gap: 1.5rem;
}

.team-member--detailed {
    display: grid;
    grid-template-columns: 220px 1fr;
    gap: 2rem;
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    padding: 2rem;
    align-items: start;
}

.team-member--detailed .team-member__img {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 50%;
    border: 1px solid var(--hairline);
}

.team-member--detailed .team-member__name {
    font-size: 1.375rem;
    color: var(--ink);
    margin-bottom: 0.25rem;
}

.team-member--detailed .team-member__title {
    color: var(--accent);
    font-weight: 600;
    margin-bottom: 1rem;
}

.team-member--detailed .team-member__description p {
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.values {
    padding: 4.5rem 0;
    border-top: 1px solid var(--hairline);
}

.values__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.values__title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 2rem;
}

.values__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 1.5rem;
}

.value-card {
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
    padding: 1.5rem;
}

.value-card h3 {
    font-size: 1.0625rem;
    color: var(--ink);
    margin-bottom: 0.5rem;
}

.value-card p {
    color: var(--ink-faint);
    font-size: 0.9375rem;
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .about-clinic__features {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }

    .team-member--detailed {
        grid-template-columns: 1fr;
        justify-items: center;
        text-align: center;
    }
}
```

- [ ] **Step 4: Build and run the full suite**

Run: `npm run verify`
Expected: green (about page keeps one h1, tel CTA in hero actions and band; no image-dimension regressions since the removed hero image had dimensions and no new images were added).

- [ ] **Step 5: Commit**

```bash
git add src/en/about.njk src/fr/about.njk src/ar/about.njk assets/about.css
git commit -m "feat(about): typographic hero, feature chips, flat Quiet Clinic restyle"
```

---

### Task 7: Contact page — eyebrow, map anchor, CTA band, CSS rewrite

**Files:**
- Modify: `src/en/contact.njk`, `src/fr/contact.njk`, `src/ar/contact.njk`
- Rewrite: `assets/contact.css`
- Test: full suite

**Interfaces:**
- Consumes: `.hero__eyebrow`, `.cta-band`; keeps `contact-hero`, `contact-info`, `contact-details__*`, `map-section`, `faq-section`, `faq-item` classes
- Produces: `#map-section` anchor (linked from the homepage visit band), FAQ restyle

- [ ] **Step 1: Apply the mechanical transforms**

```bash
node -e '
const fs = require("fs");
const files = {
  "src/en/contact.njk": { eyebrow: "CONTACT", bandTitle: "Ready when you are.", bandText: "Call to book your appointment — we answer during opening hours.", bandButton: "Call" },
  "src/fr/contact.njk": { eyebrow: "CONTACT", bandTitle: "Nous sommes disponibles quand vous l\u0027êtes.", bandText: "Appelez pour prendre rendez-vous — nous répondons pendant les heures d\u0027ouverture.", bandButton: "Appelez au" },
  "src/ar/contact.njk": { eyebrow: "اتصل بنا", bandTitle: "جاهزون من أجلك.", bandText: "اتصل لحجز موعدك — نرد خلال ساعات العمل.", bandButton: "اتصل بالرقم" }
};
for (const [file, copy] of Object.entries(files)) {
  let html = fs.readFileSync(file, "utf8");
  html = html.replace("<div class=\"contact-hero__content\">", "<div class=\"contact-hero__content\">\n                    <p class=\"hero__eyebrow\">" + copy.eyebrow + "</p>");
  html = html.replace("<section class=\"map-section\">", "<section class=\"map-section\" id=\"map-section\">");
  html += "\n        <!-- Call to action -->\n        <section class=\"cta-band\">\n            <div class=\"cta-band__container\">\n                <h2 class=\"cta-band__title\">" + copy.bandTitle + "</h2>\n                <p class=\"cta-band__text\">" + copy.bandText + "</p>\n                <a href=\"tel:{{ site.contact.phone }}\" class=\"btn btn--primary\">" + copy.bandButton + " {{ site.contact.phone }}</a>\n            </div>\n        </section>\n";
  fs.writeFileSync(file, html);
  console.log("updated", file);
}
'
```

- [ ] **Step 2: Replace `assets/contact.css` with the flat restyle**

```css
/* Contact page — Quiet Clinic */

.contact-hero {
    background-color: var(--surface);
    border-bottom: 1px solid var(--hairline);
    padding: 4rem 0 3rem;
}

.contact-hero__content {
    max-width: 70ch;
}

.contact-hero__title {
    font-size: clamp(2rem, 4vw, 2.75rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    color: var(--ink);
    margin-bottom: 1rem;
}

.contact-hero__description {
    font-size: 1.125rem;
    color: var(--ink-faint);
    margin-bottom: 0;
}

.contact-info {
    padding: 4rem 0;
}

.contact-info__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.contact-details__title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 2rem;
}

.contact-details__grid {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 3rem;
}

.contact-details__item {
    display: flex;
    gap: 0.875rem;
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--hairline);
}

.contact-details__left .contact-details__item:nth-child(2) {
    border-top: 2px solid var(--accent);
}

.contact-details__icon {
    flex: none;
    width: 2.25rem;
    height: 2.25rem;
    border-radius: 8px;
    background-color: var(--surface-tint);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.125rem;
}

.contact-details__label {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-label);
    margin-bottom: 0.25rem;
}

.contact-details__text {
    margin: 0;
    color: var(--ink-soft);
}

.contact-details__link {
    color: var(--accent);
}

.contact-details__link:hover {
    color: var(--accent-hover);
}

.contact-details__day {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.375rem 0;
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.map-section {
    padding: 4rem 0;
    border-top: 1px solid var(--hairline);
}

.map-section__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

.map-section__title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 2rem;
}

.map-section__content {
    display: grid;
    grid-template-columns: 1.5fr 1fr;
    gap: 2rem;
    align-items: start;
}

.map-section__map iframe {
    display: block;
    width: 100%;
    border: 1px solid var(--hairline);
    border-radius: var(--radius-card);
}

.map-section__info-title {
    font-size: 1.0625rem;
    color: var(--ink);
    margin-bottom: 0.5rem;
}

.map-section__info-text {
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.map-section__directions-title {
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--ink-label);
    margin: 1.25rem 0 0.5rem;
}

.map-section__directions-list {
    padding-inline-start: 1.25rem;
}

.map-section__directions-list li {
    color: var(--ink-soft);
    font-size: 0.9375rem;
    margin-bottom: 0.375rem;
}

.faq-section {
    padding: 4rem 0;
    border-top: 1px solid var(--hairline);
}

.faq-section__container {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1rem;
}

.faq-section__title {
    font-size: 2rem;
    color: var(--ink);
    margin-bottom: 1.5rem;
}

.faq-item {
    border-bottom: 1px solid var(--hairline);
}

.faq-item__question {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 1.125rem 0;
    background: none;
    border: none;
    cursor: pointer;
    font-family: inherit;
    font-size: 1rem;
    font-weight: 600;
    color: var(--ink);
    text-align: start;
    min-height: 44px;
}

.faq-item__icon {
    color: var(--accent);
    font-weight: 700;
    font-size: 1.25rem;
    flex: none;
}

.faq-item__answer {
    display: none;
    padding: 0 0 1.25rem;
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.faq-item__answer.active {
    display: block;
}

.faq-item__answer p {
    margin-bottom: 0;
}

@media (max-width: 768px) {
    .contact-details__grid,
    .map-section__content {
        grid-template-columns: 1fr;
        gap: 2rem;
    }
}
```

- [ ] **Step 3: Build and run the full suite**

Run: `npm run verify`
Expected: green — FAQ wiring contracts (`aria-controls`/`id`, no `max-height`) unaffected because only CSS changed.

- [ ] **Step 4: Commit**

```bash
git add src/en/contact.njk src/fr/contact.njk src/ar/contact.njk assets/contact.css
git commit -m "feat(contact): ruled details, hairline FAQ, Quiet Clinic restyle"
```

---

### Task 8: 404 page — add the call CTA

**Files:**
- Modify: `src/en/404.njk`
- Test: `tests/visual-refresh.test.mjs` (404 contract)

**Interfaces:**
- Consumes: `.error-*` styles from Task 2
- Produces: tel CTA in `error-actions`

- [ ] **Step 1: Add the call button as primary action**

In `src/en/404.njk`, replace:

```njk
                <div class="error-actions">
                    <a href="index.html" class="btn btn--primary">Return Home</a>
                    <a href="contact.html" class="btn btn--secondary">Contact Us</a>
                </div>
```

with:

```njk
                <div class="error-actions">
                    <a href="tel:{{ site.contact.phone }}" class="btn btn--primary">Call {{ site.contact.phone }}</a>
                    <a href="index.html" class="btn btn--secondary">Return Home</a>
                    <a href="contact.html" class="btn btn--secondary">Contact Us</a>
                </div>
```

- [ ] **Step 2: Build and run the 404 contract**

Run: `npm run build && node --test tests/visual-refresh.test.mjs`
Expected: PASS (all tests in the file green except any still waiting on Task 9 — at this point all should be green).

- [ ] **Step 3: Commit**

```bash
git add src/en/404.njk
git commit -m "feat(404): add call CTA to the not-found page"
```

---

### Task 9: Localization stylesheet cleanup

**Files:**
- Modify: `assets/localization.css`
- Test: full suite (no-shadow/no-gradient contract covers this file)

**Interfaces:**
- Consumes: compat aliases from Task 2 (`--surface`, `--hairline` resolve for this file too)
- Produces: shadow-free, token-driven language switcher; RTL behavior intact

- [ ] **Step 1: Remove the dropdown shadow (line 58 area)**

In `assets/localization.css`, replace:

```css
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
```

with:

```css
    border: 1px solid var(--hairline);
```

- [ ] **Step 2: Replace the hardcoded white background (line 55 area)**

In `assets/localization.css`, replace:

```css
    background: white;
```

with:

```css
    background: var(--surface);
```

- [ ] **Step 3: Confirm nothing else violates the contract**

Run: `grep -n "box-shadow\|linear-gradient\|radial-gradient" assets/localization.css`
Expected: no output.

- [ ] **Step 4: Build and run the full suite**

Run: `npm run verify`
Expected: all tests green, including "published stylesheets contain no shadows and no gradients".

- [ ] **Step 5: Commit**

```bash
git add assets/localization.css
git commit -m "style(localization): drop dropdown shadow, consume surface tokens"
```

---

### Task 10: Full verification and live spot-checks

**Files:** none (verification only)

- [ ] **Step 1: Clean rebuild and full suite**

Run: `npm run verify`
Expected: build writes 15 files; script checks pass; `tests 48`, `pass 48`, `fail 0` (40 previous, minus the deleted hero-image test, plus 9 new design-language tests).

- [ ] **Step 2: Serve and smoke-test every route and font**

```bash
npx eleventy --serve --port 8899 --quiet >/tmp/11ty-serve.log 2>&1 & SRV=$!
sleep 3
for p in / /fr/ /ar/ /services.html /about.html /contact.html /404.html /assets/styles.css /assets/fonts/inter-latin.woff2 /assets/fonts/cairo-arabic.woff2; do
  printf '%s -> %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code} %{size_download}b' http://localhost:8899$p)"
done
kill $SRV
```
Expected: every route returns `200` with a non-trivial body.

- [ ] **Step 3: Manual visual checklist (browser)**

Open `http://localhost:8899/` (restart the server if killed) and verify:
- EN/FR/AR home: typographic hero, hairline info band, 3 featured cards, about/team/visit sections, CTA band
- AR page mirrors layout; phone number renders LTR
- Mobile width (~375px): header call pill visible, nav collapses to hamburger, sections stack
- Services: sidebar sticks, articles flat, tel button per service
- Contact: FAQ accordion opens/closes, map iframe framed
- 404: call button first
- Keyboard: skip link moves focus to content; `Tab` shows focus rings

- [ ] **Step 4: Final commit (only if any fix was needed)**

If steps 2–3 surfaced fixes, apply them, re-run `npm run verify`, and commit:

```bash
git add -A ':!.DS_Store' ':!*/.DS_Store' ':!11ty-implementation-guide.md'
git commit -m "fix: visual refresh spot-check fixes"
```

If nothing needed fixing, skip this step.
