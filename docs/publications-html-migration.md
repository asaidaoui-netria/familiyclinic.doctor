# Publications HTML migration

The collection contains 56 article IDs in the client's four architecture branches: A (16), B (9), C (25), D (6). The English, French, and Arabic editions share stable article slugs. The English, French, and Arabic cookbook branches each contain the 20 complete recipes present in their supplied edition.

`content/publications/manifest.json` defines article identity, category, source filenames, original-file SHA-256 and optimized illustrations. Each ID has a French original and English and Arabic translations in separate JSON files. `book.json`, `book-fr.json`, and `book-ar.json` contain the supplied recipe text and complete preface in each language. The Arabic book uses its own cover and original recipe quantities and timings, which sometimes differ from the English edition. Its PDF filename, SHA-256, and source page numbers are retained in the data. The manifest also defines curated related articles and the cross-category autoimmune link. These files are the build inputs; the build does not need Drive, WhatsApp, Word, PDF tools or remote publication storage.

English and Arabic article editions identify their French source and AI-assisted translation provenance. They have not received a clinical review. The translations preserve the author's claims and contradictions; they do not silently update medical terminology, correct advice or invent clinical review dates. The public pages retain author attribution and language links. The user requested removal of the dedicated source/review panels; translation provenance remains in the edition data. The review reports in the local audit directory record specific source ambiguities for editorial follow-up.

## Routes and languages

- Directory: `/publications/`; French: `/fr/publications/`; Arabic: `/ar/publications/`.
- Categories: `/publications/categories/{category-slug}/`, with equivalent French and Arabic routes.
- Articles: `/publications/{article-slug}/`, with equivalent French and Arabic routes.
- Book and recipes: `/publications/cooking-to-heal/` and its children, with French and Arabic equivalents under `/fr/publications/cooking-to-heal/` and `/ar/publications/cooking-to-heal/`.
- All 13 existing article slugs are retained in English, French, and Arabic. Published Arabic articles replace the old language-choice pages. If an Arabic edition is later withdrawn to draft, its legacy URL falls back to a language-choice page with `noindex, follow`, outside the sitemap and translation alternates.

Only actual published counterparts appear in language links and hreflang. Complete article text, contents links, category navigation and recipe instructions are server-rendered. JavaScript only enhances section highlighting and recipe printing. Category counts and reading times derive from the current published bodies.

Each indexable page has a canonical URL and Open Graph metadata. Articles and recipes have Article and BreadcrumbList JSON-LD. Directories and categories use CollectionPage and ItemList. Recipe rich-result markup is intentionally deferred because the excerpt does not provide verified individual recipe photographs; the book cover is not presented as a photograph of every dish.

## Updating content

Edit the relevant locale JSON; the supported body blocks are `heading` (levels 2/3), `paragraph`, `list` (with source nesting levels), `table`, and `figure`. Text is escaped before HTML rendering. Source hash mismatches stop the build so changes to the original manuscript cannot silently retain a stale translation. Set an edition to `draft` to remove its article route and language alternates; published category counts update automatically.

Offline source import is reproducible from the downloaded collection and the design catalog:

```sh
python3 scripts/publications/import-content.py
node scripts/publications/import-book.mjs
node scripts/publications/import-french-book.mjs
node scripts/publications/import-arabic-book.mjs
node scripts/publications/optimize-images.mjs
npm run verify
```

Legacy `.doc` conversion requires LibreOffice's `soffice` command. The importer uses it because `textutil` flattened tables. The final originals retain nine tables across A12, B01, B04, B07, C08 and C09. The importer also preserves Word's nonbreaking hyphens. The C08 translation was regrouped into its recovered table/list structure with every translated text unit preserved in order.

The explanatory C04 body diagram is retained with localized alternative text and captions; its source placement is recorded in `figures.json`. Cover images are supplied illustrations resized to 240px and 640px WebP with actual intrinsic dimensions. Arabic uses Cairo typography with natural letter spacing, right-to-left navigation and lists, and decoded section fragments for the reading outline. Raw downloads, private browser captures and intermediate conversion files are ignored and never copied into the site output.

The old browser PDF reader, filter script, viewer markup and PDF.js passthrough have been removed. Existing offline PDF preparation/storage scripts and their tests remain available for archive maintenance. No remote PDFs or stored objects were deleted or modified by this migration.

Pushing `main` runs `.github/workflows/pages.yml`, which installs dependencies, verifies the site and deploys `_site/` to GitHub Pages. Source downloads and the offline import tools are not required by deployment.
