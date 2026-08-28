# Publications Asset Pipeline and R2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the 39 localized editions of the thirteen approved publications, publish their covers, preview PDFs, and complete PDFs to an EU-jurisdiction Cloudflare R2 bucket, and commit a verified integrity manifest without committing any publication binary.

**Architecture:** A source catalog maps the ignored archive to stable publication IDs and locales. Testable Node scripts use PDF libraries plus explicitly checked local document tools to convert Word sources, curate six-to-eight-page previews, render covers, calculate integrity metadata, upload immutable versioned objects through R2's S3 API, and verify the public delivery contract. `src/_data/publication-assets.json` is the only handoff to the website plan.

**Tech Stack:** Node.js 22+, Node test runner, `pdf-lib` 1.17.1, `pdfjs-dist` 6.2.108, `@napi-rs/canvas` 1.0.8, `@aws-sdk/client-s3` 3.1116.0, Wrangler 4.67.1, qpdf, LibreOffice headless, Cloudflare R2

**Spec:** `docs/superpowers/specs/2026-08-28-publications-library-r2-design.md`

## Global Constraints

- Publish exactly thirteen titles and exactly three editions (`en`, `fr`, `ar`) per title.
- Exclude *Cooking to Heal* from source mappings, generated output, R2 object keys, and the committed manifest.
- Preview PDFs contain six to eight curated pages and never replace the complete PDFs.
- Use immutable `publications/<id>/<locale>/v1/` R2 object prefixes; never overwrite a published key.
- Create the R2 bucket with the `eu` jurisdiction and serve it from `media.familyclinic.doctor`.
- The ZIP, extracted archive, Word files, PDFs, preview PDFs, cover derivatives, contact sheets, credentials, and temporary renders must remain ignored and untracked.
- Commit only code, configuration without secrets, documentation, and `src/_data/publication-assets.json` containing public URLs and integrity metadata.
- Do not add a CMS, database, signed URLs, authentication, a second cloud backup, or publication-specific analytics.
- Write each behavioral test first, observe the expected failure, implement the minimum behavior, rerun the focused test, then run the broader suite before committing.

## File Structure

- `.gitignore` — protects the downloaded archive, extracted files, local credentials, and all generated publication work.
- `package.json`, `package-lock.json` — pin document, upload, and R2 tooling and expose repeatable publication commands.
- `scripts/publications/source-catalog.mjs` — exact mapping from stable IDs/locales to ignored source paths.
- `scripts/publications/preview-pages.mjs` — reviewed page selections created from contact-sheet QA.
- `scripts/publications/lib/catalog.mjs` — validates inventory completeness and prevents cookbook inclusion.
- `scripts/publications/lib/files.mjs` — hashes files, validates safe paths, and writes JSON atomically.
- `scripts/publications/lib/pdf.mjs` — reads PDFs, extracts preview pages, renders covers, and invokes qpdf/LibreOffice safely.
- `scripts/publications/prepare.mjs` — orchestrates local conversion and generation into `.publication-work/prepared/`.
- `scripts/publications/upload.mjs` — uploads prepared assets with immutable HTTP metadata and writes the public manifest.
- `scripts/publications/verify-r2.mjs` — checks every public object, range request, CORS response, header, size, and checksum metadata.
- `infra/r2/cors.json` — production and local-development R2 CORS contract.
- `docs/publications-r2-runbook.md` — credential, provisioning, upload, rotation, and rollback instructions.
- `src/_data/publication-assets.json` — committed active R2 asset contract consumed by Eleventy.
- `tests/publication-pipeline.test.mjs` — unit and integration tests for all local pipeline behavior.

---

### Task 1: Protect binaries and define the source inventory

**Files:**
- Modify: `.gitignore`
- Create: `scripts/publications/source-catalog.mjs`
- Create: `scripts/publications/lib/catalog.mjs`
- Create: `tests/publication-pipeline.test.mjs`

