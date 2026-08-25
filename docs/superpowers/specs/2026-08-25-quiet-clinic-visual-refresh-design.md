# Quiet Clinic Visual Refresh — Design Spec

Date: 2026-08-25
Status: approved (brainstormed with visual mockups; direction and layouts confirmed by user)
Predecessor: `docs/superpowers/specs/2026-08-25-design-language-trust-pass-design.md`

## Context

The site completed a trust/design-language pass (tokens, self-hosted Inter/Cairo, phone-first
CTAs, accessibility, performance contracts). The user now wants a visual refresh toward
**simplicity and modernity**, including restructured page layouts. During brainstorming the user:

- put everything on the table (palette, typography, layout) — only content, trilingual
  structure (EN/FR/AR), and the phone-first strategy are fixed
- chose the mood: **calm & clinical-minimal**
- chose imagery: **typographic hero, minimal imagery** (no big stock photos)
- allowed **free restructuring** of page sections as long as all information survives
- selected direction **A · Quiet Clinic** from three mockup candidates
- approved the homepage structure and the Services/About/Contact layouts

## Design Direction: Quiet Clinic

Pure white surfaces, ink text, one clinical-blue accent, hairline borders instead of shadows,
flat cards, left-aligned typographic heroes. Reads precise, clean, trustworthy.

### Design system

| Token | Value | Use |
|---|---|---|
| `--surface` | `#ffffff` | page and card background |
| `--surface-soft` | `#f8fafc` | panels, CTA bands, map placeholder |
| `--surface-tint` | `#eff6ff` | icon chips, subtle highlights |
| `--ink` | `#0f172a` | headings, body |
| `--ink-soft` | `#475569` | secondary text |
| `--ink-faint` | `#94a3b8` / `#64748b` | labels, captions |
| `--accent` | `#1d4ed8` | primary CTA, links, keylines, active states |
| `--hairline` | `#e2e8f0` | borders, section dividers |
| `--radius-card` | `10px` | cards, inputs |
| `--radius-pill` | `999px` | header call button, nav CTA |

Rules:

- **Depth:** hairline borders only. No card shadows, no gradients anywhere.
- **Type:** Inter (latin) / Cairo (arabic) — already self-hosted, unchanged. Headings large
  with tight letter-spacing; section eyebrows are numbered uppercase micro-labels
  (`01 — SERVICES`) in `--ink-faint`, with `--accent` allowed for hero eyebrow only.
- **Shape:** cards 10px radius; pills reserved for header call CTA and language toggle.
- **Icons:** simple unicode/glyph marks inside `--surface-tint` chips (no emoji-heavy cards).
- **Motion:** hover transitions ≤ 150ms on color/transform only; honor `prefers-reduced-motion`.
- **No purple/gradient regressions:** `#667eea`, `#764ba2`, and gradient heroes stay removed.

### Shared chrome

- **Header:** logo mark + wordmark, nav links, persistent **call pill** (`tel:+212-641-745-441`,
  localized label) on the right; hairline bottom border; sticky.
- **Footer:** keep the current four sections (logo/description, quick links, services links,
  contact info) and Netria credit — restyled flat with hairlines, no content changes.
- **404:** same chrome + big typographic "Page not found" (per locale), existing error links
  kept, plus a call CTA.

## Page Layouts

All pages: white background, left-aligned content in a centered max-width container,
hairline section separators. The numbered eyebrow system (`01 — …`) is used on the homepage;
inner pages get a single accent eyebrow above their h1.

### Homepage

1. Typographic hero: accent micro-label (`KENITRA · MOROCCO`), large headline with one
   accent-colored line, one sub-line, dual CTAs — `Call to Book` (primary, `tel:`) and
   `Our services` (ghost anchor). **No background photo.**
2. Info band directly under hero: three hairline-separated columns — Address (Maps link),
   Phone (`tel:`, `dir="ltr"` in AR), Hours.
3. `01 — Services`: 3 featured flat bordered cards (Family Medicine, Holistic Consultations,
   Quantum Scan — icon chip, title, one-liner, arrow link) + "View all services" button.
   The other 6 services stay discoverable via the services page and footer links.
4. `02 — About the clinic`: the existing about-preview text (serving since 2021) beside the
   existing clinic photo, + "Learn more about us" link.
5. `03 — Your care team`: 2 flat cards (Dr. Said-Alaoui, Mrs. Safae) with round photo, name,
   role, one-line bio, + "Meet our full team" link to `about.html#team`.
6. `04 — Visit us`: address line + `Open in Maps` button + hours note + link to the contact
   page for directions.
7. Final CTA band on `--surface-soft`: short line + call button with full number.

