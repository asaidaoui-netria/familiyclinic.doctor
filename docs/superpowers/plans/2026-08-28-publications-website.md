# Publications Catalog and Embedded Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add localized `/publications/` catalogs and publication detail pages to the Eleventy site, with category filtering, an embedded six-to-eight-page PDF.js preview, and a complete-PDF **Read now** download.

**Architecture:** Eleventy combines curated localized copy with the verified `publication-assets.json` object-storage contract, then flattens thirteen conceptual publications into 39 localized detail-page records. Shared Nunjucks templates generate catalogs and details, while small progressive-enhancement modules implement filtering and a locally hosted PDF.js viewer. Existing route, localization, accessibility, SEO, and design tests expand to treat publications as first-class site pages.

**Tech Stack:** Eleventy 3.1.6, Nunjucks, Node.js 22+, Node test runner, browser ES modules, `pdfjs-dist` 6.2.108, HTML/CSS

**Spec:** `docs/superpowers/specs/2026-08-28-publications-library-storage-design.md`

**Dependency Plan:** Complete the publication asset pipeline first. This plan consumes its committed `src/_data/publication-assets.json` and pinned `pdfjs-dist` package.

## Global Constraints

- Use `/publications/`, `/fr/publications/`, and `/ar/publications/` for catalogs and the same stable ASCII slug under each locale for details.
- Render exactly thirteen conceptual titles and exactly 39 localized detail pages; never render *Cooking to Heal*.
- Display one localized card per title, not one card per language.
- Provide only the five approved filters: All, Nutrition, Health conditions, Pregnancy, and Environment; do not add search.
- Embed only each edition's six-to-eight-page preview PDF. Never preload, probe, or embed the complete PDF.
- Make **Read now** a direct complete-PDF download with the file type and size visible.
- Host PDF.js locally from the pinned package; do not use a script CDN.
- Support English, French, Arabic, RTL layout, keyboard controls, visible focus, mobile controls, and localized failure fallbacks.
- Do not add publication-specific Plausible events, a CMS, database, login, signed links, or cookbook content.
- Do not commit publication PDFs, Word files, cover derivatives, previews, or other document binaries.
- Preserve the site's Quiet Clinic rules: shared design tokens, no gradients, and no box shadows.
- Write each behavioral test first, observe the expected failure, implement the minimum behavior, rerun the focused test, then run the broader suite before committing.

## File Structure

- `src/_data/publication-content.js` — stable slugs, categories, author, and reviewed localized editorial copy.
- `src/_data/publications.js` — merges editorial copy with the Object Storage asset manifest and validates the complete contract.
- `src/_data/publicationPages.js` — flattens publications into Eleventy page records and reciprocal locale routes.
- `src/en/publications.njk`, `src/fr/publications.njk`, `src/ar/publications.njk` — locale-specific catalog entry points.
- `src/publication-detail.njk`, `src/publication-detail.11tydata.js` — one paginated detail template for all 39 editions.
- `src/_includes/publications/catalog.njk` — shared catalog markup.
- `src/_includes/publications/detail.njk` — shared detail and viewer markup.
- `assets/publications.css` — catalog, detail, viewer, responsive, RTL, and fullscreen styles.
- `assets/publication-catalog.js` — progressively enhanced category filtering.
- `assets/publication-viewer.js` — lazy PDF.js loading, rendering, controls, text layer, fullscreen, and fallback state.
- `eleventy.config.js` — copies publication assets and the pinned PDF.js runtime to `_site`.
- `src/_data/site.js`, `src/_includes/header.njk`, `src/_includes/layouts/base.njk`, `src/sitemap.njk` — navigation, dynamic locale routes, scripts, and indexation.
- `tests/publications-data.test.mjs` — publication content, assets, merge, validation, and route-record tests.
- `tests/publications-pages.test.mjs` — generated catalog/detail markup and behavior contracts.
- `tests/publication-viewer.test.mjs` — viewer state and controller unit tests.
- Existing route, SEO, trust, visual, and workflow tests — expanded for the new routes and assets.

---

### Task 1: Build the validated publication content model

