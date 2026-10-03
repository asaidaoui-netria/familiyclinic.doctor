# Publications redesign

Design proposal, 3 October 2026. English first, as requested. This replaces the PDF preview experience with a browsable, readable publication library using the client's category tree. The deliverables are a content inventory, page designs, and migration decisions; the production website has not been changed.

## Recommendation

Use **Publications → category → article** as the primary journey. Preserve all four article groups and their source order. Treat **Cooking to Heal** as the fifth branch, with its own book introduction and readable recipe excerpts. Every article has one stable URL, even when linked from several places.

Keep the existing Quiet Clinic identity: white, blue, self-hosted Inter, generous spacing, and a phone contact action. Make the category directory the defining element of this section. Use compact article lists rather than 56 large cover cards. No search field, keyword cloud, PDF viewer, carousel, infinite scroll, or additional condition taxonomy is needed for this collection.

Three approaches were considered:

- **Dedicated category pages, recommended:** stable destinations, an understandable hierarchy, short index page, and a useful introduction to each group. Visitors reach any article in two links from Publications.
- **One long page with expandable categories:** fewer templates, but the 25-item third group dominates mobile browsing and categories lack independent landing pages.
- **Filterable cover grid:** familiar, but repeats the existing browsing problem and asks visitors to scan dozens of images. It also makes the client's tree less apparent.

## What the files actually contain

All **56 architecture IDs** have exactly one full article, one teaser, and one image. No article bundle is missing. The architecture and archive agree on the four group counts:

- Nutrition fundamentals: **16**, A00–A15.
- Autoimmune conditions: **9**, B01–B09.
- Conditions and cellular accumulation: **25**, C00–C24.
- Conditions and elimination: **6**, D01–D06.
- Cooking to Heal: **three editions of one book excerpt**, EN, FR, and AR; these are not three different articles.

The archive has 177 files: 115 Word documents, 59 images, and three PDFs. The 56 article bodies and 56 teasers are French; three additional teasers introduce the book in each language. Word counts from extracted paragraph text total approximately **152,248** for the article bodies, with a median of **2,428** and a range of **1,088–9,801**. Counts use whitespace-separated tokens and are planning estimates, not linguistic measurements. The English-first release therefore needs translation, not simply English navigation around French text. Existing English PDF editions of the 13 legacy publications, and a local English diabetes Word document, are useful translation references; compare them against these new French sources before reuse.

The `vignette` documents contain roughly 60–120 words of promotional or introductory copy, not thumbnail images. Adapt this copy into short neutral descriptions. Four files are legacy `.doc` (A12 and C08 body/teaser pairs). C01's body is `C01 Arthrites.docx`, without the usual `-word` suffix: a suffix-only import would miss it. B03's folder says “Haschimoto”; the body correctly says “Hashimoto.” Preserve source IDs while normalizing public titles.

At least 33 article bodies have no named heading styles; even styled documents need inspection because headings often appear as ordinary paragraphs or list items. Four DOCX article bodies contain tables (B01, B04, B07, C09; six tables total). Legacy DOC table structure still needs checking after conversion. A plain text dump is suitable for inventory, not the final article import.

The images total about **235 MB**; sampled artwork is portrait illustration rather than a text-heavy document cover. Article images range from approximately 0.25 to 4.94 MB. Use them selectively, with responsive derivatives in production. Do not load originals on category lists or crop every portrait into a landscape hero.

The book PDFs are **73 English pages, 74 French pages, and 72 Arabic pages**. Text extraction works, but page furniture, illustrations and multilingual tables require manual cleanup. The English PDF includes **20 complete sample recipes**, numbered 1, 11, 21 … 191. The book advertises 200 recipes; the website must describe the supplied material as excerpts. PDF page indices differ from printed page numbers. The inventory records PDF indices.

The inventory JSON and CSV preserve each source filename, body hash, category ID, proposed English title, URL, and translation status. The inspection covered the full file inventory and extracted text, with closer reading of representative long articles, headings, tables, teasers, and book pages. It was not a clinical fact-check of the complete corpus.

## Category names and information architecture

Translate the architecture faithfully while making the labels understandable:

- A → **Nutrition fundamentals**, `/publications/categories/nutrition/`.
- B → **Autoimmune conditions**, `/publications/categories/autoimmune-conditions/`.
- C → **Conditions and cellular accumulation**, `/publications/categories/cellular-accumulation/`.
- D → **Conditions and elimination**, `/publications/categories/elimination/`.
- Book → **Cooking to Heal**, `/publications/cooking-to-heal/`.