Removed: dark hero photo background, per-service photo cards (9 image-heavy cards become
3 typographic cards), gradient section headers, card shadows. No section content is lost —
everything removed from the homepage exists in full on its own page.

### Services

- Page intro: eyebrow (`OUR SERVICES`) + h1 + existing intro text (no gradient hero).
- Keep the sidebar anchor navigation (sticky on desktop) and all 9 detailed service articles
  with their full copy (description, approach, includes-list).
- Restyle: flat hairline article cards, accent titles; each article's CTA
  becomes a primary `tel:` button (localized), with the existing `contact.html` button kept
  as secondary.
- Bottom guidance band: "Not sure which service fits? Call …" (localized).

### About

- Typographic hero (eyebrow + h1 + existing tagline/description + call CTA); the hero photo
  moves into the mission section or is dropped.
- `01 — Mission & Vision`: existing text; the three feature blocks keep their copy but emoji
  headings become icon chips (`aria-hidden` glyph + text).
- `02 — Your care team`: keep both detailed profiles (`#team`, `#dr-said-alaoui` anchors
  preserved) restyled as flat cards.
- `03 — Our values`: keep all four value cards, restyled flat with keyline accents.
- Closing CTA band.

### Contact

- Typographic intro: eyebrow + h1 + existing description.
- Contact details block (existing `contact-details.njk` include: address, phone, email,
  languages, full weekly hours) restyled with hairlines; phone block gets the accent top rule.
- Map: keep the existing Google Maps **iframe embed** (functional today; a static map would
  require an API key), framed with a hairline border, beside the existing "Getting Here"
  directions text.
- `01 — Common questions`: FAQ accordion (existing JS/wiring kept) restyled as ruled rows with
  accent `+` indicators.
- Bottom call band.

### RTL parity

Arabic pages mirror all layouts (existing `dir="rtl"` + `localization.css` approach kept).
Phone numbers keep `dir="ltr"`. Cairo remains the Arabic face.

## Content preservation (no-loss rule)

Every existing piece of content survives in all three locales: all 9 services with their full
descriptions/approach/includes copy, both team member profiles, the 4 values, the 3 mission
features, FAQ items (6), address/phone/email/hours, map embed and directions, footer sections.
Only presentation and section placement change. Localized CTA labels from `src/_data/site.js`
remain the source of truth; no new marketing claims invented (homepage copy reuses existing
about-preview/hero wording).

## Implementation approach

1. **Rewrite the presentation layer** (not an incremental re-skin): rebuild `assets/styles.css`
   around the new token set, then rewrite `assets/about.css`, `assets/contact.css`,
   `assets/services.css`, `assets/localization.css` against the same tokens. Delete dead
   gradient/shadow/old-card CSS.
2. **Restructure templates**: `src/en|fr|ar/index.njk` (new section order), `header.njk`
   (call pill), `footer.njk` (patient-guide links), services/about/contact pages, `404.njk`.
3. **Hero photo removal**: drop the home hero background image usage; keep doctor photos
   (with existing width/height attributes).
4. **JS**: keep `script.js`, `contact.js`, `services.js`, `localization.js` behavior; adjust
   selectors only if markup changes require it.
5. **Build config**: unchanged (Eleventy, fonts passthrough).

## Testing

- All existing contracts must keep passing (`npm run verify`): one `h1` per page, skip link,
  header `tel:` CTA on every page, honest CTA labels, info band, no purple, tokens present,
  fonts published, image `width`/`height`, hero eager/fetchpriority, inline language detector,
  no redirects in `localization.js`, FAQ `aria-controls`/`id` wiring, `aria-hidden` decorations,
  `:focus-visible`.
- New design-language contracts (added in `tests/design-trust.test.mjs` or a new design test
  file, written failing first):
  - no `box-shadow` and no `linear-gradient` in any stylesheet under `assets/*.css`
    (sole exception: the mobile-nav dropdown shadow injected by `script.js`, which is
    functional chrome, not card styling)
  - accent/hairline tokens consumed by page CSS
  - homepage sections present in the approved order (eyebrow markers `01`–`04`)
  - footer keeps quick links, all 9 service links, and contact info on all locales
  - services page contains all 9 service anchors × 3 locales, each with a `tel:` CTA
  - 404 contains localized not-found heading + call CTA
- Manual spot-checks: `npm run serve`, inspect EN/FR/AR home, services, about, contact, 404,
  mobile header, RTL mirroring, focus states.

## Out of scope

- Owner-dependent content: testimonials, license numbers, pricing/insurance, emergency
  guidance, Gmail→domain email.
- New fonts (revisitable later; would add payload).
- Booking form / WhatsApp (user confirmed phone-only).
- Any change to contact details, opening hours, or medical claims.
