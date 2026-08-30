import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

import { EXPECTED_HTML_ROUTES, outputPath, readOutput } from "./helpers/site.mjs";

const SITE_PHONE = "+212-641-745-441";
const PHONE_HREF_PATTERN = new RegExp(`href="tel:${SITE_PHONE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);

const HOME_AND_ABOUT_ROUTES = [
  "index.html", "about.html",
  "fr/index.html", "fr/about.html",
  "ar/index.html", "ar/about.html"
];

const HOME_ROUTES = ["index.html", "fr/index.html", "ar/index.html"];

test("every generated page has exactly one h1 and the logo is not a heading", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);
    const h1Count = (html.match(/<h1[\s>]/g) ?? []).length;
    assert.equal(h1Count, 1, `${route} has exactly one h1, found ${h1Count}`);
    assert.doesNotMatch(html, /<h1[^>]*header__logo/, `${route} logo is not the h1`);
  }
});

test("every page offers a skip link targeting the main region", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);
    assert.match(html, /<a href="#main-content" class="skip-link">/, `${route} has a skip link`);
    assert.match(html, /<main class="main" id="main-content">/, `${route} main region is addressable`);
  }
});

test("every page header exposes a call CTA with the clinic phone number", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);
    const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
    assert.match(header, PHONE_HREF_PATTERN, `${route} header has a tel CTA`);
  }
});

test("hero booking CTAs call the clinic instead of promising online booking", async () => {
  for (const route of HOME_AND_ABOUT_ROUTES) {
    const html = await readOutput(route);
    assert.doesNotMatch(html, /Book Appointment|Prendre rendez-vous|احجز موعداً/, `${route} keeps no false booking label`);
    const heroActions = html.match(/<div class="hero__actions">[\s\S]*?<\/div>/);
    assert.ok(heroActions, `${route} renders hero actions`);
    assert.match(heroActions[0], PHONE_HREF_PATTERN, `${route} hero CTA dials the clinic`);
  }
});

test("the homepage surfaces address, phone, and hours directly below the hero", async () => {
  const addressFragments = { "index.html": "Ouled Oujih", "fr/index.html": "Ouled Oujih", "ar/index.html": "أولاد أوجيه" };
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const band = html.match(/<section class="info-band"[\s\S]*?<\/section>/);
    assert.ok(band, `${route} renders an info band`);
    assert.match(band[0], PHONE_HREF_PATTERN, `${route} info band exposes the phone number`);
    assert.ok(band[0].includes(addressFragments[route]), `${route} info band shows the address`);
    assert.ok(band[0].includes("9:00"), `${route} info band shows opening hours`);
  }
});

test("published stylesheets no longer use the purple brand gradient", async () => {
  for (const file of ["styles.css", "about.css", "contact.css", "services.css", "localization.css", "publications.css"]) {
    const css = await readOutput(`assets/${file}`);
    assert.doesNotMatch(css, /#667eea|#764ba2/i, `${file} is free of the purple gradient`);
  }
});

test("stylesheets are driven by shared design tokens", async () => {
  const css = await readOutput("assets/styles.css");
  assert.match(css, /:root\s*{[^}]*--accent/, "styles.css defines color tokens");
  assert.match(css, /var\(--accent/, "styles.css consumes its own tokens");
  for (const file of ["about.css", "contact.css", "services.css", "publications.css"]) {
    const pageCss = await readOutput(`assets/${file}`);
    assert.match(pageCss, /var\(--/, `${file} consumes design tokens`);
  }
});

test("declared fonts are self-hosted and published", async () => {
  const css = await readOutput("assets/styles.css");
  assert.match(css, /@font-face/, "styles.css declares @font-face");

  const fontFiles = ["inter-latin.woff2", "cairo-arabic.woff2", "cairo-latin.woff2"];
  for (const file of fontFiles) {
    assert.ok(existsSync(outputPath(`assets/fonts/${file}`)), `assets/fonts/${file} is published`);
    assert.match(css, new RegExp(`url\\(["']?/assets/fonts/${file}["']?\\)`), `${file} is referenced`);
  }

  const localizationCss = await readOutput("assets/localization.css");
  assert.match(localizationCss, /Cairo/, "Arabic stack keeps Cairo");
  assert.doesNotMatch(localizationCss, /Noto Sans Arabic|Amiri|Tajawal/, "Arabic stack is trimmed to loaded faces");
});

test("every generated image declares intrinsic dimensions", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);
    const images = html.match(/<img\b[^>]*>/g) ?? [];
    assert.ok(images.length > 0, `${route} has images`);
    for (const image of images) {
      assert.match(image, /\bwidth="\d+"/, `${route} image missing width: ${image.slice(0, 90)}`);
      assert.match(image, /\bheight="\d+"/, `${route} image missing height: ${image.slice(0, 90)}`);
    }
  }
});

test("language auto-detection runs in the head before first paint with the existing guards", async () => {
  for (const route of ["index.html", "about.html", "services.html", "contact.html"]) {
    const html = await readOutput(route);
    const head = html.slice(0, html.indexOf("</head>"));
    assert.match(head, /<script>[\s\S]*userLanguageChoice[\s\S]*<\/script>/, `${route} head embeds the detector`);
    assert.match(head, /autoDetectDisabled/, `${route} head detector honors the opt-out`);
  }
});

test("localization.js keeps switcher behavior without runtime redirects", async () => {
  const js = await readOutput("assets/localization.js");
  assert.doesNotMatch(js, /window\.location\.(href|replace|assign)/, "localization.js performs no redirects");
});

test("FAQ answers are wired to their toggle buttons without clipping", async () => {
  for (const route of ["contact.html", "fr/contact.html", "ar/contact.html"]) {
    const html = await readOutput(route);
    const buttons = html.match(/<button class="faq-item__question"[^>]*>/g) ?? [];
    assert.ok(buttons.length >= 6, `${route} renders the FAQ list`);
    for (const button of buttons) {
      assert.match(button, /aria-controls="[^"]+"/, `${route} FAQ button controls its answer`);
    }
    const answers = html.match(/<div class="faq-item__answer"[^>]*>/g) ?? [];
    assert.equal(answers.length, buttons.length, `${route} answers match buttons`);
    for (const answer of answers) {
      assert.match(answer, /id="[^"]+"/, `${route} FAQ answer is addressable`);
    }
  }
  const contactCss = await readOutput("assets/contact.css");
  assert.doesNotMatch(contactCss, /max-height:\s*200px/, "FAQ answers are not clipped");
});

test("decorative emoji and chrome icons are hidden from assistive technology", async () => {
  const html = await readOutput("contact.html");
  const header = html.slice(html.indexOf("<header"), html.indexOf("</header>"));
  assert.match(header, /<svg[^>]*aria-hidden="true"/, "language switcher chevron is aria-hidden");
  const faqIcons = html.match(/<span class="faq-item__icon"[^>]*>/g) ?? [];
  assert.ok(faqIcons.length >= 6, "FAQ renders toggle icons");
  for (const icon of faqIcons) {
    assert.match(icon, /aria-hidden="true"/, "FAQ icon is aria-hidden");
  }
});

test("shared styles provide visible focus states", async () => {
  const css = await readOutput("assets/styles.css");
  assert.match(css, /:focus-visible/, "styles.css styles keyboard focus");
  assert.match(css, /\.skip-link/, "styles.css styles the skip link");
});
