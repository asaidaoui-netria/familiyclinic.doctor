# Eleventy Site Without Blog Design

## Objective

Convert the Family Clinic website from hand-maintained HTML to an Eleventy-generated static site, remove the blog from the published site and source tree, and publish validated builds to the existing GitHub Pages custom domain.

The migration must preserve the visual design, clinic functionality, current public URLs for retained pages, multilingual behavior, and the user-owned files that are already uncommitted in the working tree.

## Scope

The generated site will contain these public HTML routes:

- English: `/index.html`, `/about.html`, `/services.html`, `/contact.html`, and `/404.html`
- French: `/fr/index.html`, `/fr/about.html`, `/fr/services.html`, and `/fr/contact.html`
- Arabic: `/ar/index.html`, `/ar/about.html`, `/ar/services.html`, and `/ar/contact.html`

It will also contain `sitemap.xml`, `robots.txt`, `CNAME`, the favicon files, the existing CSS and JavaScript required by retained pages, and only the optimized image categories used by retained pages.

The following will be removed from versioned source and generated output:

- English, French, and Arabic blog catalogs and articles
- The blog article template
- Blog-only CSS and JavaScript
- Optimized blog images
- Blog links in headers, footers, and other retained navigation

The existing untracked `11ty-implementation-guide.md` and modified `.DS_Store` files are user-owned and will not be included in implementation commits.

## Non-Goals

- Redesigning page content or visual styling
- Adding a CMS, appointment backend, or new client-side framework
- Changing the custom domain
- Translating the English-only 404 page
- Rewriting retained interactive behavior unless required for generated paths
- Deleting the unreferenced original-image archive in this migration

## Static-Site Architecture

Eleventy will read from `src/` and write a disposable `_site/` directory. Generated output will not be committed.

```text
src/
├── _data/
│   └── site.js
├── _includes/
│   ├── layouts/base.njk
│   ├── header.njk
│   ├── footer.njk
│   └── structured-data.njk
├── en/
│   ├── index.njk
│   ├── about.njk
│   ├── services.njk
│   ├── contact.njk
│   └── 404.njk
├── fr/
│   ├── index.njk
│   ├── about.njk
│   ├── services.njk
│   └── contact.njk
├── ar/
│   ├── index.njk
│   ├── about.njk
│   ├── services.njk
│   └── contact.njk
├── sitemap.njk
└── robots.njk
```

Each retained page will contain front matter plus its page-specific `<main>` content. Shared document structure, analytics, SEO metadata, header, footer, localized navigation, scripts, stylesheets, favicon links, and structured data will be rendered by the base layout.

Clinic-wide data will live in `src/_data/site.js`, including the canonical domain, supported locales, translated interface labels, route mapping, address, telephone, email, hours, service links, and analytics domain. This makes a clinic-wide update a one-file change.

## URL and Localization Contract

Source locale directories will not dictate public URLs. Explicit Eleventy permalinks will preserve the existing default-language-at-root convention:

```text
src/en/about.njk -> /about.html
src/fr/about.njk -> /fr/about.html
src/ar/about.njk -> /ar/about.html
```

The header and footer will generate root-relative URLs from the route map. The language switcher will link to the same `pageKey` in each supported locale. Arabic pages will render `lang="ar"` and `dir="rtl"`; other pages will render left-to-right.

Retained runtime language detection may redirect only among the known retained routes. No generated navigation or redirect may target `/blog`.

Every retained translatable page will render reciprocal English, French, Arabic, and `x-default` alternate links. Every retained page will render one canonical URL using `https://www.familyclinic.doctor`.

## Content and Metadata

Page front matter will define:

- `layout`
- `locale`
- `pageKey`
- `permalink`
- localized `title` and `description`
- active navigation item
- page-specific stylesheets and scripts
- whether the page is indexable

