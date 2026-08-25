# Eleventy Site Without Blog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-maintained Family Clinic HTML with an Eleventy-generated multilingual site, remove all blog pages and blog-only assets, and deploy validated `_site/` artifacts through GitHub Pages.

**Architecture:** Eleventy reads locale-specific page bodies from `src/{en,fr,ar}` and wraps them in one shared Nunjucks layout backed by centralized clinic and localization data. The build preserves the thirteen retained `.html` routes, generates SEO/support files, publishes only retained assets, and is validated before GitHub Pages deployment.

**Tech Stack:** Node.js 22+, Eleventy 3.1.6, Nunjucks, Node built-in test runner, GitHub Actions, GitHub Pages artifact deployment.

**Spec:** `docs/superpowers/specs/2026-08-25-eleventy-site-without-blog-design.md`

## Global Constraints

- Preserve `/index.html`, `/about.html`, `/services.html`, `/contact.html`, `/404.html`, and the equivalent retained `/fr/` and `/ar/` routes exactly.
- Generate thirteen retained HTML routes: five English, four French, and four Arabic.
- Remove all blog catalogs, articles, article templates, Blog navigation, blog-only CSS/JavaScript, and optimized blog images.
- Keep the existing design, page-specific content, Plausible analytics, retained CSS/JavaScript behavior, custom domain, and Arabic RTL presentation.
- Do not delete `assets/images/original` during this migration, but never copy it to `_site/`.
- Do not stage or commit the user-owned `.DS_Store` modifications or untracked `11ty-implementation-guide.md`.
- Keep `_site/`, `node_modules/`, and `.cache/` out of version control.
- Write each behavioral test first and observe the expected failure before production implementation.
- Use `npm ci` in CI and native GitHub Pages artifact deployment.

## File Responsibility Map

- `package.json`, `package-lock.json`: pinned toolchain and `serve`, `build`, `test`, `verify` commands.
- `eleventy.config.js`: Eleventy directories, clean-build hook, i18n/filter configuration, and an explicit retained-asset allowlist.
- `.gitignore`: generated output, dependency, cache, and macOS metadata exclusions.
- `src/_data/site.js`: canonical domain, locale labels, route map, clinic contact data, hours, navigation, services, and footer copy.
- `src/_includes/layouts/base.njk`: one HTML shell, localized document attributes, shared head, analytics, assets, and page content slot.
- `src/_includes/header.njk`: localized retained-page navigation and same-page language switcher without Blog.
- `src/_includes/footer.njk`: localized quick links, service links, contact data, and build-time current year without Blog.
- `src/_includes/structured-data.njk`: consistent LocalBusiness JSON-LD from global data.
- `src/{en,fr,ar}/*.njk`: front matter plus page-specific `<main>` body content mechanically extracted from the current retained HTML.
- `src/sitemap.njk`, `src/robots.njk`: generated discovery files containing only indexable retained routes.
- `scripts/extract-retained-pages.mjs`: temporary deterministic migration utility; deleted after retained content is extracted.
- `tests/helpers/site.mjs`: generated-output paths, expected route inventory, and reusable file readers.
- `tests/foundation.test.mjs`: clean build, English homepage, shared chrome, and custom-domain contract.
- `tests/routes-localization.test.mjs`: thirteen routes, localized navigation, language counterparts, and Arabic RTL behavior.
- `tests/seo-integrity.test.mjs`: canonical/alternate metadata, sitemap, robots, and generated local-reference validation.
- `tests/blog-removal.test.mjs`: source/output absence of blog pages, Blog navigation, and blog-only assets.
- `tests/workflow.test.mjs`: GitHub Pages workflow triggers, build gate, artifact, deployment, and permissions.
- `.github/workflows/pages.yml`: pull-request validation and gated production deployment.

---

### Task 1: Test Harness and English Homepage Build

