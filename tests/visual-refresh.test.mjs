import assert from "node:assert/strict";
import test from "node:test";

import { readOutput } from "./helpers/site.mjs";

const SITE_PHONE = "+212-641-745-441";
const PHONE_HREF = new RegExp(`href="tel:${SITE_PHONE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);

const HOME_ROUTES = ["index.html", "fr/index.html", "ar/index.html"];
const SERVICES_ROUTES = ["services.html", "fr/services.html", "ar/services.html"];
const PAGE_CSS = ["styles.css", "about.css", "contact.css", "services.css", "localization.css", "publications.css"];

const SERVICE_ANCHORS = {
  "services.html": ["family-medicine", "holistic-consultations", "quantum-scan", "naturopathy", "hijamah", "physiotherapy", "dermatology", "judiciary-medical-expertise", "weight-loss"],
  "fr/services.html": ["medecine-familiale", "consultations-holistiques", "quantum-scan", "naturopathie", "hijamah", "physiotherapie", "dermatologie", "expertise-medicale-judiciaire", "perte-de-poids"],
  "ar/services.html": ["family-medicine", "holistic-consultations", "quantum-scan", "naturopathy", "hijamah", "physiotherapy", "dermatology", "judiciary-medical-expertise", "weight-loss"]
};

test("published stylesheets contain no shadows and no gradients", async () => {
  for (const file of PAGE_CSS) {
    const css = await readOutput(`assets/${file}`);
    assert.doesNotMatch(css, /box-shadow/i, `${file} has no box-shadow`);
    assert.doesNotMatch(css, /linear-gradient|radial-gradient/i, `${file} has no gradient fills`);
  }
});

test("styles.css defines the Quiet Clinic token set", async () => {
  const css = await readOutput("assets/styles.css");
  for (const token of ["--surface:", "--surface-soft:", "--surface-tint:", "--ink:", "--accent:", "--hairline:", "--radius-card:"]) {
    assert.ok(css.includes(token), `styles.css defines ${token}`);
  }
  assert.match(css, /var\(--accent\)/, "styles.css consumes the accent token");
});

test("page stylesheets consume the shared Quiet Clinic tokens", async () => {
  for (const file of ["about.css", "contact.css", "services.css", "publications.css"]) {
    const css = await readOutput(`assets/${file}`);
    assert.match(css, /var\(--(accent|ink|hairline|surface)/, `${file} consumes shared tokens`);
  }
});

test("phone headers hide the wordmark and expand languages inside the mobile menu", async () => {
  const css = await readOutput("assets/styles.css");
  const localizationCss = await readOutput("assets/localization.css");
  const phoneStart = css.indexOf("@media (max-width: 768px)");
  const phoneEnd = css.indexOf("@media (max-width: 480px)", phoneStart);
  const phoneCss = css.slice(phoneStart, phoneEnd);

  assert.ok(phoneStart >= 0 && phoneEnd > phoneStart);
  assert.match(phoneCss, /\.header__logo-text\s*{[^}]*display:\s*none/s);
  assert.match(phoneCss, /\.nav--open \.language-switcher\s*{[^}]*width:\s*100%/s);
  assert.match(phoneCss, /\.nav--open \.language-switcher__toggle\s*{[^}]*width:\s*100%/s);
  assert.match(phoneCss, /\.nav--open \.language-switcher__menu\s*{[^}]*position:\s*static[^}]*display:\s*none/s);
  assert.match(phoneCss, /\.nav--open \.language-switcher__menu\.show\s*{[^}]*display:\s*block/s);
  assert.match(localizationCss, /\[dir="rtl"\] \.nav--open \.language-switcher\s*{[^}]*margin:\s*1rem 0 0/s);
});

test("publication styles cover responsive, accessible viewer states", async () => {
  const css = await readOutput("assets/publications.css");

  assert.match(css, /\.publication-grid\s*{[^}]*display:\s*grid/s);
  assert.match(css, /@media\s*\(max-width:\s*768px\)/);
  assert.match(css, /\.publication-grid\s*{[^}]*grid-template-columns:\s*1fr/s);
  assert.match(css, /\.publication[^}]*:focus-visible/);
  assert.match(css, /\[hidden\]/);
  assert.doesNotMatch(css, /\[dir=["']?rtl["']?\][^{]*\.publication-viewer(?:__pagination|__tools|__page-count)/);
  assert.match(css, /\.publication-viewer__pagination--rtl\s*{[^}]*flex-direction:\s*row-reverse/s);
  assert.match(css, /\.publication-viewer__status/);
  assert.match(css, /\.publication-viewer__error/);
  assert.match(css, /\.publication-viewer[^}]*\.textLayer/);
  assert.match(css, /\.publication-viewer:fullscreen/);
  assert.match(css, /\.publication-viewer:fullscreen\s*{[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\)/s);
  assert.match(css, /\.publication-viewer__toolbar button\s*{[^}]*min-width:\s*44px[^}]*min-height:\s*44px/s);
});

test("phone publication cards form one cover-only thumbnail column", async () => {
  const css = await readOutput("assets/publications.css");
  const phoneStart = css.indexOf("@media (max-width: 560px)");
  const phoneEnd = css.indexOf("@media (prefers-reduced-motion", phoneStart);
  const phoneCss = css.slice(phoneStart, phoneEnd);

  assert.ok(phoneStart >= 0 && phoneEnd > phoneStart);
  assert.match(
    phoneCss,
    /\.publication-grid\s*{[^}]*grid-template-columns:\s*1fr/s,
  );
  assert.match(
    phoneCss,
    /\.publication-card\s*{[^}]*width:\s*min\(100%,\s*12rem\)/s,
  );
  assert.match(
    phoneCss,
    /\.publication-card__body\s*{[^}]*display:\s*none/s,
  );
  assert.match(
    phoneCss,
    /\.publication-card__cover\s*{[^}]*height:\s*auto/s,
  );
});

test("the homepage hero is typographic", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/);
    assert.ok(hero, `${route} renders a hero`);
    assert.doesNotMatch(hero[0], /<img/, `${route} hero has no image`);
  }
});

test("homepage sections follow the approved order", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const order = ["services", "about", "team"].map((name) => html.indexOf(`data-section="${name}"`));
    assert.ok(order.every((index) => index > -1), `${route} renders all three numbered sections`);
    for (let i = 1; i < order.length; i++) {
      assert.ok(order[i] > order[i - 1], `${route} keeps the approved section order`);
    }
  }
});

test("the homepage features exactly three service cards", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    assert.equal((html.match(/class="featured-card"/g) ?? []).length, 3, `${route} shows three featured cards`);
  }
});

test("the footer keeps quick links, nine service links, and contact details", async () => {
  const anchorsByRoute = {
    "index.html": SERVICE_ANCHORS["services.html"],
    "fr/index.html": SERVICE_ANCHORS["fr/services.html"],
    "ar/index.html": SERVICE_ANCHORS["ar/services.html"]
  };
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const footer = html.slice(html.indexOf("<footer"), html.indexOf("</footer>"));
    for (const anchor of anchorsByRoute[route]) {
      assert.ok(footer.includes(`#${anchor}`), `${route} footer links to ${anchor}`);
    }
    assert.match(footer, PHONE_HREF, `${route} footer keeps the phone number`);
    assert.ok(footer.includes("https://maps.app.goo.gl/sPxKYDMUdsN9dVV2A"), `${route} footer keeps the map link`);
  }
});

test("services pages keep all nine detailed services", async () => {
  for (const route of SERVICES_ROUTES) {
    const html = await readOutput(route);
    const articles = html.split('class="service-detail"');
    assert.equal(articles.length, 10, `${route} renders nine service articles`);
    for (const anchor of SERVICE_ANCHORS[route]) {
      assert.ok(html.includes(`id="${anchor}"`), `${route} keeps anchor ${anchor}`);
    }
  }
});

test("the 404 page pairs the not-found heading with a call CTA", async () => {
  const html = await readOutput("404.html");
  assert.match(html, /<h1 class="error-title">/, "404 heading is an h1");
  assert.match(html, PHONE_HREF, "404 offers a call CTA");
});