**Files:**
- Create: `src/_data/publication-content.js`
- Create: `src/_data/publications.js`
- Create: `src/_data/publicationPages.js`
- Create: `tests/publications-data.test.mjs`

**Interfaces:**
- Consumes: the verified `src/_data/publication-assets.json` Object Storage manifest.
- Produces: `PUBLICATION_CONTENT: PublicationContent[]`.
- Produces: `buildPublications(content, assetManifest): Publication[]`.
- Produces default `publications: Publication[]` for Eleventy global data.
- Produces default `publicationPages: PublicationPage[]`.
- `PublicationPage` is `{ publication, edition, locale, permalink, outputPath, localizedRoutes }`.

- [ ] **Step 1: Write failing model and route tests**

Assert all of these contracts explicitly:

```js
assert.equal(publications.length, 13);
assert.deepEqual(publications.map(({ id }) => id), [
  "nature-to-factory", "hypotoxic-nutrition", "enzymes", "nutrition-key-health",
  "hypotoxic-diet-principles", "basedow-disease", "diabetes-hyperinsulinism",
  "liver-immunity", "hashimoto-disease", "chronic-inflammation",
  "rheumatoid-arthritis", "pregnancy", "invisible-environmental-threats"
]);
assert.equal(publicationPages.length, 39);
assert.equal(publicationPages.filter(({ locale }) => locale === "ar").length, 13);
assert.equal(publicationPages.some(({ publication }) => /cooking|cuisiner/i.test(publication.id)), false);
```

For every publication, assert the exact category union, author `Dr. Said-Alaoui Moulay Abdellah`, nonempty localized title/summary/description, matching asset ID, six-to-eight preview pages, positive sizes and dimensions, 64-character lowercase SHA-256 strings, HTTPS URLs under the fixed Hetzner bucket origin, and reciprocal routes for `en`, `fr`, and `ar`.

- [ ] **Step 2: Run the model test and verify failure**

Run: `node --test tests/publications-data.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `publication-content.js`.

- [ ] **Step 3: Curate the localized publication copy from the supplied editions**

For each of the thirteen records, read the localized cover and introduction from the ignored source archive and transcribe:

- The edition's displayed title exactly as published.
- A one-sentence summary of at most 180 characters.
- A two-to-four-sentence description based only on the publication's stated subjects.

Do not invent treatment outcomes, efficacy promises, diagnoses, or claims absent from the source. Keep the stable ID and category independent of translated wording. Declare this exact data contract before the reviewed array:

```js
/**
 * @typedef {{ title: string, summary: string, description: string }} LocalizedPublicationCopy
 * @typedef {{
 *   id: string,
 *   slug: string,
 *   category: "nutrition"|"conditions"|"pregnancy"|"environment",
 *   author: "Dr. Said-Alaoui Moulay Abdellah",
 *   editions: { en: LocalizedPublicationCopy, fr: LocalizedPublicationCopy, ar: LocalizedPublicationCopy }
 * }} PublicationContent
 */
```

Export all thirteen reviewed records in `PUBLICATION_CONTENT`, annotated with `@type {PublicationContent[]}`, in the same commit; every record must contain reviewed source-derived copy.

- [ ] **Step 4: Implement strict content/asset merging**

`buildPublications` must reject duplicate IDs/slugs, missing or extra locales, mismatched asset IDs, unsupported categories, empty content, summaries longer than 180 characters, invalid versions, URLs outside the fixed storage origin, preview counts outside six to eight, nonpositive sizes/dimensions, malformed hashes, and any cookbook identifier. Return deeply frozen records so templates cannot mutate global data.

- [ ] **Step 5: Flatten deterministic detail-page records**

Use these route functions:

```js
export function publicationRoute(locale, slug) {
  const prefix = locale === "en" ? "" : `/${locale}`;
  return `${prefix}/publications/${slug}/`;
}

export function publicationOutputPath(locale, slug) {
  const prefix = locale === "en" ? "" : `${locale}/`;
  return `${prefix}publications/${slug}/index.html`;
}
```

Each page's `localizedRoutes` maps all three locales to `publicationRoute(locale, slug)`.

- [ ] **Step 6: Run focused and full tests**

Run: `node --test tests/publications-data.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit the content model**