Explain “encrassage” in C's introduction as the author's cellular accumulation model; introduce D as the author's elimination model. These are the client's organizing concepts, not classifications to silently present as established medical consensus. Keep the same membership: C15 remains in C even though its subject is autoimmunity. Use a contextual link to B rather than duplicating the article. C07, C08, and C09 have separate diabetes-related scopes and should retain distinct titles and introductions.

The A/B/C/D and numeric codes remain internal editorial keys. Visitors see subjects, titles, and counts. Use source order, not a fabricated recency order. Introductory pieces A00, B01, C00 and D01 are the natural first articles.

## Page designs

### Publications index

Use the existing site header and an H1, **Health publications**. The introduction explains that readers can choose a subject and read the articles online. A small author line links to the existing doctor profile.

Display four spacious directory rows. Each has the category title, a one-sentence explanation, the total number of published articles, three representative article links, and a clear “Explore category” link. A modest portrait image can accompany each row on desktop; omit it on narrow screens. The category title and action both lead to the category URL. Avoid making a whole row a link when it contains other links.

Below them, a separate book section shows the English cover, **Cooking to Heal**, a short description, and “Explore 20 recipe excerpts.” Counts in production derive from published records. The design shows the full planned collection; it does not mean all English articles are ready.

### Category page

Breadcrumb: Publications / category. Show the category H1, a 60–100-word introduction, and article count. The introduction for C/D briefly explains the author's framework and points to the introductory article.

Desktop: a 220px navigation rail with the four categories and book link; an 800px main column with the complete article list. Each article row has a linked title, a 25–40-word description, and a reading-time estimate computed from the final English body. Highlight the first overview with the label “Start here,” without removing it from the list or creating a duplicate page. Avoid page counts and PDF metadata.

Show all 25 entries in the largest category on one page. This is a manageable list; pagination and subgroup pages add unnecessary navigation. On mobile, replace the side rail with native expandable “Browse categories” navigation above the list. All links remain in the document and work without JavaScript. The browser Back action restores the category position.

### Article page

Breadcrumb: Publications / category / article. Put the H1, a short scope statement, author link, real update/review information, and final English reading time above the text. Do not invent publication or medical review dates from file modification dates. Show the source illustration beside the introduction on desktop at a modest size; preserve its aspect ratio. On mobile, omit the decorative lead illustration so reading begins sooner; retain any explanatory figures within the body.

The body is readable semantic HTML: short paragraphs, H2/H3 sections, genuine lists, accessible tables, captions where needed, and linked references. Use 18–19px text, 1.7 line height, and a reading measure near 65–72 characters. Keep the complete article on one canonical page, including the 9,801-word liver article.

A sticky contents rail lists major sections and marks the current location. It includes “Back to [category].” On mobile, a native “In this article” disclosure sits above the body. Use section anchors, not separate pages for each heading. Summaries at the top should capture reviewed content, not generate new health advice.

Finish with sources, actual editorial provenance, two or three curated related articles, the previous/next titles in the same category, and a restrained link to contact the clinic. Existing educational wording can remain. A disclaimer does not substitute for accurate content or referenced claims.

The mockup uses an English **Genetics explained simply** excerpt to demonstrate reading layout. Other article links demonstrate the same template using their actual proposed titles and source records. They are explicitly incomplete design samples, not translated production articles.

### Book and recipe pages

The fifth branch is a book landing page, not another disease category. Show the English cover, author, a concise introduction, an HTML introduction/excerpt, and the 20 supplied recipe links. Describe them as a selection from the book. The complete recipe list remains under this branch; preserve source order without imposing a second navigation system on the health articles.

Recipe detail uses the same breadcrumb, typography and author treatment, with practical sections: servings, preparation/rest/cooking times when supplied, ingredients, numbered steps, tip, variation, and source attribution. Add a print stylesheet. The mockup includes the actual English cucumber, plant-based yogurt and mint recipe. Omit unverified therapeutic claims and invented nutrition/calorie values from the draft recipe metadata.

Background book excerpts can initially be anchored sections on the book page. Do not create thin pages for chapter-title leaves or advertise unsupplied recipes. Twenty complete recipes can support twenty useful child pages; they are a proposed scope extension to faithfully cover the fifth branch, not a prerequisite to launching the 56 articles.

## Visual and interaction rules

Reuse these existing tokens: white `#ffffff`, soft surface `#f8fafc`, ink `#0f172a`, secondary text `#475569`, blue `#1d4ed8`, and structural border `#e2e8f0`. Preserve Inter for English and reserve the existing Cairo font for a later Arabic release. Use 48px desktop/34px mobile H1, 28–32px section headings, and 18px reading text. Allow long clinical titles to wrap without ellipsis.

