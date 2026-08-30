# Publications Library and Object Storage Delivery Design

## Objective

Add a curated multilingual publications library to the Family Clinic website. Visitors will browse a localized catalog, open a publication detail page, read a six-to-eight-page preview in an embedded PDF viewer, and select **Read now** to download the complete localized publication.

Hetzner Object Storage will hold all publication binaries. The Git repository will contain only website code, publication metadata, integrity information, and document-processing automation. The supplied ZIP archive, its extracted contents, and all derived publication binaries will remain outside Git.

## Scope

The first release covers the thirteen smaller publications supplied in English, French, and Arabic:

- From Nature to Factory
- Hypotoxic Nutrition
- Enzymes
- Nutrition: Key to Health
- Principles of the Hypotoxic Diet
- Basedow disease
- Diabetes and Hyperinsulinism
- Liver and Immunity
- Hashimoto disease
- Chronic Inflammation
- Rheumatoid Arthritis
- Pregnancy
- Invisible Environmental Threats

Localized titles will be taken from the supplied editions rather than mechanically translated from the English list above.

The release includes:

- A Publications item in the shared navigation.
- One catalog route and one detail route per supported locale.
- One localized cover, preview PDF, and complete PDF for each publication edition.
- An embedded PDF.js preview viewer.
- Object Storage configuration requirements, publication metadata, preparation tools, validation, and tests.
- A localized educational-use disclaimer on detail pages.

## Non-Goals

- Publishing or preparing *Cooking to Heal*
- Committing any supplied or generated document binary to Git
- A blog, CMS, database, user account system, or administrative web interface
- Browser-side search for the initial thirteen-title catalog
- Signed or expiring download links
- Publication-specific Plausible events or other reader analytics
- Rewriting the publications' editorial content
- Building a second cloud backup in this phase

The locally retained originals remain the authoritative source archive. An independent encrypted backup can be added later without changing the website contract.

## URL and Localization Contract

The public website uses clean directory routes:

```text
/publications/
/publications/<publication-slug>/
/fr/publications/
/fr/publications/<publication-slug>/
/ar/publications/
/ar/publications/<publication-slug>/
```

Each title has one stable ASCII slug shared across all three locales. This makes cross-language routing deterministic and avoids fragile filename- or title-derived URLs.

The English catalog is the default-language route. French and Arabic remain under their existing locale prefixes. Arabic pages render right-to-left. Canonical and reciprocal `hreflang` links connect each localized catalog and each set of publication detail pages.

The Hetzner bucket hostname is an asset origin only; it does not replace `/publications/`. Visitors browse the normal clinic routes while the embedded viewer and download link retrieve their files from Object Storage.

## Information Architecture

The shared header and footer add a localized Publications navigation label. The catalog displays one card for each title in the page's current language. It does not display 39 language-specific cards.

The catalog provides five localized filter choices:

- All
- Nutrition
- Health conditions
- Pregnancy
- Environment

With thirteen titles, category filters are sufficient and a search field would add complexity without materially improving discovery. Filtering is a progressive enhancement: without JavaScript, every card remains visible and navigable.

Each catalog card contains:

- Localized cover and alternative text
- Localized title
- Category
- Concise summary
- Page count
- Link to the localized detail page

Each detail page contains:

- Title, author attribution, category, language, page count, and summary
- A short localized description or topic overview
- The embedded preview viewer
- The complete PDF size and format
- A prominent **Read now** download action
- A localized educational-use disclaimer advising readers to consult a qualified healthcare professional
- Links to the corresponding English, French, and Arabic editions

## Publication Data Model

A dedicated Eleventy data module is the catalog's source of truth. One record represents one conceptual publication and contains stable shared fields plus a localized edition for each supported language.

Conceptually, a record has this shape:

```js
{
  id: "hypotoxic-nutrition",
  slug: "hypotoxic-nutrition",
  category: "nutrition",
  author: "...",
  editions: {
    en: {
      title: "...",
      summary: "...",
      description: "...",
      pageCount: 28,
      cover: { url: "...", width: 640, height: 900, sha256: "..." },
      preview: { url: "...", pageCount: 8, size: 123456, sha256: "..." },
      full: { url: "...", size: 4567890, sha256: "...", filename: "...pdf" }
    },
    fr: { /* same required contract */ },
    ar: { /* same required contract */ }
  }
}
```

