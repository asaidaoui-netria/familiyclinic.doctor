# Arabic publications

Extend the existing HTML library to Arabic, with the same complete collection, category structure, and reading features.

## Constraints

- Translate all 56 articles in full into Modern Standard Arabic from the normalized French originals. Preserve every block, list item and level, table cell, figure, number, and qualification; do not summarize or invent a clinical review.
- Use the supplied Arabic cookbook edition for the preface and 20 selected recipes. Keep content provenance in data.
- Keep previous UI removals: no guidance panel, reading-order count, sources/review panel, or article counts on the publications landing page.
- Arabic pages must have RTL reading/navigation, localized visible labels, ordinary HTML links, complete bodies without JavaScript, canonical URLs, reciprocal language alternates, and sitemap entries only for actual published content.
- Preserve English and French behavior and the existing uncommitted changes. Work locally on feat/publications-html; no commit, push, or deployment.

## Tasks

- [x] 1. Translate A00–A15 and D05–D06 to Arabic.
- [x] 2. Translate B01–B09 and C00–C07 to Arabic.
- [x] 3. Translate C08–C24 and D01–D04 to Arabic.
- [x] 4. Localize routes, templates, category copy, RTL typography/navigation, and fragment handling; add Arabic cookbook content.
- [x] 5. Verify complete content parity, metadata/navigation, responsive browser behavior, and regression checks; independently review the result.

## Execution notes

The existing category design is approved. Arabic uses the same stable topic slugs under /ar/publications/. Article translations retain the French source hash and record AI translation provenance; the book records its Arabic source edition. Full article translations run in independent file groups alongside integration work.

User steering: French appeared missing. All 56 French articles and the directory were verified present; the cookbook lacked French routes and a French menu option. Task 4 also includes importing the supplied French preface and 20 recipes, adding the French cover, and offering French throughout the book branch.

| Tasks | Shared interface | Resolution |
| --- | --- | --- |
| 1, 2, 3 | Article JSON block schema | Disjoint article IDs; use identical French structure and Arabic language field. |
| 1–3, 4 | Published Arabic editions | Templates accept ar only when a complete edition exists; no indexing drafts. |
| 4, 5 | Generated pages and browser tests | Build after stable edits; final verification after all translations finish. |
| 1–5 | Scope and validation | Complete Arabic content and UI; retain prior content/UI decisions. |