**Files:**
- Create: `package.json`
- Create: `package-lock.json`
- Create: `.gitignore`
- Create: `tests/helpers/site.mjs`
- Create: `tests/foundation.test.mjs`
- Create: `eleventy.config.js`
- Create: `src/_data/site.js`
- Create: `src/_includes/layouts/base.njk`
- Create: `src/_includes/header.njk`
- Create: `src/_includes/footer.njk`
- Create: `src/_includes/structured-data.njk`
- Create: `scripts/extract-retained-pages.mjs`
- Generate: `src/en/index.njk`

**Interfaces:**
- Produces: `site.localizedUrl(pageKey: string, locale: "en" | "fr" | "ar"): string` through the `localizedUrl` Nunjucks filter.
- Produces: `site.routes`, keyed by `home`, `about`, `services`, `contact`, and `notFound`.
- Produces: `_site/index.html` and `_site/CNAME` from `npm run build`.
- Consumes: current `index.html`, retained root assets, and `CNAME`.

- [ ] **Step 1: Add the package/test harness and failing foundation test**

Create `package.json` with exact scripts and dependency:

```json
{
  "name": "family-clinic-site",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "serve": "eleventy --serve",
    "build": "eleventy",
    "check:scripts": "node --check assets/script.js && node --check assets/localization.js && node --check assets/services.js && node --check assets/contact.js",
    "test": "node --test",
    "verify": "npm run build && npm run check:scripts && npm test"
  },
  "devDependencies": {
    "@11ty/eleventy": "3.1.6"
  }
}
```

Create `tests/helpers/site.mjs` with `OUTPUT_ROOT`, `outputPath(relativePath)`, `readOutput(relativePath)`, and the exact `EXPECTED_HTML_ROUTES` array:

```js
[
  "index.html", "about.html", "services.html", "contact.html", "404.html",
  "fr/index.html", "fr/about.html", "fr/services.html", "fr/contact.html",
  "ar/index.html", "ar/about.html", "ar/services.html", "ar/contact.html"
]
```

Create `tests/foundation.test.mjs` using `node:test` and `node:assert/strict`. Assert that `_site/index.html` exists, contains exactly one `<header class="header">`, one `<main class="main">`, and one `<footer class="footer">`, contains no navigation link whose text is `Blog`, references `/assets/styles.css`, and that `_site/CNAME` equals `www.familyclinic.doctor` after trimming.

- [ ] **Step 2: Run the foundation test and verify RED**

Run:

```bash
npm install
npm test -- tests/foundation.test.mjs
```

Expected: FAIL because `_site/index.html` does not exist. Record that the assertion fails on generated output absence rather than test syntax.

- [ ] **Step 3: Add the minimal Eleventy foundation and shared data**

Create `.gitignore` with:

```gitignore
node_modules/
_site/
.cache/
.DS_Store
```

In `eleventy.config.js`:

- Import and register `I18nPlugin` from `@11ty/eleventy` with `defaultLanguage: "en"` and `errorMode: "strict"`.
- Remove `_site/` in the `eleventy.before` event using `fs.promises.rm("_site", { recursive: true, force: true })` so stale blog output cannot survive a build.
- Add a `localizedUrl` filter using this exact route map:

```js
const routes = {
  home: { en: "/index.html", fr: "/fr/index.html", ar: "/ar/index.html" },
  about: { en: "/about.html", fr: "/fr/about.html", ar: "/ar/about.html" },
  services: { en: "/services.html", fr: "/fr/services.html", ar: "/ar/services.html" },
  contact: { en: "/contact.html", fr: "/fr/contact.html", ar: "/ar/contact.html" },
  notFound: { en: "/404.html" }
};
```

- Throw a descriptive error for an unknown page key or unsupported page/locale pair.
- Add a `json` filter using `JSON.stringify`.
- Copy `CNAME`, `assets/*.css`, `assets/*.js`, `assets/favicon`, and only `assets/images/optimized/{clinic,logos,netria,services,team}`.
- Configure input `src`, output `_site`, includes `_includes`, and data `_data`.

Create `src/_data/site.js` exporting complete data for:

- `url: "https://www.familyclinic.doctor"`
- analytics domain `familyclinic.doctor`
- locale names `English`, `Français`, `العربية`
- localized clinic name, navigation labels, navigation ARIA label, language-switcher labels, footer headings/copy, contact labels, hours labels, and copyright wording
- the four retained navigation items only
- contact address, map URL, phone, and email
- the nine service anchors and localized labels currently shown in retained footers, correcting the Arabic weight-loss link to `#weight-loss`
- the route map above

Create one universal `header.njk` and `footer.njk`. All links must use the `localizedUrl` filter and root-relative output paths. Do not include a Blog item.

Create `base.njk` with localized `lang`, Arabic `dir="rtl"`, title, description, Plausible scripts, retained styles/scripts, favicons, header/footer includes, and exactly one main wrapper around `{{ content | safe }}`. Keep canonical/alternate/Open Graph generation for Task 3.

The retained CSS and JavaScript files must not be reformatted during extraction. `npm run check:scripts` syntax-checks every retained client script during local and CI verification.

Create `structured-data.njk` with a valid `LocalBusiness` JSON-LD object using the `json` filter and global clinic data.

- [ ] **Step 4: Extract the English homepage and build**

Create `scripts/extract-retained-pages.mjs` with a one-entry manifest for `index.html`. The script must:

1. Read the existing HTML as UTF-8.
2. Extract `<title>`, the multiline description meta content, and the inner markup of `<main class="main">`.
3. Fail if any extraction returns no match.
4. Write `src/en/index.njk` with front matter:

```yaml
layout: layouts/base.njk
locale: en
pageKey: home
permalink: /index.html
activeNav: home
indexable: true
stylesheets: [styles.css, localization.css]
scripts: [script.js, localization.js]
```

5. Use `JSON.stringify` for title and description front-matter values.
6. Write only the extracted inner main markup after front matter.

Run:

```bash
node scripts/extract-retained-pages.mjs
npm run build
npm test -- tests/foundation.test.mjs
```

Expected: build exits 0 and foundation test PASS.

- [ ] **Step 5: Commit the tested foundation**

```bash
git add package.json package-lock.json .gitignore eleventy.config.js scripts/extract-retained-pages.mjs src tests/foundation.test.mjs tests/helpers/site.mjs
git commit -m "feat: add Eleventy site foundation"
```

---

### Task 2: Retained Routes and Localization

**Files:**
- Create: `tests/routes-localization.test.mjs`
- Modify: `scripts/extract-retained-pages.mjs`
- Generate: `src/en/{about,services,contact,404}.njk`
- Generate: `src/fr/{index,about,services,contact}.njk`
- Generate: `src/ar/{index,about,services,contact}.njk`
- Modify: `src/_includes/layouts/base.njk`
- Modify: `src/_includes/header.njk`
- Modify: `src/_includes/footer.njk`

**Interfaces:**
- Consumes: `EXPECTED_HTML_ROUTES`, `localizedUrl`, shared site data, and current retained HTML.
- Produces: all thirteen retained generated routes and same-page locale links.

- [ ] **Step 1: Write failing route/localization tests**

Create `tests/routes-localization.test.mjs` that:

- loops through `EXPECTED_HTML_ROUTES` and asserts every generated file exists
- asserts the generated HTML file list is exactly the expected thirteen routes
- asserts every Arabic route contains `<html lang="ar" dir="rtl">`
- asserts French pages contain `lang="fr"` and do not contain `dir="rtl"`
- asserts each translatable page contains language-switcher links to the same `pageKey` in English, French, and Arabic
- asserts active retained navigation uses `aria-current="page"`
- asserts no generated header or footer contains a link to `/blog`, `blog/`, or the localized visible labels `Blog` or `المدونة`
- asserts each generated page contains exactly one header, main, and footer

- [ ] **Step 2: Run the route test and verify RED**

Run:

```bash
npm test -- tests/routes-localization.test.mjs
```

Expected: FAIL on the first missing route, `_site/about.html`.

- [ ] **Step 3: Extend the deterministic page manifest**

Extend `scripts/extract-retained-pages.mjs` with these entries and exact metadata:

```js
[
  ["index.html", "src/en/index.njk", "en", "home", "/index.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], true],
  ["about.html", "src/en/about.njk", "en", "about", "/about.html", ["styles.css", "about.css", "localization.css"], ["script.js", "localization.js"], true],
  ["services.html", "src/en/services.njk", "en", "services", "/services.html", ["styles.css", "services.css", "localization.css"], ["script.js", "localization.js", "services.js"], true],
  ["contact.html", "src/en/contact.njk", "en", "contact", "/contact.html", ["styles.css", "contact.css", "localization.css"], ["script.js", "localization.js", "contact.js"], true],
  ["404.html", "src/en/404.njk", "en", "notFound", "/404.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], false],
  ["fr/index.html", "src/fr/index.njk", "fr", "home", "/fr/index.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], true],
  ["fr/about.html", "src/fr/about.njk", "fr", "about", "/fr/about.html", ["styles.css", "about.css", "localization.css"], ["script.js", "localization.js"], true],
  ["fr/services.html", "src/fr/services.njk", "fr", "services", "/fr/services.html", ["styles.css", "services.css", "localization.css"], ["script.js", "localization.js", "services.js"], true],
  ["fr/contact.html", "src/fr/contact.njk", "fr", "contact", "/fr/contact.html", ["styles.css", "contact.css", "localization.css"], ["script.js", "localization.js", "contact.js"], true],
  ["ar/index.html", "src/ar/index.njk", "ar", "home", "/ar/index.html", ["styles.css", "localization.css"], ["script.js", "localization.js"], true],
  ["ar/about.html", "src/ar/about.njk", "ar", "about", "/ar/about.html", ["styles.css", "about.css", "localization.css"], ["script.js", "localization.js"], true],
  ["ar/services.html", "src/ar/services.njk", "ar", "services", "/ar/services.html", ["styles.css", "services.css", "localization.css"], ["script.js", "services.js", "localization.js"], true],
  ["ar/contact.html", "src/ar/contact.njk", "ar", "contact", "/ar/contact.html", ["styles.css", "contact.css", "localization.css"], ["script.js", "contact.js", "localization.js"], true]
]
```

Set `activeNav` to an empty value for `notFound`. Preserve each page's extracted main body without its old header/footer/head/scripts.

- [ ] **Step 4: Generate, build, and verify GREEN**

Run:

```bash
node scripts/extract-retained-pages.mjs
npm run build
npm test -- tests/routes-localization.test.mjs
npm test
```

Expected: all route/localization and foundation tests PASS.

- [ ] **Step 5: Commit retained localized routes**

```bash
git add scripts/extract-retained-pages.mjs src/en src/fr src/ar src/_includes tests/routes-localization.test.mjs
git commit -m "feat: generate retained multilingual pages"
```

---

### Task 3: SEO, Sitemap, Robots, and Link Integrity

**Files:**
- Create: `tests/seo-integrity.test.mjs`
- Modify: `src/_includes/layouts/base.njk`
- Modify: `src/_includes/structured-data.njk`
- Create: `src/sitemap.njk`
- Create: `src/robots.njk`

**Interfaces:**
- Consumes: `site.url`, `site.routes`, page `locale`, `pageKey`, `indexable`, and generated output.
- Produces: canonical/alternate/Open Graph metadata, valid LocalBusiness JSON-LD, `/sitemap.xml`, and `/robots.txt`.

- [ ] **Step 1: Write failing metadata and integrity tests**

Create `tests/seo-integrity.test.mjs` that asserts:

- every indexable route contains exactly one canonical URL equal to `site.url + route`
- every translatable route contains English, French, Arabic, and `x-default` alternates pointing to its same-page routes
- every indexable route has `og:title`, `og:description`, `og:url`, and `og:type=website`
- every HTML page contains parseable `application/ld+json` with `@context`, `@type: "LocalBusiness"`, clinic name, URL, phone, and postal address
- the 404 page has `robots` content `noindex, follow` and is absent from the sitemap
- `sitemap.xml` contains the twelve indexable routes, no blog URL, and the canonical `www` domain
- `robots.txt` allows crawling and points to `https://www.familyclinic.doctor/sitemap.xml`
- every local `href`, `src`, and `srcset` candidate resolves inside `_site`; ignore fragments, `mailto:`, `tel:`, `data:`, and HTTP(S) URLs

