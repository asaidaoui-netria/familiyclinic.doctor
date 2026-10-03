# Publications HTML implementation plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task by task. The user requested implementation of the completed design; proceed inline without another approval round.

**Goal:** Replace publication PDF readers with the approved category library and HTML article/book/recipe pages.

**Architecture:** Keep Eleventy. Check in normalized source content and optimized images; build publication routes from explicit category and edition records. Draft editions never create public thin pages or language alternates. Keep legacy URLs and preserve authentic localized content when available.

**Tech Stack:** Eleventy 3, Nunjucks, vanilla CSS/JavaScript, Node tests, Python standard-library Word importer, existing PDF.js for offline extraction only.

**Spec:** `docs/design/publications-2026-10-03/design.md`

## Global constraints

- English first; 56 source articles in A16/B9/C25/D6 and a separate book branch.
- No PDF viewer, search requirement, keyword taxonomy or runtime content fetch.
- Preserve 13 English legacy URLs and account for their French/Arabic counterparts.
- Publish genuine available editions only; no invented translations, review dates or credentials.
- Keep raw private downloads out of the public build and avoid runtime PDF dependencies.
- No deployment, push or changes to unrelated clinic pages.

## Review focus

- Absent English translations: draft bodies must not produce thin public URLs or false counts.
- Partial translation availability: no blank switcher URLs or reciprocal links to transition pages.
- Word structures and PDF extraction: preserve tables, lists, source attribution and readable paragraph order.
- Legacy links: all 39 detail routes must resolve with documented locale/content behavior.
- Largest category and long titles: keyboard navigation and 320px layout remain usable.

### Task 1: Source content and publication model

**Files:** `content/publications/`, `scripts/publications/import-content.py`, `scripts/publications/import-legacy.mjs`, `src/_data/publications.js`, `src/_data/publicationPages.js`, `src/_data/publicationLibrary.js`, `src/lib/publications.js`, `tests/publications-data.test.mjs`.

**Interfaces:** `buildLibrary(records)` validates and returns records, published editions and category memberships; `buildPages(library)` returns route data. Content records keep `id`, `categoryId`, `slug`, `source`, `image`, `editions`; editions have language, status, title, summary, blocks and optional verified dates. Block renderer returns HTML and unique heading anchors.

- [x] Add failing tests for 56 complete source records, categories, duplicate routes, draft exclusion, partial locales, escaped source text and preserved tables.
- [x] Import French bodies, teasers and images with source hashes. Preserve explicit filename exceptions.
- [x] Translate all 56 complete articles into English, as explicitly requested by the user. Import French original bodies and use explicit noindex transition pages for unreadable Arabic originals.
- [x] Generate optimized publication images using existing image tooling, with retained aspect ratios and dimensions.
- [x] Run data/import tests to green.

### Task 2: Static library and reading pages

**Files:** publication templates/data files, `assets/publications.css`, `assets/publication-reader.js`, localized index templates, book/recipe templates, `tests/publications-pages.test.mjs`.

**Interfaces:** Consume Task 1 pages; render index, category, article, book, recipe or transition template by `kind`.

- [x] Add failing built-page tests for category navigation, full article text, contents anchors, related links, book and recipes without viewers.
- [x] Implement responsive directory, category lists, readable articles, mobile navigation, contents, source notes, book and recipe layouts.
- [x] Support semantic no-JS navigation; add only progressive contents highlighting and print behavior.
- [x] Remove old browser PDF viewer/catalog filter scripts and their obsolete tests.
- [x] Build and run page tests.

### Task 3: SEO and legacy integration

**Files:** base/header/structured-data templates, sitemap, Eleventy config, package scripts, `tests/helpers/site.mjs`, route/SEO/visual tests, migration documentation.

**Interfaces:** Page records supply canonical URL, actual locale counterparts, indexability and appropriate structured data.

- [x] Add failing tests for partial hreflang, true sitemap membership, Article/Breadcrumb JSON-LD, and absence of PDF runtime assets.
- [x] Update shared metadata safely without changing non-publication behavior.
- [x] Preserve all legacy routes and document source/migration choices.
- [x] Retain offline PDF storage tools where useful while disconnecting them from the site runtime.
- [x] Run `npm run verify` and fix failures against the new user-visible contracts.

### Task 4: Browser verification and review

- [x] Inspect index, largest populated category, long article, French/table article, book and recipe on desktop/mobile; check a 320px viewport and no-JS rendering.
- [x] Review diff and run a fresh independent code review, then address material findings.
- [x] Run final `npm run verify`, inspect changes, and report content readiness separately from implementation completeness.

## Execution ledger

Ruling: work on a dedicated branch in the current workspace, keeping the user's downloaded sources and design artifacts accessible; no deployment or commit requested.
Ruling: obsolete PDF-viewer tests will be replaced by HTML content/navigation contracts; offline PDF pipeline tests remain.

Ruling: user requested complete English translation in this task. Three translation agents own disjoint article ID groups and work in complete-file batches; build and validate all 56 before completion.
Progress: all 56 French bodies imported; 57 illustrations optimized to 240/640px WebP. All directory/category/article/book/recipe/Arabic transition templates build. Body/TOC/metadata tests pass for current editions. Full English collection check intentionally remains open until translation finishes.
Ruling: keep both true French source editions and English translations; Arabic legacy URLs resolve to noindex language-choice pages, excluded from hreflang and sitemap. No clinical review dates invented.

User steering: remove the directory guidance block, category reading-order count line, sidebar explanation, and Sources and review panels. Apply this to the implemented page templates and the original preview. Retain author attribution, language navigation and provenance in the data.

Progress: all 56 full English translations are complete, with source hashes and paragraph/list/table parity checked. Recovered original nesting levels in both locales and C04's explanatory figure. Added the complete English book preface and curated related links, including C07/C08/C09 and C15→B. Removed the guidance/count/source panels requested by the user. Final build/test/browser/re-review in progress.
Ruling: preserve the author's source claims faithfully and record medical/editorial ambiguities in the audit; no clinical review has been performed. Implementation is local and no deployment is part of this task.

Completed: npm run verify passes 98 tests; git diff --check is clean. All 157 publication routes return 200, have one H1, and show no horizontal overflow or JavaScript errors at 320px. Native section links and no-JavaScript reading/navigation checked. Independent final review and scoped re-review passed after four fixes (body figure, nested lists, book preface, curated links). No commit, push or deployment performed.