Keep content left aligned, a maximum outer width near 1160px, and 24px mobile gutters. Use borders to separate real sections, not identical boxed cards everywhere. Portrait illustrations provide the visual character; no stock-photo hero, animated counters, or decorative category colors. Blue identifies links, focus and active navigation.

All controls have visible keyboard focus and comfortable touch targets. Contents links scroll below the sticky header, respect reduced motion, and remain usable at 200% zoom. Native disclosures expose state to assistive technology. Use a skip link, one H1 per page, descriptive links, semantic breadcrumbs and `aria-current`. Tables may scroll within their own container, never the whole page. Long titles, 320px widths, keyboard-only use and browser Back are explicit design cases.

## SEO and content quality

Render complete English bodies at build time with Eleventy. Category and article links must be normal anchors with real URLs, not JavaScript filter state. This supports discovery and readers arriving directly from search. Use descriptive unique titles and summaries, self-referencing canonicals, and an XML sitemap containing only published, canonical pages. These choices follow Google's [crawlable-link guidance](https://developers.google.com/search/docs/crawling-indexing/links-crawlable) and [SEO starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

Add `Article` and `BreadcrumbList` JSON-LD to article pages, with truthful author identity, headline, representative image, and actual dates where known. Link the author to `/about.html#dr-said-alaoui`; confirm that profile's details rather than inventing credentials. Index/category pages can use `CollectionPage` and `ItemList` as descriptive schema, without promising a special Google result. Book pages can describe the `Book`; recipe children can use `Recipe` once required fields, including a suitable recipe image, are available. The book cover is not a substitute for a photo of each recipe. Omit fake reviews and incomplete rich-result markup. See Google's [Article](https://developers.google.com/search/docs/appearance/structured-data/article), [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), and [Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe) documentation.

Visible sources, accurate medical explanations and genuine authorship matter more than repeating keywords. The examined texts include infant dietary restrictions, treatment claims, and causal hypotheses about autism and other conditions. During English editing, distinguish the author's model from established evidence, check those claims, and supply appropriate references. Do not turn strong promotional teaser language into unsupported search snippets. This is an observed editorial need, not a completed medical review. Google's [people-first content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) emphasizes accuracy, authorship and trust for health subjects. No design or structured-data implementation guarantees rankings.

Use contextual links between relevant articles instead of creating duplicate condition pages. For example, C15 links to the autoimmune category, and the three diabetes articles link to one another with distinct descriptions. Do not add keyword landing pages, index filter combinations, or automatically generate FAQs to chase rankings.

English-only articles must not claim French/Arabic equivalents. Emit `hreflang` only for real reviewed counterparts, and let each translation self-canonicalize. The language switcher must not generate blank hrefs or imply that a category/home page is an equivalent translation. The existing template currently assumes all three languages; that assumption must change. Follow Google's [localized-version guidance](https://developers.google.com/search/docs/specialty/international/localized-versions).

## URL and migration decisions

Keep article paths flat under `/publications/`; put category URLs under `/publications/categories/`. The relationship is expressed through navigation, breadcrumbs and content metadata. This retains stable article links if grouping changes later.

Retain the following existing English URLs when their reviewed replacements are ready:

- A00 → `/publications/nutrition-key-health/`
- A01 → `/publications/hypotoxic-nutrition/`
- A02 → `/publications/nature-to-factory/`
- A04 → `/publications/hypotoxic-diet-principles/`
- A07 → `/publications/invisible-environmental-threats/`
- A08 → `/publications/chronic-inflammation/`
- A11 → `/publications/enzymes/`
- A13 → `/publications/pregnancy/`
- B02 → `/publications/basedow-disease/`
- B03 → `/publications/hashimoto-disease/`
- B04 → `/publications/liver-immunity/`
- B06 → `/publications/rheumatoid-arthritis/`
- C08 → `/publications/diabetes-hyperinsulinism/`

These are topic-equivalence mappings; compare source bodies before replacing each page. The other 43 article slugs are proposed in `catalog.json`. Do not shorten old slugs merely for appearance. Keep old object-storage PDFs accessible during transition; replacing the UI does not require deleting historical assets.

For existing French/Arabic publication pages, first inventory search traffic and backlinks. Remove the viewer from those routes too. Preferred French migration: format the supplied original bodies as HTML at their existing paths for the 13 overlaps, while developing the full new collection in English. For Arabic, recover and review existing translated content when available. If a route cannot be migrated at launch, use an honest non-indexed transition page with a clear link to the English article, then restore a localized HTML page; do not present English text as Arabic or map all old URLs to the index. This transitional page is a fallback and may lose search visibility; preserving real localized content is better. Decide the per-route disposition before release rather than letting the English-only generator delete old pages silently.

The site deploys to **GitHub Pages**. Preserve paths where possible because the current hosting workflow does not provide a configured server redirect layer. If any URL must change, implement verified HTTP 301/308 behavior on a capable serving layer, or explicitly accept the limitations of a static redirect page. Never call a meta refresh a 301. Google's [migration guidance](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes) recommends a URL mapping, direct permanent redirects and updated internal links/sitemaps.

## Implementation boundaries for the next phase

Keep Eleventy and the existing shared chrome. Create one taxonomy record per category, one stable content record per article ID, and separate locale editions. A publication record should contain `id`, `categoryId`, `order`, `slug`, `sourceFiles`, `sourceHash`, `title`, `summary`, `body`, `toc`, `authorId`, `image`, `relatedIds`, `publishedAt`, `modifiedAt`, optional genuine review metadata, `language`, and `status`. Recipe records add ingredients, instructions, servings and verified times. Missing dates remain missing; pending English editions remain drafts.

Import bodies to clean Markdown or structured content with reviewed heading mappings, preserving tables, lists, footnotes and references. Keep the raw archive outside the public site. Use explicit asset roles from the manifest, not filename guessing. Derive contents navigation and reading time from the final body, and derive counts from published records. Translation drafts can be assisted, but require language and medical editing before indexing.

Replace `src/_includes/publications/catalog.njk` and `detail.njk`, the publication page generator and PDF-bound data model. Add category generation and the book/recipe variants. Update `layouts/base.njk`, `header.njk`, structured data and the sitemap for partial translation availability and per-page metadata. Remove `publication-viewer.js`, PDF viewer styles and vendor passthrough from the public build. Keep PDF utilities only if still useful for offline source conversion; do not leave the site runtime coupled to the old PDF asset validator. The current model also explicitly forbids the cookbook, so it cannot simply be extended with new entries.

Suggested delivery sequence: finalize this design; build the shared page templates with a few representative converted articles; translate and review the inventory in category batches; migrate matching legacy routes; add the book branch; remove the remaining PDF runtime; validate and deploy. The long B04 article, C09 tables, C01 filename exception, legacy A12/C08 documents, 25-entry category, and bilingual glossary are useful conversion checks.

## Acceptance criteria

- All 56 architecture IDs occur once; every published article has one primary category and canonical route. Counts match published content.
- Index, category, article and book navigation work without search and without JavaScript. Mobile and keyboard paths are complete.
- Production HTML includes complete article text, headings, sources and working internal anchors. No viewer canvas, PDF.js or iframe is required to read.
- Existing 13 English routes keep working; all 39 old localized detail routes have a recorded disposition. There are no indiscriminate redirects to the index.
- English text, metadata, canonicals, language links and schema agree. Draft or untranslated pages never appear as finished English articles.
- Optimized images have declared dimensions and appropriate alt text. Large original assets are excluded from the public build; content starts promptly on mobile.
- Build and route checks validate unique H1s, nonempty article bodies, category membership, schema shape, sitemap coverage, no broken links and no empty locale destinations. Visually check index, largest category, short/long article, table article, book and recipe at desktop and mobile widths.
- Medical review labels and dates are supported by actual review; references and clinical claims are checked during publication editing. No review badges are fabricated.

## Review artifacts

- `index.html`: clickable responsive design study. The index, all four categories, article samples, book hub and recipe views can be explored. Its hash routes are a prototype convenience; the production proposal uses static URLs.
- `catalog.json`: all 56 source-backed article records, proposed English titles/URLs, categories, and 20 recipe records.
- `article-inventory.csv`: spreadsheet-friendly article inventory.

The preview uses original local images for evaluation and deliberately labels article text as sample content. It is not production-ready content or a deployed redesign. No live site changes, commits, or external messages are part of this design task.

## Design verification

The preview was inspected at 1440px desktop and 390px mobile widths. All 82 prototype destinations (index, four categories, 56 article samples, book hub and 20 recipe samples) were exercised at 320px: each rendered one H1 with no horizontal page overflow, and every recipe had extracted ingredients and preparation steps. All index images loaded. These checks validate the design artifact, not production content, live SEO, translation accuracy or clinical claims.