**Interfaces:**
- Produces: `SOURCE_PUBLICATIONS: SourcePublication[]`
- Produces: `validateSourceCatalog(records, { existsSync }): SourcePublication[]`
- `SourcePublication` is `{ id: string, category: "nutrition"|"conditions"|"pregnancy"|"environment", sources: { en: SourceEdition, fr: SourceEdition, ar: SourceEdition } }`.
- `SourceEdition` is `{ kind: "pdf"|"word", path: string }`.

- [ ] **Step 1: Write the failing source-catalog tests**

Add tests that assert thirteen unique IDs, exactly three locales per title, 39 existing input files, no cookbook path, and no tracked publication binary:

```js
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import test from "node:test";

import { SOURCE_PUBLICATIONS } from "../scripts/publications/source-catalog.mjs";
import { validateSourceCatalog } from "../scripts/publications/lib/catalog.mjs";

test("the source catalog contains thirteen complete localized publications", () => {
  const records = validateSourceCatalog(SOURCE_PUBLICATIONS, { existsSync });
  assert.equal(records.length, 13);
  assert.deepEqual([...new Set(records.map(({ id }) => id))].length, 13);
  assert.equal(records.flatMap(({ sources }) => Object.keys(sources)).length, 39);
  for (const { sources } of records) assert.deepEqual(Object.keys(sources).sort(), ["ar", "en", "fr"]);
});

test("the cookbook and publication binaries are absent from Git", () => {
  const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean);
  assert.equal(tracked.some((path) => /cuisiner|cooking.to.heal/i.test(path)), false);
  assert.equal(tracked.some((path) => /^FC web site files(?:\/|\.zip$)/.test(path)), false);
  assert.equal(tracked.some((path) => /^\.publication-work\//.test(path)), false);
});
```

- [ ] **Step 2: Run the focused test and verify the expected failure**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `scripts/publications/source-catalog.mjs`.

- [ ] **Step 3: Add the binary ignore rules**

Ensure `.gitignore` contains these root-scoped entries:

```gitignore
/FC web site files.zip
/FC web site files/
/.publication-work/
/.env.publications
```

- [ ] **Step 4: Create the exact source inventory**

Create `SOURCE_PUBLICATIONS` with these IDs, categories, and paths; paths without a language suffix are the French source where shown:

```js
export const SOURCE_PUBLICATIONS = [
  { id: "nature-to-factory", category: "nutrition", sources: {
    en: { kind: "pdf", path: "FC web site files/Alimentation de la nature à l'usine PDF/alimentation de la nature à l'usine en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Alimentation de la nature à l'usine PDF/alimentation de la nature à l'usine fr.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Alimentation de la nature à l'usine PDF/alimentation de la nature à l'usine ar.pdf" }
  } },
  { id: "hypotoxic-nutrition", category: "nutrition", sources: {
    en: { kind: "pdf", path: "FC web site files/L'alimentation hypotoxique pdf/L’alimentation hypotoxique en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/L'alimentation hypotoxique pdf/L’alimentation hypotoxique.pdf" },
    ar: { kind: "pdf", path: "FC web site files/L'alimentation hypotoxique pdf/L’alimentation hypotoxique ar.pdf" }
  } },
  { id: "enzymes", category: "nutrition", sources: {
    en: { kind: "pdf", path: "FC web site files/Les enzymes pdf/Les Enzymes en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Les enzymes pdf/Les Enzymes.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Les enzymes pdf/Les Enzymes ar.pdf" }
  } },
  { id: "nutrition-key-health", category: "nutrition", sources: {
    en: { kind: "pdf", path: "FC web site files/Nutrition, la clé de la santé pdf/Nutrition - la clé de la santé en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Nutrition, la clé de la santé pdf/Nutrition - la clé de la santé.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Nutrition, la clé de la santé pdf/Nutrition - la clé de la santé ar.pdf" }
  } },
  { id: "hypotoxic-diet-principles", category: "nutrition", sources: {
    en: { kind: "pdf", path: "FC web site files/Principes du régime hypotoxique pdf/Principes du régime alimentaire en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Principes du régime hypotoxique pdf/Principes du régime hypotoxique.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Principes du régime hypotoxique pdf/Principes du régime alimentaire ar.pdf" }
  } },
  { id: "basedow-disease", category: "conditions", sources: {
    en: { kind: "pdf", path: "FC web site files/Basedow pdf/BASEDOW en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Basedow pdf/BASEDOW.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Basedow pdf/BASEDOW ar.pdf" }
  } },
  { id: "diabetes-hyperinsulinism", category: "conditions", sources: {
    en: { kind: "word", path: "FC web site files/Diabète et hyperinsulinisme word/diabete et hyperinsulinisme en.doc" },
    fr: { kind: "word", path: "FC web site files/Diabète et hyperinsulinisme word/diabete et hyperinsulinisme fr.doc" },
    ar: { kind: "word", path: "FC web site files/Diabète et hyperinsulinisme word/diabete et hyperinsulinisme AR.docx" }
  } },
  { id: "liver-immunity", category: "conditions", sources: {
    en: { kind: "pdf", path: "FC web site files/Foie et immunité pdf/Foie et Immunité en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Foie et immunité pdf/Foie et Immunité.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Foie et immunité pdf/Foie et Immunité ar.pdf" }
  } },
  { id: "hashimoto-disease", category: "conditions", sources: {
    en: { kind: "pdf", path: "FC web site files/Hashimoto pdf/Haschimoto en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Hashimoto pdf/Haschimoto fr.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Hashimoto pdf/Haschimoto arabe.pdf" }
  } },
  { id: "chronic-inflammation", category: "conditions", sources: {
    en: { kind: "pdf", path: "FC web site files/Inflammation chronique pdf/Inflammation chronique en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Inflammation chronique pdf/Inflammation chronique.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Inflammation chronique pdf/الالتهاب المزمن.pdf" }
  } },
  { id: "rheumatoid-arthritis", category: "conditions", sources: {
    en: { kind: "pdf", path: "FC web site files/Polyarthrite rhumatoide PDF/Polyarthrite Rhumatoïde en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Polyarthrite rhumatoide PDF/Polyarthrite Rhumatoïde fr.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Polyarthrite rhumatoide PDF/Polyarthrite Rhumatoïde ar.pdf" }
  } },
  { id: "pregnancy", category: "pregnancy", sources: {
    en: { kind: "pdf", path: "FC web site files/Grossesse pdf/grossesse EN.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Grossesse pdf/grossesse FR.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Grossesse pdf/grossesse AR.pdf" }
  } },
  { id: "invisible-environmental-threats", category: "environment", sources: {
    en: { kind: "pdf", path: "FC web site files/Les menaces invisibles de l'environnement pdf/Les Menaces Invisibles de l'environnement en.pdf" },
    fr: { kind: "pdf", path: "FC web site files/Les menaces invisibles de l'environnement pdf/Les Menaces Invisibles de l'environnement.pdf" },
    ar: { kind: "pdf", path: "FC web site files/Les menaces invisibles de l'environnement pdf/Les Menaces Invisibles de l'environnement ar.pdf" }
  } }
];
```

- [ ] **Step 5: Implement strict catalog validation**

`validateSourceCatalog` must reject duplicate IDs, unsupported categories, missing or extra locales, unsupported source kinds, nonexistent files, paths outside `FC web site files/`, and any path matching `/cuisiner|cooking.to.heal/i`. Return the records unchanged only after every record passes.

- [ ] **Step 6: Run the focused test and the existing suite**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 7: Commit the inventory and safeguards**

```bash
git add .gitignore scripts/publications/source-catalog.mjs scripts/publications/lib/catalog.mjs tests/publication-pipeline.test.mjs
git commit -m "build: define protected publication source inventory"
```

---