Interface labels, category names, viewer error messages, button text, and the disclaimer live with the other clinic-wide locale data rather than being repeated in every publication record.

Eleventy generates the three catalog pages and all localized detail pages from this data. The shared base layout will accept page-specific localized route information for generated detail pages while retaining the existing fixed-route behavior for current clinic pages.

## Embedded Preview Viewer

The detail page embeds a site-owned viewer built on a pinned `pdfjs-dist` dependency. PDF.js files are bundled or copied into the generated site; the browser does not load viewer code from a third-party CDN.

The viewer fetches only the edition's six-to-eight-page preview PDF. It does not preload, probe, or render the complete publication. The complete PDF is requested only when the visitor selects **Read now**.

The viewer provides:

- Previous and next page controls
- Current and total page count
- Zoom in and out
- Fullscreen mode
- Localized visible labels and accessible names
- Keyboard-operable controls
- Responsive sizing and touch-friendly controls
- A PDF.js text layer when extraction has passed language-specific quality assurance

The preview component starts loading when it approaches the viewport so the title and descriptive HTML can render promptly. A visible loading state reserves the viewer's space to prevent layout shift.

If JavaScript is unavailable, PDF.js fails, Object Storage is unavailable, or CORS blocks the request, the viewer area presents localized links to open the preview directly and download the complete PDF. A viewer failure must not hide the publication description or complete-book action.

The **Read now** action identifies the target as a PDF and displays its file size. The object's `Content-Disposition: attachment` metadata is authoritative so the complete PDF downloads consistently even though it is served from another origin.

No publication-view, page-change, or download events are added to Plausible in this phase.

## Object Storage and Custody

The dedicated public-read Hetzner bucket `familyclinic-doctor-publications` is hosted in the `nbg1` region. Files are served directly from `https://familyclinic-doctor-publications.nbg1.your-objectstorage.com`, so Porkbun remains the registrar and authoritative DNS provider. The existing website continues to use `www.familyclinic.doctor` and the `/publications/` routes.

Objects use stable publication and locale prefixes plus an explicit immutable version:

```text
publications/<publication-id>/<locale>/v1/cover.webp
publications/<publication-id>/<locale>/v1/preview.pdf
publications/<publication-id>/<locale>/v1/full.pdf
```

Corrections create a new version prefix and update committed metadata. Published keys are never overwritten in place. This key strategy provides deterministic rollback in addition to Hetzner's Object Lock and automatic bucket versioning. The committed metadata identifies the active version.

Object Storage configuration will include:

- Public `GET` and `HEAD` delivery through the Hetzner bucket hostname
- CORS restricted to the production clinic origin and explicitly required development origins
- `application/pdf` for preview and complete documents
- Inline disposition for previews and attachment disposition with a readable filename for complete documents
- Long-lived immutable caching for versioned object paths
- Object Lock enabled at bucket creation and one-year Governance retention for production uploads
- Project-isolated S3 credentials for publication tooling
- No upload or account-management credentials in source control

The Hetzner project and bucket are infrastructure, not the canonical content model. S3-compatible paths, local originals, SHA-256 checksums, and committed metadata keep the library portable to another object-storage provider if necessary.

## Document Preparation Pipeline

The ignored extracted archive is the input to a repeatable local preparation command. All working files and generated binaries remain in ignored staging directories.

For each localized edition, preparation will:

1. Identify and validate the expected source file.
2. Convert the three Diabetes and Hyperinsulinism Word editions to PDF while preserving layout, fonts, and page order.
3. Validate the complete PDF's page count and visual rendering.
4. Select six to eight representative preview pages, including the cover and useful interior content rather than blank or administrative pages.
5. Create a standalone preview PDF.
6. Extract and optimize a cover thumbnail for catalog display.
7. Optimize and linearize PDFs for web delivery without making text or diagrams difficult to read.
8. Calculate byte sizes and SHA-256 checksums.
9. Upload cover, preview, and complete files to the versioned Object Storage paths.
10. Produce or verify the metadata values used by Eleventy.