```bash
git add src/_data/publication-content.js src/_data/publications.js src/_data/publicationPages.js tests/publications-data.test.mjs
git commit -m "feat: add validated multilingual publication data"
```

---

### Task 2: Generate catalog and detail routes with correct localization

**Files:**
- Modify: `src/_data/site.js`
- Modify: `src/_includes/header.njk`
- Modify: `src/_includes/layouts/base.njk`
- Create: `src/en/publications.njk`
- Create: `src/fr/publications.njk`
- Create: `src/ar/publications.njk`
- Create: `src/publication-detail.njk`
- Create: `src/publication-detail.11tydata.js`
- Create: `src/_includes/publications/catalog.njk`
- Create: `src/_includes/publications/detail.njk`
- Modify: `tests/helpers/site.mjs`
- Modify: `tests/routes-localization.test.mjs`
- Create: `tests/publications-pages.test.mjs`

**Interfaces:**
- Consumes: `publications` and `publicationPages` from Task 1.
- Produces: three catalog output files and 39 detail output files.
- Produces: optional page data `localizedRoutes` understood by the shared head and language switcher.

- [ ] **Step 1: Expand the failing route contract**

In `tests/helpers/site.mjs`, add the three catalog outputs and generate the 39 known detail outputs from a hard-coded `PUBLICATION_SLUGS` array containing the thirteen approved slugs. The exact generated HTML inventory becomes 55 files: 13 existing files, three catalogs, and 39 details.

Add tests asserting:

- `/publications/`, `/fr/publications/`, and `/ar/publications/` navigation links.
- One `h1` and shared header/footer on every new page.
- Active Publications navigation on catalogs and details.
- Each detail language switcher stays on the same slug.
- Arabic pages use `lang="ar" dir="rtl"`.

- [ ] **Step 2: Run build plus route tests and verify failure**

Run: `npm run build && node --test tests/routes-localization.test.mjs tests/publications-pages.test.mjs`

Expected: FAIL because catalog and detail outputs do not exist and route inventory still contains only the existing pages.

- [ ] **Step 3: Add the Publications route and localized navigation labels**

Add to `site.routes`:

```js
publications: { en: "/publications/", fr: "/fr/publications/", ar: "/ar/publications/" }
```

Insert `{ key: "publications" }` between Services and Contact in `site.navigation`. Add exact navigation labels: English `Publications`, French `Publications`, Arabic `المنشورات`.

- [ ] **Step 4: Generalize canonical and language-switch routes**

In the base layout use page-specific routes when present:

```njk
{% set pageRoutes = localizedRoutes or site.routes[pageKey] %}
{% set currentRoute = pageRoutes[locale] %}
```

Use `pageRoutes` for canonical and alternate links. In `header.njk`, use the same fallback and render language links from `pageRoutes[language]`; retain `localizedUrl` for ordinary navigation destinations.

- [ ] **Step 5: Add browser-module support without changing existing scripts**

After the existing classic-script loop in `base.njk`, add:

```njk
{% for moduleScript in moduleScripts %}
<script type="module" src="/assets/{{ moduleScript }}"></script>
{% endfor %}
```

No page declares a module until the corresponding asset is added in a later task.

- [ ] **Step 6: Add minimal catalog entry points**

Each locale file uses clean directory output and the shared include. English front matter is:

```yaml
---
layout: layouts/base.njk
locale: en
pageKey: publications
permalink: /publications/index.html
activeNav: publications
indexable: true
stylesheets: [styles.css, localization.css]
title: "Health Publications - Family Clinic"
description: "Browse multilingual health publications by Dr. Said-Alaoui Moulay Abdellah."
---
{% include "publications/catalog.njk" %}
```

French and Arabic use their locale, localized metadata, and `/fr/publications/index.html` or `/ar/publications/index.html`.

- [ ] **Step 7: Generate the 39 detail routes**

Configure `publication-detail.11tydata.js` with pagination over `publicationPages`, size `1`, alias `publicationPage`, and computed `permalink`, `locale`, `title`, `description`, `localizedRoutes`, `activeNav: "publications"`, and existing shared page styles. Do not reference publication-specific CSS or JavaScript until those assets exist. `publication-detail.njk` contains only `{% include "publications/detail.njk" %}` under the shared layout.