The shared head will render the existing Plausible analytics script, canonical and alternate links, Open Graph metadata, favicon links, and localized document attributes. Shared JSON-LD will use one consistent `LocalBusiness` representation sourced from clinic data rather than thirteen copied blocks.

The sitemap will include only indexable retained pages. `robots.txt` will point to the generated sitemap. The 404 page will be excluded from the sitemap and marked `noindex`.

## Assets

Eleventy passthrough copies will publish retained CSS, retained JavaScript, favicons, and these optimized image categories:

- clinic
- logos
- netria
- services
- team

The build will not publish `assets/images/original`, optimized blog images, `.DS_Store` files, source templates, tests, documentation, or Node dependencies.

Blog-specific CSS, JavaScript, and optimized images will be deleted because no retained route uses them. General-purpose retained assets will remain in their current paths so existing page content and CSS do not require a visual rewrite.

## Build and Developer Workflow

The repository will use an npm lockfile and a pinned supported Node.js major. Scripts will provide:

- a local Eleventy development server
- a clean production build
- generated-site tests
- a single verification command used locally and in CI

Adding or editing a retained page will mean editing its source content or shared data and opening a pull request. Generated `_site/` output will remain disposable.

## Automated Validation

Node's built-in test runner will verify the generated site. Tests will be written and observed failing before production implementation. The checks will cover:

- all thirteen retained HTML routes exist
- no blog directory, blog HTML, blog navigation, or blog-only asset is published
- all expected localized routes link to their counterparts
- Arabic pages have RTL document attributes
- canonical and reciprocal alternate metadata is present
- sitemap and robots output contain only retained routes
- local `href`, `src`, and `srcset` references resolve
- every generated HTML document has one header, one main region, and one footer
- the custom-domain file is present

The route inventory acts as a regression contract during migration.

## GitHub Pages CI/CD

One GitHub Actions workflow will run for pull requests and pushes to `main`.

The build job will:

1. Check out the repository.
2. Set up the pinned Node.js major with npm caching.
3. Install from the lockfile using `npm ci`.
4. Run the full build and generated-site verification command.
5. Configure GitHub Pages and upload `_site/` only for a push to `main`.

The deployment job will run only after a successful `main` build. It will use the protected `github-pages` environment and native `deploy-pages`, with only `pages: write` and `id-token: write` permissions. Deployment concurrency will prevent overlapping production releases.

Pull requests will therefore prove that the production artifact can be generated without publishing it. A failing build or validation check prevents deployment.

## Migration Sequence

1. Add the test harness and route contract, confirm it fails before Eleventy output exists.
2. Add Eleventy configuration, package metadata, ignore rules, and shared site data.
3. Add shared layouts and generated navigation.
4. Mechanically extract retained page-specific main content into locale source files.
5. Build, then correct generated paths or template issues until the route contract passes.
6. Add sitemap, robots, and custom-domain passthrough.
7. Remove blog source pages and blog-only assets.
8. Add the GitHub Pages workflow.
9. Run the full verification suite and inspect the final Git diff for unintended changes.

## Error Handling and Rollback

Eleventy builds and validation will fail on missing required data, missing retained output, broken local assets, or unexpected blog output. GitHub Pages receives an artifact only after these checks pass, so a failed update leaves the previous deployment in place.

The existing published HTML remains recoverable from Git history. If the migration must be rolled back after deployment, revert the migration commit and allow the same Pages workflow to deploy the restored static files.

## Acceptance Criteria

- Eleventy builds the thirteen retained routes with their existing public paths.
- Retained page presentation and interactive behavior remain functional.
- No blog page, Blog navigation link, blog-only client asset, or optimized blog image appears in source output.
- Shared site chrome and clinic-wide data have a single template/data source.
- Generated links and localized counterparts resolve.
- SEO metadata, sitemap, robots, and custom-domain output are generated consistently.
- Pull requests validate without deploying; successful pushes to `main` deploy `_site/` through native GitHub Pages actions.
- Existing user-owned uncommitted files remain untouched and uncommitted.