Scripts and configuration that perform this work may be committed. Source documents, converted documents, preview PDFs, cover images, temporary renders, and upload credentials may not be committed.

The preview page selection is curated per title. Equivalent subject matter should be shown in each translation even when pagination differs between localized editions.

## Accessibility and Content Quality

The HTML detail page carries the publication's identity and summary so essential context is not trapped inside a PDF. Cover images use localized alternative text. Metadata is presented as text, and all viewer controls have localized accessible names and visible focus states.

Each supplied edition receives manual visual QA for:

- Correct title, language, and cover
- Page order and page count
- Missing, clipped, blank, or unexpectedly rotated pages
- Font rendering and embedded images
- Preview-page usefulness and correspondence across translations
- Complete download integrity
- Arabic right-to-left presentation

Some supplied Arabic PDFs do not expose reliable extractable text. The PDF.js text layer will be enabled only for editions that pass selection, order, and readability checks. A broken or garbled text layer will not be presented as accessible content. The localized HTML title, summary, metadata, and fallback links remain available for every edition.

## Validation and Error Handling

Build-time validation fails on:

- Duplicate IDs or slugs
- Missing required editions or localized fields
- Unsupported categories or locales
- Malformed or non-HTTPS asset URLs
- Missing page counts, file sizes, versions, or SHA-256 values
- Preview page counts outside the approved six-to-eight-page range
- Accidental inclusion of *Cooking to Heal*

A separate pre-release storage check performs `HEAD` and range requests against every active object. It verifies existence, byte size, content type, disposition, caching, CORS behavior, and partial-content support. Keeping this network check separate prevents ordinary offline Eleventy builds from depending on Object Storage availability.

At runtime, viewer errors are contained within the preview component and lead to localized fallback actions. The page remains usable, indexable, and navigable. Missing metadata is a build failure rather than a partially rendered production page.

## Testing Strategy

Tests will be written and observed failing before implementation. Automated coverage will verify:

- Catalog routes and all generated detail routes
- One card per title in each locale
- Correct category filtering with a no-JavaScript fallback
- Publications navigation in all locales
- Reciprocal language and canonical links
- RTL attributes and Arabic interface labels
- Viewer configuration points only to the preview object
- **Read now** points only to the complete object
- Complete PDFs are not preloaded by generated markup
- Localized viewer fallback content
- Publication data validation and checksum format
- Exclusion of *Cooking to Heal* from routes, metadata, and asset manifests
- No publication binary is tracked by Git

Manual browser checks cover representative desktop and mobile browsers, keyboard controls, zoom, fullscreen, viewer failure, the three writing directions/languages, and a complete download in each locale.

## Rollout

Configuration and delivery will be proven with a disposable staged PDF followed by one representative title in English, French, and Arabic. The pilot must pass document QA, storage header checks, viewer behavior, locale switching, RTL behavior, and complete downloads.

After the pilot succeeds, the same preparation and upload pipeline will process the remaining twelve titles. The final release is deployed only when all thirteen publication records and all 39 localized editions pass validation.

Rollback changes committed metadata to the previous immutable version and redeploys the static site. Previously published objects remain available while retention protection applies.

## Acceptance Criteria

- `/publications/`, `/fr/publications/`, and `/ar/publications/` provide localized catalogs with thirteen titles and approved filters.
- Every title has a localized detail route in English, French, and Arabic.
- Every detail page embeds a six-to-eight-page PDF.js preview and provides a **Read now** complete-PDF download.
- Opening a catalog or detail page never downloads the complete PDF automatically.
- Hetzner uses the `nbg1` region, versioned immutable paths, project-isolated credentials, suitable CORS and delivery headers, and Governance retention protection.
- The source ZIP, extracted archive, originals, previews, complete PDFs, and cover derivatives remain ignored and untracked.
- Metadata records active Object Storage URLs, page counts, sizes, versions, and SHA-256 checksums.
- Arabic and translated editions pass visual QA; unreliable text layers are not exposed.
- Viewer failure degrades to usable localized preview and download links.
- No publication-specific Plausible metrics, CMS, database, authentication, or *Cooking to Heal* content is introduced.