- [ ] **Step 8: Add semantic baseline includes**

The catalog include must render a localized `h1` and thirteen ordinary detail links even before filtering is implemented. The detail include must render its localized `h1`, author, summary, and a direct complete-PDF **Read now** link even before the viewer is implemented. Use only approved publication records and manifest URLs.

- [ ] **Step 9: Run build, focused tests, and the full suite**

Run: `npm run build && node --test tests/routes-localization.test.mjs tests/publications-pages.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 10: Commit route generation**

```bash
git add src/_data/site.js src/_includes/header.njk src/_includes/layouts/base.njk src/en/publications.njk src/fr/publications.njk src/ar/publications.njk src/publication-detail.njk src/publication-detail.11tydata.js src/_includes/publications/catalog.njk src/_includes/publications/detail.njk tests/helpers/site.mjs tests/routes-localization.test.mjs tests/publications-pages.test.mjs
git commit -m "feat: generate localized publication routes"
```

---

### Task 3: Implement the localized catalog and progressive filters

**Files:**
- Modify: `src/_data/site.js`
- Modify: `src/_includes/publications/catalog.njk`
- Modify: `src/en/publications.njk`
- Modify: `src/fr/publications.njk`
- Modify: `src/ar/publications.njk`
- Create: `assets/publication-catalog.js`
- Modify: `package.json`
- Modify: `tests/publications-pages.test.mjs`

**Interfaces:**
- Consumes: `publications`, current `locale`, and `site.locales[locale].publications`.
- Produces: `matchesPublicationCategory(category, selected): boolean`.
- Produces: `enhancePublicationCatalog(root): void`.

- [ ] **Step 1: Write failing catalog markup and filter tests**

For every catalog output assert:

- Exactly thirteen `<article class="publication-card">` elements.
- Each card has one localized cover with width/height, title, category, summary, page count, and detail link.
- A filter group is present with `hidden` before enhancement and exactly five buttons.
- Every card has one approved `data-publication-category`.
- No search input exists.

Unit-test `matchesPublicationCategory`: `all` matches every approved category; each category matches only itself; unsupported filters return `false`.

- [ ] **Step 2: Run tests and verify failure**

Run: `npm run build && node --test tests/publications-pages.test.mjs`

Expected: FAIL because final card/filter markup and the catalog module are absent.

- [ ] **Step 3: Add exact localized catalog interface copy**

Add the following meaning-equivalent copy under `site.locales.<locale>.publications`:

```js
// English
{
  eyebrow: "PUBLICATIONS",
  catalogTitle: "Health publications",
  catalogIntro: "Explore practical health guides in English, French, and Arabic.",
  filtersLabel: "Filter publications by topic",
  filters: { all: "All", nutrition: "Nutrition", conditions: "Health conditions", pregnancy: "Pregnancy", environment: "Environment" },
  pageCount: "pages",
  viewPublication: "Preview publication"
}
// French
{
  eyebrow: "PUBLICATIONS",
  catalogTitle: "Publications santé",
  catalogIntro: "Découvrez des guides pratiques de santé en français, en anglais et en arabe.",
  filtersLabel: "Filtrer les publications par thème",
  filters: { all: "Toutes", nutrition: "Nutrition", conditions: "Problèmes de santé", pregnancy: "Grossesse", environment: "Environnement" },
  pageCount: "pages",
  viewPublication: "Aperçu de la publication"
}
// Arabic
{
  eyebrow: "المنشورات",
  catalogTitle: "منشورات صحية",
  catalogIntro: "اكتشفوا أدلة صحية عملية بالعربية والفرنسية والإنجليزية.",
  filtersLabel: "تصفية المنشورات حسب الموضوع",
  filters: { all: "الكل", nutrition: "التغذية", conditions: "الحالات الصحية", pregnancy: "الحمل", environment: "البيئة" },
  pageCount: "صفحة",
  viewPublication: "معاينة المنشور"
}
```

- [ ] **Step 4: Render the final catalog cards**

Use semantic buttons for filters, `aria-pressed="true"` only on All initially, lazy-loaded cover images with manifest dimensions, and a card link whose accessible name includes the localized title. Keep the filter group `hidden` in source markup so no-JavaScript visitors see all cards without dead controls.

- [ ] **Step 5: Implement progressive filtering**

On module initialization, find `[data-publication-catalog]`, unhide the filter group, and register one click handler. A selection updates `aria-pressed`, sets each nonmatching card's `hidden` property, and never changes the URL or destroys card DOM. Export the pure matcher and enhancer for Node tests; guard browser initialization with `if (typeof document !== "undefined")`.

- [ ] **Step 6: Publish and syntax-check the new module**

Add `moduleScripts: [publication-catalog.js]` to all three catalog front matters. The existing `assets/*.js` passthrough publishes the module. Extend `check:scripts` with `node --check assets/publication-catalog.js`.

- [ ] **Step 7: Run focused and full verification**

Run: `npm run build && node --test tests/publications-pages.test.mjs`

Expected: PASS.

Run: `npm run verify`

Expected: build, script checks, and all tests PASS.

- [ ] **Step 8: Commit the catalog**

```bash
git add src/_data/site.js src/_includes/publications/catalog.njk src/en/publications.njk src/fr/publications.njk src/ar/publications.njk assets/publication-catalog.js package.json tests/publications-pages.test.mjs
git commit -m "feat: add filterable publication catalog"
```

---

### Task 4: Render the detail page and viewer fallback contract

**Files:**
- Modify: `src/_data/site.js`
- Modify: `src/_includes/publications/detail.njk`
- Modify: `tests/publications-pages.test.mjs`

**Interfaces:**
- Consumes: `publicationPage.edition.preview`, `.full`, `.cover`, and `.textLayer`.
- Produces: viewer root attributes `data-preview-url`, `data-preview-pages`, `data-text-layer`, and localized labels.

- [ ] **Step 1: Write failing detail markup tests**

For every detail output assert:

- Title, author, category, localized summary/description, page count, and complete PDF size are visible.
- Viewer root contains only the preview URL in `data-preview-url`.
- Complete URL appears only in the **Read now** anchor, with `download` and localized accessible text.
- There is no iframe, `<embed>`, `<object>`, preload link, or script containing the complete URL.
- Toolbar buttons expose localized accessible names and correct initial disabled state.
- A loading status, hidden failure message, direct preview fallback, and `<noscript>` fallback exist.
- The educational-use disclaimer is present.

- [ ] **Step 2: Run build plus detail tests and verify failure**

Run: `npm run build && node --test tests/publications-pages.test.mjs`

Expected: FAIL because the viewer and fallback contract is not rendered.

- [ ] **Step 3: Add exact localized detail and viewer labels**

Extend each locale's `publications` object with meaning-equivalent labels for `by`, `preview`, `loadingPreview`, `previousPage`, `nextPage`, `page`, `of`, `zoomOut`, `zoomIn`, `fullscreen`, `openPreview`, `previewUnavailable`, `readNow`, `pdfFormat`, `downloadSize`, and `educationalDisclaimer`.

Use these disclaimer translations:

```text
EN: This publication is for educational information only and does not replace advice from a qualified healthcare professional.
FR: Cette publication est fournie à titre informatif et éducatif et ne remplace pas l’avis d’un professionnel de santé qualifié.
AR: هذا المنشور مخصص للمعلومات والتثقيف فقط ولا يغني عن استشارة مهني صحي مؤهل.
```

- [ ] **Step 4: Render complete semantic viewer markup**

The root is a labelled `<section class="publication-viewer" data-publication-viewer ...>`. Render a real `<canvas>`, a sibling `.textLayer`, localized status with `role="status"`, toolbar buttons, and an error block with `role="alert"`. Put the direct preview link inside both the hidden error block and `<noscript>`. Render **Read now** outside the viewer so it remains available when the viewer fails.

- [ ] **Step 5: Run focused and full tests**

Run: `npm run build && node --test tests/publications-pages.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 6: Commit the detail contract**

```bash
git add src/_data/site.js src/_includes/publications/detail.njk tests/publications-pages.test.mjs
git commit -m "feat: add publication detail and preview fallback"
```

---

### Task 5: Implement the lazy embedded PDF.js viewer

**Files:**
- Modify: `eleventy.config.js`
- Create: `assets/publication-viewer.js`
- Create: `tests/publication-viewer.test.mjs`
- Modify: `package.json`
- Modify: `src/publication-detail.11tydata.js`
- Modify: `tests/publications-pages.test.mjs`

**Interfaces:**
- Produces: `clampPage(page, pageCount): number`.
- Produces: `clampScale(scale): number` constrained to `0.5..3`.
- Produces: `createViewerController({ root, pdfjs, observe }): ViewerController`.
- Produces: `mountPublicationViewer(root, pdfjs): ViewerController`.
- `ViewerController` exposes `load()`, `previous()`, `next()`, `zoomIn()`, `zoomOut()`, `toggleFullscreen()`, and `destroy()`.

- [ ] **Step 1: Write failing pure-state and controller tests**

Test page clamping at both bounds, scale increments of `0.25`, disabled previous/next states, stale render cancellation, load-once behavior after repeated intersection callbacks, localized error transition after a rejected `getDocument`, conditional text-layer rendering, and `destroy()` cancelling a render and PDF loading task.

Use injected fakes for PDF.js, the observer, canvas context, fullscreen methods, and root element queries; do not make network requests in unit tests.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/publication-viewer.test.mjs`

Expected: FAIL because `assets/publication-viewer.js` does not exist.

- [ ] **Step 3: Publish only the pinned PDF.js runtime files**

Add exact passthrough mappings:

```js
eleventyConfig.addPassthroughCopy({
  "node_modules/pdfjs-dist/build/pdf.min.mjs": "assets/vendor/pdfjs/pdf.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs": "assets/vendor/pdfjs/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/web/pdf_viewer.css": "assets/vendor/pdfjs/pdf_viewer.css"
});
```

Do not copy examples, test PDFs, source maps, or the complete package.

- [ ] **Step 4: Implement lazy loading and viewer state**

Keep the module importable by Node unit tests by loading PDF.js only inside the browser bootstrap:

```js
export const loadPdfjs = () => import("/assets/vendor/pdfjs/pdf.min.mjs");

if (typeof document !== "undefined") {
  const pdfjs = await loadPdfjs();
  pdfjs.GlobalWorkerOptions.workerSrc = "/assets/vendor/pdfjs/pdf.worker.min.mjs";
  for (const root of document.querySelectorAll("[data-publication-viewer]")) {
    mountPublicationViewer(root, pdfjs);
  }
}
```

Observe the viewer with `rootMargin: "200px"`, unobserve before loading, and call `pdfjs.getDocument({ url: previewUrl })`. Validate that PDF.js reports the same preview page count rendered in the HTML data. Never read the complete-download anchor or URL from the viewer module.

- [ ] **Step 5: Render one responsive page at a time**

For the active page, calculate a fit-to-container scale capped by the user's `0.5..3` zoom, multiply canvas backing dimensions by `devicePixelRatio`, and keep CSS dimensions in logical pixels. Cancel an unfinished render before starting another. Update page counter, toolbar disabled states, and loading status only after a successful render.

- [ ] **Step 6: Add the conditional text layer**

When `data-text-layer="true"`, clear the text-layer container and render:

```js
const textLayer = new pdfjs.TextLayer({
  textContentSource: await page.getTextContent(),
  container: textLayerElement,
  viewport
});
await textLayer.render();
```

When the flag is false, keep the layer empty and `aria-hidden="true"`. A text-layer failure must remove the layer and preserve the successfully rendered canvas rather than failing the whole viewer.

- [ ] **Step 7: Implement controls, fullscreen, and failure cleanup**

Previous/next clamp at document bounds. Zoom changes by `0.25` and rerenders. Fullscreen calls `requestFullscreen()` on the viewer and `document.exitFullscreen()` when active. On load/render failure, hide the canvas/toolbar, reveal the localized error fallback, and keep **Read now** untouched. `destroy()` disconnects observers, cancels tasks, destroys the PDF document, and removes listeners.

- [ ] **Step 8: Publish and syntax-check the viewer module**

Add `moduleScripts: ["publication-viewer.js"]` to detail-page computed data. The existing `assets/*.js` passthrough publishes the module. Extend `check:scripts` with `node --check assets/publication-viewer.js`.

- [ ] **Step 9: Run focused and full verification**

Run: `node --test tests/publication-viewer.test.mjs`

Expected: PASS.

Run: `npm run verify`

Expected: PDF.js runtime files exist in `_site`, generated pages reference only local viewer scripts, and all tests PASS.

- [ ] **Step 10: Pass the three-language viewer pilot gate**

Run `npm run serve` and open the `enzymes` detail page at `/publications/enzymes/`, `/fr/publications/enzymes/`, and `/ar/publications/enzymes/`. In each locale, confirm the preview loads from Object Storage, page count matches the manifest, previous/next and zoom work, Arabic renders in RTL, the failure fallback can be revealed by blocking the preview request, and no complete PDF request appears in the network log before selecting **Read now**. Do not proceed to catalog styling or release integration until all three pilot editions pass.

- [ ] **Step 11: Commit the viewer**

```bash
git add eleventy.config.js assets/publication-viewer.js tests/publication-viewer.test.mjs package.json src/publication-detail.11tydata.js tests/publications-pages.test.mjs
git commit -m "feat: embed lazy PDF publication previews"
```

---

### Task 6: Apply Quiet Clinic styling, responsiveness, and accessibility

**Files:**
- Create: `assets/publications.css`
- Modify: `src/en/publications.njk`
- Modify: `src/fr/publications.njk`
- Modify: `src/ar/publications.njk`
- Modify: `src/publication-detail.11tydata.js`
- Modify: `tests/design-trust.test.mjs`
- Modify: `tests/visual-refresh.test.mjs`
- Modify: `tests/publications-pages.test.mjs`

**Interfaces:**
- Consumes: catalog/detail/viewer class names from Tasks 3–5.
- Produces: responsive layouts at the existing `768px` mobile breakpoint and PDF.js text-layer styling.

- [ ] **Step 1: Write failing style and accessibility tests**

Assert `publications.css`:

- Uses existing `var(--accent|ink|hairline|surface|surface-soft|radius-card)` tokens.
- Contains no `box-shadow`, `linear-gradient`, or `radial-gradient`.
- Styles `:focus-visible`, `[hidden]`, RTL toolbar flow, viewer loading/error states, `.textLayer`, and `:fullscreen`.
- Defines a responsive catalog grid and a single-column mobile layout at `max-width: 768px`.
- Keeps viewer buttons at least `44px` in both dimensions.

Assert generated covers declare positive intrinsic dimensions, toolbar buttons have accessible names, status/error roles are present, and Arabic filter/toolbar order remains usable.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm run build && node --test tests/design-trust.test.mjs tests/visual-refresh.test.mjs tests/publications-pages.test.mjs`

Expected: FAIL because `publications.css` is absent.

- [ ] **Step 3: Implement catalog and detail styling**

Add `publications.css` to each catalog's `stylesheets` and to detail-page computed styles. Use a restrained responsive grid, hairline borders, existing typography, and the clinic's surface/accent tokens. Cards must remain readable without hover. Do not introduce decorative stock imagery, animation, gradients, or shadows. Keep the preview as the primary visual element on detail pages and **Read now** directly after it.

- [ ] **Step 4: Implement viewer and text-layer styling**

Make the canvas and text layer occupy the same positioned page surface. Import or link `/assets/vendor/pdfjs/pdf_viewer.css` only on detail pages, then scope clinic overrides beneath `.publication-viewer`. Respect `prefers-reduced-motion`; no viewer control requires motion to communicate state.

- [ ] **Step 5: Implement mobile, RTL, and fullscreen behavior**

At `768px`, stack metadata and preview, allow toolbar wrapping, keep buttons at least `44px`, and constrain the canvas to the viewport. For RTL, reverse only directional toolbar grouping while keeping page numbers and zoom values legible. Fullscreen uses the surface background and preserves access to all controls.

- [ ] **Step 6: Run focused tests and full verification**

Run: `npm run build && node --test tests/design-trust.test.mjs tests/visual-refresh.test.mjs tests/publications-pages.test.mjs`

Expected: PASS.

Run: `npm run verify`

Expected: all checks PASS.

- [ ] **Step 7: Commit presentation and accessibility**

```bash
git add assets/publications.css src/en/publications.njk src/fr/publications.njk src/ar/publications.njk src/publication-detail.11tydata.js tests/design-trust.test.mjs tests/visual-refresh.test.mjs tests/publications-pages.test.mjs
git commit -m "feat: style accessible publication experiences"
```

---

### Task 7: Complete SEO, sitemap, regression, and live delivery verification

**Files:**
- Modify: `src/sitemap.njk`
- Modify: `tests/seo-integrity.test.mjs`
- Modify: `tests/routes-localization.test.mjs`
- Modify: `tests/publications-pages.test.mjs`
- Modify: `tests/blog-removal.test.mjs`
- Modify: `tests/helpers/site.mjs`

**Interfaces:**
- Consumes: all generated publication routes and the Object Storage manifest.
- Produces: sitemap containing 54 indexable routes and a complete offline verification gate.

- [ ] **Step 1: Write failing SEO and regression tests**

Assert:

- Exactly 54 sitemap locations: twelve existing indexable pages, three catalogs, and 39 details.
- Each catalog/detail has one canonical URL under `https://www.familyclinic.doctor`.
- Each publication page has reciprocal `en`, `fr`, `ar`, and English `x-default` alternates for the same slug.
- All 55 HTML outputs retain one header/main/footer and exactly one `h1`.
- No cookbook/blog URL or title appears in output, sitemap, navigation, or metadata.
- No publication JavaScript contains `plausible(` or dispatches analytics events.
- No generated markup preloads a complete PDF.
- Every local publication script/style/PDF.js reference resolves in `_site`.

- [ ] **Step 2: Run build plus SEO tests and verify failure**

Run: `npm run build && node --test tests/seo-integrity.test.mjs tests/routes-localization.test.mjs tests/publications-pages.test.mjs tests/blog-removal.test.mjs`

Expected: FAIL because the sitemap and older exact-route assertions do not yet include publications.

- [ ] **Step 3: Add publication catalogs and details to the sitemap**

Retain the existing four static page keys, add the three `site.routes.publications` values once, then iterate `publicationPages` and emit each `permalink`. Do not place Object Storage URLs, the 404 page, or duplicate routes in the sitemap.

- [ ] **Step 4: Update existing regression inventories**

Replace hard-coded claims of twelve indexable routes with the expanded explicit contract. Keep the slugs hard-coded in tests so deleting a production data record cannot silently reduce expected coverage. Add `publications.css` to the no-gradient/no-shadow and shared-token stylesheet lists.

- [ ] **Step 5: Run complete offline verification**

Run: `npm run verify`

Expected: Eleventy build succeeds, all classic/module scripts parse, and every Node test passes.

- [ ] **Step 6: Run live Object Storage verification**

Run: `npm run publications:verify`

Expected: all 117 assets and PDF range requests PASS without writes.

- [ ] **Step 7: Perform the approved manual browser matrix**

Run: `npm run serve`

Check one nutrition title, one health-condition title, Pregnancy, and Invisible Environmental Threats in English, French, and Arabic on desktop and mobile widths. For each check category filtering, same-title language switching, lazy preview loading, previous/next, zoom, fullscreen, keyboard focus, RTL layout, forced viewer failure fallback, and the complete **Read now** download. Confirm no complete PDF request occurs before activating **Read now** in browser network tools.

- [ ] **Step 8: Verify the repository boundary and diff**

Run:

```bash
git diff --check
git status --short
git ls-files | rg '(^FC web site files|^\.publication-work/|\.(pdf|doc|docx)$)'
```

Expected: no whitespace errors; only intended code/data changes plus known unrelated user files; no publication binary tracked.

- [ ] **Step 9: Commit final integration**

```bash
git add src/sitemap.njk tests/seo-integrity.test.mjs tests/routes-localization.test.mjs tests/publications-pages.test.mjs tests/blog-removal.test.mjs tests/helpers/site.mjs
git commit -m "test: verify publications library integration"
```