- [ ] **Step 2: Run metadata tests and verify RED**

Run:

```bash
npm test -- tests/seo-integrity.test.mjs
```

Expected: FAIL because canonical metadata and `sitemap.xml` do not exist.

- [ ] **Step 3: Implement shared metadata and generated support files**

Update `base.njk` to:

- render `site.url + page.url` as canonical
- loop `site.locales` and `site.routes[pageKey]` to render reciprocal alternates when the locale route exists
- use English as `x-default`
- render Open Graph title, description, URL, type, site name, and locale
- render `noindex, follow` when `indexable` is false
- include `structured-data.njk`

Create `sitemap.njk` with `permalink: /sitemap.xml`, no layout, and XML generated from the twelve explicit indexable route values in `site.routes`. Create `robots.njk` with `permalink: /robots.txt`, no layout, `User-agent: *`, `Allow: /`, and the canonical sitemap URL.

- [ ] **Step 4: Build and verify metadata/integrity GREEN**

Run:

```bash
npm run build
npm test -- tests/seo-integrity.test.mjs
npm test
```

Expected: all tests PASS with no broken generated local references.

- [ ] **Step 5: Commit SEO and integrity generation**

```bash
git add src/_includes src/sitemap.njk src/robots.njk tests/seo-integrity.test.mjs
git commit -m "feat: generate site metadata and discovery files"
```

---

### Task 4: Remove Legacy HTML and Blog Sources

**Files:**
- Create: `tests/blog-removal.test.mjs`
- Delete: `index.html`, `about.html`, `services.html`, `contact.html`, `404.html`
- Delete: `fr/{index,about,services,contact}.html`
- Delete: `ar/{index,about,services,contact}.html`
- Delete: `blog/`, `fr/blog/`, `ar/blog/`
- Delete: `assets/blog.css`
- Delete: `assets/blog-article.css`
- Delete: `assets/blog-pagination.js`
- Delete: `assets/images/optimized/blog/`
- Delete: `scripts/extract-retained-pages.mjs`
- Modify: `assets/localization.js`

**Interfaces:**
- Consumes: completed `src/` page sources and clean Eleventy build.
- Produces: one authoritative source tree and no tracked or published blog surface.

- [ ] **Step 1: Write failing source/output blog-removal tests**

Create `tests/blog-removal.test.mjs` that asserts:

- none of `blog`, `fr/blog`, `ar/blog`, `assets/images/optimized/blog`, `assets/blog.css`, `assets/blog-article.css`, or `assets/blog-pagination.js` exists in source
- no root or localized retained legacy `.html` file exists outside `_site`
- `assets/localization.js` contains no `/blog/` or `catalog.html` route logic
- `_site` contains none of `blog/`, `assets/blog.css`, `assets/blog-article.css`, `assets/blog-pagination.js`, or `assets/images/optimized/blog`
- all generated HTML lacks navigation/footer links to Blog

- [ ] **Step 2: Run removal tests and verify RED**

Run:

```bash
npm test -- tests/blog-removal.test.mjs
```

Expected: FAIL because `blog/` and the legacy root HTML still exist.

- [ ] **Step 3: Remove legacy/blog files and stale runtime cases**

Use `git rm` with the exact tracked targets above. Remove the `/blog/` and `/blog/catalog.html` entries from `LanguageSwitcher.isRootPage()` and remove the `currentPath.startsWith('/blog/')` redirect branch. Retain redirects for `/`, `/index.html`, `/about.html`, `/services.html`, and `/contact.html`.

Delete `scripts/extract-retained-pages.mjs` after confirming all thirteen generated source files are tracked and buildable without it.

- [ ] **Step 4: Clean-build and verify removal GREEN**

Seed `_site/blog/stale.html`, then run:

```bash
npm run build
npm test -- tests/blog-removal.test.mjs
npm test
```

Expected: the clean-build hook removes the seeded stale blog file and every test PASS.

- [ ] **Step 5: Commit source cleanup**