### Task 2: Build the document preparation primitives

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/publications/lib/files.mjs`
- Create: `scripts/publications/lib/pdf.mjs`
- Modify: `tests/publication-pipeline.test.mjs`

**Interfaces:**
- Consumes: `SourceEdition` from Task 1.
- Produces: `sha256File(path): Promise<string>` returning lowercase 64-character hex.
- Produces: `writeJsonAtomic(path, value): Promise<void>`.
- Produces: `createPreviewPdf({ sourcePath, pageNumbers, outputPath }): Promise<{ pageCount: number }>`.
- Produces: `renderPageWebp({ sourcePath, pageNumber, outputPath, width }): Promise<{ width: number, height: number }>`.
- Produces: `convertWordToPdf({ sourcePath, outputDir, run }): Promise<string>`.
- Produces: `linearizePdf({ sourcePath, outputPath, run }): Promise<void>`.

- [ ] **Step 1: Install exact document dependencies**

Run:

```bash
npm install --save-dev --save-exact pdf-lib@1.17.1 pdfjs-dist@6.2.108 @napi-rs/canvas@1.0.8
```

- [ ] **Step 2: Write failing tests for hashing, atomic JSON, preview extraction, cover rendering, and command arguments**

Generate a ten-page PDF inside the test's temporary directory with `PDFDocument.create()`. Assert that selecting `[1, 3, 5, 7, 9, 10]` creates a six-page preview, cover rendering produces a nonempty `640`-pixel-wide WebP, hashes are stable, qpdf receives `--linearize`, and LibreOffice receives `--headless --convert-to pdf --outdir` as separate arguments. Inject a fake `run(command, args)` into the two external-command functions.

- [ ] **Step 3: Run the focused tests and verify failure**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: FAIL because `scripts/publications/lib/files.mjs` and `pdf.mjs` do not exist.

- [ ] **Step 4: Implement file integrity helpers**

Use streaming SHA-256 rather than loading complete books into memory:

```js
export async function sha256File(path) {
  const hash = createHash("sha256");
  const stream = createReadStream(path);
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest("hex");
}
```

`writeJsonAtomic` writes formatted JSON plus one newline to a sibling temporary file, renames it over the destination, and removes the temporary file on failure.

- [ ] **Step 5: Implement preview extraction and cover rendering**

`createPreviewPdf` must load the source with `pdf-lib`, validate every one-based page number, copy pages in the declared order, save with the library's normal object-stream behavior, and report the preview page count. `renderPageWebp` must expose `DOMMatrix`, `ImageData`, and `Path2D` from `@napi-rs/canvas` before dynamically importing `pdfjs-dist/legacy/build/pdf.mjs`, render the requested page into a canvas at a scale that produces the requested width, encode WebP at quality `82`, and report intrinsic dimensions.

- [ ] **Step 6: Implement safe external command wrappers**

Use `execFile`, never a shell string. The effective commands are:

```text
soffice --headless --convert-to pdf --outdir OUTPUT_DIRECTORY SOURCE_DOCUMENT
qpdf --linearize SOURCE_PDF OUTPUT_PDF
```

Write qpdf output to a separate versioned staging path so an ignored original is never modified.

- [ ] **Step 7: Run focused and full tests**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 8: Commit the preparation primitives**

```bash
git add package.json package-lock.json scripts/publications/lib/files.mjs scripts/publications/lib/pdf.mjs tests/publication-pipeline.test.mjs
git commit -m "feat: add publication document preparation primitives"
```

---

### Task 3: Curate preview pages and prepare all editions locally

**Files:**
- Modify: `package.json`
- Create: `scripts/publications/preview-pages.mjs`
- Create: `scripts/publications/prepare.mjs`
- Modify: `scripts/publications/lib/catalog.mjs`
- Modify: `tests/publication-pipeline.test.mjs`
- Generated but ignored: `.publication-work/contact-sheets/**`
- Generated but ignored: `.publication-work/prepared/**`

**Interfaces:**
- Consumes: `SOURCE_PUBLICATIONS`, PDF helpers, and `PREVIEW_PAGES`.
- Produces: `PREVIEW_PAGES[id][locale]: number[]` with six to eight one-based page numbers.
- Produces: `.publication-work/prepared/<id>/<locale>/v1/{cover.webp,preview.pdf,full.pdf,metadata.json}`.

- [ ] **Step 1: Write failing orchestration tests**

Inject fake converters/renderers into `preparePublicationEdition`. Assert the workflow converts Word sources before PDF processing, preserves supplied PDFs, renders page 1 as the cover, creates the declared preview, linearizes both PDFs, and writes metadata containing version `v1`, page counts, sizes, dimensions, and hashes. Assert validation rejects fewer than six pages, more than eight pages, duplicates, page zero, and out-of-range pages.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: FAIL with missing `preview-pages.mjs` or `prepare.mjs`.

- [ ] **Step 3: Add preflight and preparation commands**

Add these package scripts:

```json
{
  "publications:preflight": "node scripts/publications/prepare.mjs --preflight",
  "publications:contact-sheets": "node scripts/publications/prepare.mjs --contact-sheets",
  "publications:prepare": "node scripts/publications/prepare.mjs --prepare"
}
```

`--preflight` must check the complete catalog and report actionable errors when `qpdf` or `soffice` is absent. `--contact-sheets` converts Word sources into ignored staging PDFs when necessary and renders low-resolution thumbnails for every page. `--prepare` refuses to run until every edition has a valid preview selection.

- [ ] **Step 4: Install the required local document tools**

Run after obtaining system-package approval:

```bash
brew install qpdf
brew install --cask libreoffice
npm run publications:preflight
```

Expected: thirteen publications, 39 readable sources, qpdf available, and LibreOffice available.

- [ ] **Step 5: Generate and review contact sheets**

Run: `npm run publications:contact-sheets`

For each edition, choose six to eight pages using all of these rules:

1. Include page 1 as the cover.
2. Exclude blank pages, copyright-only pages, ISBN-only pages, and closing subscription advertisements.
3. Include an introduction or contents page when useful.
4. Include representative explanatory text and at least one visually informative page where available.
5. Keep equivalent subject matter across English, French, and Arabic even when page numbers differ.
6. Never include a page absent from that edition.

Record the reviewed one-based arrays in `PREVIEW_PAGES`; do not commit the rendered contact sheets.

- [ ] **Step 6: Implement the preparation orchestrator**

Build every `metadata.json` from measured values rather than literals:

```js
const metadata = {
  id,
  locale,
  version: "v1",
  full: { path: "full.pdf", ...await describePdf(fullPath) },
  preview: {
    path: "preview.pdf",
    ...await describePdf(previewPath),
    pages: [...previewPages]
  },
  cover: { path: "cover.webp", ...await describeImage(coverPath) }
};
await writeJsonAtomic(metadataPath, metadata);
```

`describePdf` returns measured `pageCount`, `size`, and `sha256`; `describeImage` returns measured `width`, `height`, `size`, and `sha256`.

- [ ] **Step 7: Prepare all 39 editions**

Run: `npm run publications:prepare`

Expected: 39 `metadata.json` files, 39 covers, 39 preview PDFs, and 39 complete PDFs under `.publication-work/prepared/`; no output anywhere else.

- [ ] **Step 8: Perform document QA**

Open every cover and preview. Confirm title/language, page order, no clipping or rotation, useful preview content, and Arabic glyph rendering. Open all three converted Diabetes and Hyperinsulinism complete PDFs and compare their first, middle, and final pages with the Word sources. Record text-layer suitability per edition as `textLayer: true|false` in `metadata.json`; use `false` for garbled or incorrectly ordered extraction.

- [ ] **Step 9: Run focused and full tests**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 10: Commit only code and reviewed page selections**

```bash
git status --short
git add package.json scripts/publications/preview-pages.mjs scripts/publications/prepare.mjs scripts/publications/lib/catalog.mjs tests/publication-pipeline.test.mjs
git commit -m "feat: prepare curated publication previews"
```

Before committing, `git status --short` must not list any file under `.publication-work/` or `FC web site files/`.

---

### Task 4: Provision the EU R2 delivery contract

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `infra/r2/cors.json`
- Create: `docs/publications-r2-runbook.md`
- Modify: `tests/publication-pipeline.test.mjs`

**Interfaces:**
- Produces: bucket `family-clinic-publications` in jurisdiction `eu`.
- Produces: public origin `https://media.familyclinic.doctor`.
- Produces: local secret contract `CLOUDFLARE_ZONE_ID`, `CLOUDFLARE_API_TOKEN`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.

- [ ] **Step 1: Install exact Wrangler tooling**

Run: `npm install --save-dev --save-exact wrangler@4.67.1`

- [ ] **Step 2: Write the failing R2 configuration test**

Assert that `infra/r2/cors.json` contains exactly one rule allowing `GET` and `HEAD` from `https://www.familyclinic.doctor` and `http://localhost:8080`, allows the `Range` header, exposes `Accept-Ranges`, `Content-Length`, `Content-Range`, and `ETag`, and caches preflight responses for `3600` seconds. Assert the runbook names every required environment variable and contains no secret value.

- [ ] **Step 3: Run the test and verify failure**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: FAIL because `infra/r2/cors.json` does not exist.

- [ ] **Step 4: Add the exact CORS policy**

```json
{
  "rules": [
    {
      "allowed": {
        "origins": ["https://www.familyclinic.doctor", "http://localhost:8080"],
        "methods": ["GET", "HEAD"],
        "headers": ["Range"]
      },
      "exposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "ETag"],
      "maxAgeSeconds": 3600
    }
  ]
}
```

- [ ] **Step 5: Write the credential and rollback runbook**

Document these exact policies:

- Authenticate Wrangler with a Cloudflare API token able to manage only R2 and the `familyclinic.doctor` zone.
- Create a separate R2 S3 token restricted to Object Read & Write on `family-clinic-publications`.
- Store credentials only in the current shell or ignored `.env.publications`; never in command history examples with literal values.
- Rotate a compromised token, rerun public verification, and do not replace published object keys.
- Roll back by changing the committed active version in `publication-assets.json`; do not delete protected objects during an incident.

- [ ] **Step 6: Run the test and verify it passes**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: PASS.

- [ ] **Step 7: Provision the bucket after Cloudflare authorization**

Run these commands with the management token available to Wrangler and the real zone ID in `CLOUDFLARE_ZONE_ID`:

```bash
npx wrangler r2 bucket create family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket cors set family-clinic-publications --file infra/r2/cors.json --jurisdiction eu
npx wrangler r2 bucket domain add family-clinic-publications --domain media.familyclinic.doctor --zone-id "$CLOUDFLARE_ZONE_ID" --min-tls 1.2 --jurisdiction eu
npx wrangler r2 bucket lock add family-clinic-publications publication-retention publications/ --retention-indefinite --jurisdiction eu
```

Verify:

```bash
npx wrangler r2 bucket info family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket cors list family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket domain list family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket lock list family-clinic-publications --jurisdiction eu
```

Expected: EU jurisdiction, the exact CORS rule, active custom domain, minimum TLS 1.2, and the `publications/` retention rule.

- [ ] **Step 8: Commit configuration and runbook**

```bash
git add package.json package-lock.json infra/r2/cors.json docs/publications-r2-runbook.md tests/publication-pipeline.test.mjs
git commit -m "ops: define EU R2 publications storage"
```

---

### Task 5: Upload immutable assets and generate the public manifest

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/publications/upload.mjs`
- Create: `src/_data/publication-assets.json`
- Modify: `tests/publication-pipeline.test.mjs`

**Interfaces:**
- Consumes: `.publication-work/prepared/<id>/<locale>/v1/metadata.json` and associated assets.
- Produces: `createR2Client(env): S3Client`.
- Produces: `buildPutObjectInput(asset): PutObjectCommandInput`.
- Produces: `uploadPreparedAssets({ client, preparedRoot, publicBaseUrl, publicationIds }): Promise<PublicationAssetManifest>`.
- Produces: `PublicationAssetManifest` consumed by the website plan.

- [ ] **Step 1: Install the exact S3 client**

Run: `npm install --save-dev --save-exact @aws-sdk/client-s3@3.1116.0`

- [ ] **Step 2: Write failing upload and manifest tests**

Use a fake S3 client whose `send(command)` records `command.input`. Assert:

- With `R2_ACCOUNT_ID=testaccount123`, the client endpoint is `https://testaccount123.eu.r2.cloudflarestorage.com` with region `auto`.
- Keys follow `publications/<id>/<locale>/v1/{cover.webp,preview.pdf,full.pdf}`.
- PDFs use `application/pdf`; covers use `image/webp`.
- Preview disposition is inline; complete disposition is attachment with `<id>-<locale>.pdf`.
- Every object uses `public, max-age=31536000, immutable` and `Metadata.sha256`.
- The manifest contains thirteen IDs, 39 editions, HTTPS URLs under `https://media.familyclinic.doctor`, positive sizes/page counts, cover dimensions, version `v1`, and matching hashes.
- Passing `publicationIds: ["enzymes"]` produces a three-edition pilot manifest and uploads only its nine objects.
- A pre-existing key with matching size/hash is skipped; a pre-existing key with different metadata aborts and is never overwritten.
- A failed upload prevents manifest replacement.

- [ ] **Step 3: Run the test and verify failure**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: FAIL because `scripts/publications/upload.mjs` does not exist.

- [ ] **Step 4: Implement environment validation and the R2 client**

Require nonempty `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`. Construct:

```js
new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.eu.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});
```

Never log credentials or the authenticated endpoint query.

- [ ] **Step 5: Implement immutable uploads**

Before each write, send `HeadObjectCommand`. If the key exists with the same `Metadata.sha256` and `ContentLength`, treat it as already published; if it differs, abort and require a new version prefix. Only missing keys receive `PutObjectCommand`, with the file read as a stream and these headers:

```js
{
  Bucket: "family-clinic-publications",
  Key: objectKey,
  Body: createReadStream(localPath),
  ContentType: kind === "cover" ? "image/webp" : "application/pdf",
  ContentDisposition: kind === "full"
    ? `attachment; filename="${id}-${locale}.pdf"`
    : kind === "preview" ? `inline; filename="${id}-${locale}-preview.pdf"` : undefined,
  CacheControl: "public, max-age=31536000, immutable",
  Metadata: { sha256 }
}
```

Refuse to upload when local size/hash differs from `metadata.json`, when the version is not `v1`, or when a duplicate key is planned.

- [ ] **Step 6: Generate the manifest only after all uploads succeed**

Build `src/_data/publication-assets.json` atomically from the successful upload set:

```js
const manifest = {
  schemaVersion: 1,
  publicBaseUrl: "https://media.familyclinic.doctor",
  publications: preparedPublications.map(({ id, editions }) => ({
    id,
    editions: Object.fromEntries(Object.entries(editions).map(([locale, edition]) => [locale, {
      version: "v1",
      textLayer: edition.textLayer,
      full: publicAsset(edition.full, `${id}-${locale}.pdf`),
      preview: publicAsset(edition.preview),
      cover: publicAsset(edition.cover)
    }]))
  }))
};
await writeJsonAtomic("src/_data/publication-assets.json", manifest);
```

`publicAsset` copies measured page counts, dimensions, sizes, and hashes and adds the exact `https://media.familyclinic.doctor/publications/<id>/<locale>/v1/<file>` URL. The committed file must contain all thirteen records and all three editions.

- [ ] **Step 7: Add and run the upload command**

Add:

```json
{
  "publications:upload": "node scripts/publications/upload.mjs"
}
```

Load `.env.publications` into the current shell without printing it. First publish the representative three-language pilot:

```bash
npm run publications:upload -- --publication enzymes --manifest .publication-work/pilot-manifest.json
```

Expected: nine successful immutable uploads and an ignored three-edition pilot manifest.

Check the English pilot directly before expanding the upload:

```bash
curl -sS -I -H 'Origin: https://www.familyclinic.doctor' https://media.familyclinic.doctor/publications/enzymes/en/v1/preview.pdf
curl -sS -D - -o /dev/null -H 'Origin: https://www.familyclinic.doctor' -H 'Range: bytes=0-1023' https://media.familyclinic.doctor/publications/enzymes/en/v1/preview.pdf
```

Expected: `200` with inline PDF/CORS/cache headers, then `206` with a valid `Content-Range`.

After the pilot header check succeeds, publish all prepared assets and write the complete manifest:

```bash
npm run publications:upload -- --all --manifest src/_data/publication-assets.json
```

Expected: 117 successful immutable object checks/uploads and a complete thirteen-publication manifest. Existing pilot keys must be byte-for-byte identical; otherwise abort instead of overwriting them.

- [ ] **Step 8: Run focused and full tests**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: PASS.

Run: `npm test`

Expected: all tests PASS.

- [ ] **Step 9: Commit code and manifest only**

```bash
git add package.json package-lock.json scripts/publications/upload.mjs src/_data/publication-assets.json tests/publication-pipeline.test.mjs
git commit -m "feat: publish immutable R2 publication assets"
```

---

### Task 6: Verify public delivery and enforce the binary boundary

**Files:**
- Modify: `package.json`
- Create: `scripts/publications/verify-r2.mjs`
- Modify: `tests/publication-pipeline.test.mjs`
- Modify: `docs/publications-r2-runbook.md`

**Interfaces:**
- Consumes: `src/_data/publication-assets.json`.
- Produces: `verifyPublishedAssets({ manifest, fetchImpl, origin }): Promise<void>`.
- Produces: npm command `publications:verify` that performs no writes.

- [ ] **Step 1: Write failing verifier tests**

Start a local Node HTTP server that implements one valid cover, preview, and complete object. Assert the verifier sends `Origin: https://www.familyclinic.doctor`, performs `HEAD` for all assets, performs `GET` with `Range: bytes=0-1023` for PDFs, accepts `206` only with a valid `Content-Range`, checks content length/type/disposition/cache/CORS/ETag, and reports the publication ID, locale, and asset kind on failure.

- [ ] **Step 2: Run the test and verify failure**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: FAIL because `scripts/publications/verify-r2.mjs` does not exist.

- [ ] **Step 3: Implement read-only remote verification**

Limit concurrent requests to four. A cover `HEAD` must return `200`; PDF `HEAD` must return `200`; PDF range requests must return `206`; `Access-Control-Allow-Origin` must equal the clinic origin; complete PDFs must be attachment; previews must be inline. Compare `Content-Length` with the manifest and `x-amz-meta-sha256` when exposed, while always retaining the committed SHA-256 as the integrity source of truth.

- [ ] **Step 4: Add the separate verification command**

```json
{
  "publications:verify": "node scripts/publications/verify-r2.mjs"
}
```

Do not add this network-dependent command to the offline `npm run verify` used by pull requests.

- [ ] **Step 5: Run local and live verification**

Run: `node --test tests/publication-pipeline.test.mjs`

Expected: PASS.

Run: `npm run publications:verify`

Expected: all 117 public assets and all 78 PDF range checks PASS.

Run: `npm run verify`

Expected: build, script checks, and all offline tests PASS.

- [ ] **Step 6: Verify Git contains no publication binary**

Run:

```bash
git status --short
git ls-files | rg '(^FC web site files|^\.publication-work/|\.(pdf|doc|docx)$)'
```

Expected: the first command may show only known unrelated user changes; the second command prints nothing.

- [ ] **Step 7: Commit the verifier and final runbook update**

```bash
git add package.json scripts/publications/verify-r2.mjs tests/publication-pipeline.test.mjs docs/publications-r2-runbook.md
git commit -m "test: verify public R2 publication delivery"
```