```bash
git add assets/localization.js tests/blog-removal.test.mjs
git add -u
git commit -m "refactor: remove legacy pages and blog"
```

Before committing, inspect `git status --short` and unstage any user-owned `.DS_Store` or `11ty-implementation-guide.md` path if present.

---

### Task 5: GitHub Pages Validation and Deployment Workflow

**Files:**
- Create: `tests/workflow.test.mjs`
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: `npm ci`, `npm run verify`, and `_site/`.
- Produces: pull-request build validation and main-branch GitHub Pages deployment.

- [ ] **Step 1: Write the failing workflow contract test**

Create `tests/workflow.test.mjs` that reads `.github/workflows/pages.yml` and asserts it contains:

- `pull_request`
- a `push` branch restriction to `main`
- `workflow_dispatch`
- `actions/checkout@v6`
- `actions/setup-node@v6` with Node 22 and npm cache
- `npm ci`
- `npm run verify`
- `actions/configure-pages@v5`
- `actions/upload-pages-artifact@v4` with `_site`
- `actions/deploy-pages@v4`
- `contents: read`, `pages: write`, and `id-token: write`
- an `if` condition preventing artifact upload and deployment on pull requests
- the `github-pages` environment and a concurrency group

- [ ] **Step 2: Run the workflow test and verify RED**

Run:

```bash
npm test -- tests/workflow.test.mjs
```

Expected: FAIL because `.github/workflows/pages.yml` does not exist.

- [ ] **Step 3: Implement the Pages workflow**

Create one workflow with:

- triggers for pull requests, pushes to `main`, and manual dispatch
- top-level `permissions: contents: read`
- top-level `concurrency` keyed to Pages with `cancel-in-progress: false`
- a `build` job that checks out, sets up Node 22 with npm caching, runs `npm ci`, runs `npm run verify`, configures Pages on main pushes only, and uploads `_site/` on main pushes only
- a `deploy` job conditioned to `github.event_name != 'pull_request'`, requiring `build`, with `pages: write` and `id-token: write`, the `github-pages` environment, and `deploy-pages@v4`

- [ ] **Step 4: Verify workflow GREEN**

Run:

```bash
npm test -- tests/workflow.test.mjs
npm run verify
```

Expected: workflow contract and the full generated-site suite PASS.

- [ ] **Step 5: Commit CI/CD**

```bash
git add .github/workflows/pages.yml tests/workflow.test.mjs
git commit -m "ci: validate and deploy Eleventy site"
```

---

### Task 6: Final Verification and Review

**Files:**
- Modify only files required to address verification findings.

**Interfaces:**
- Consumes: the entire approved spec and all preceding task outputs.
- Produces: evidence that the branch satisfies the implementation contract without including user-owned changes.

- [ ] **Step 1: Run the complete clean verification suite**

Run:

```bash
npm ci
npm run verify
git diff --check main...HEAD
```

Expected: install, build, and tests exit 0; Git reports no whitespace errors.

- [ ] **Step 2: Verify route and blog-removal inventories independently**

Run commands that count exactly thirteen generated HTML files, list every generated route, confirm `find _site -path '*blog*'` returns nothing, and confirm `rg -n 'href="[^"]*blog|>Blog<|>المدونة<' _site src` returns nothing.

Expected: thirteen retained HTML files and no blog matches.

- [ ] **Step 3: Audit version-control scope**

Run:

```bash
git status --short
git diff --stat main...HEAD
git diff --name-status main...HEAD
```

Confirm `.DS_Store`, `11ty-implementation-guide.md`, `_site/`, `node_modules/`, and `.cache/` are not staged or committed. Confirm intended legacy/blog deletions and new Eleventy/CI files are present.

- [ ] **Step 4: Request code review and address findings**

Use the `superpowers:requesting-code-review` workflow against the approved spec and implementation plan. For each valid issue, add or update a failing regression test, observe RED, implement the smallest correction, and rerun `npm run verify`.

- [ ] **Step 5: Run final fresh verification**

Run `npm run verify`, `git diff --check main...HEAD`, and the route/blog inventory commands again after review fixes. Only report completion from this fresh output.
