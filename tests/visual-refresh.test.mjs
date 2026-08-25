import assert from "node:assert/strict";
import test from "node:test";

import { readOutput } from "./helpers/site.mjs";

const SITE_PHONE = "+212-641-745-441";
const PHONE_HREF = new RegExp(`href="tel:${SITE_PHONE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);

const HOME_ROUTES = ["index.html", "fr/index.html", "ar/index.html"];
const SERVICES_ROUTES = ["services.html", "fr/services.html", "ar/services.html"];
const PAGE_CSS = ["styles.css", "about.css", "contact.css", "services.css", "localization.css"];

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
  for (const file of ["about.css", "contact.css", "services.css"]) {
    const css = await readOutput(`assets/${file}`);
    assert.match(css, /var\(--(accent|ink|hairline|surface)/, `${file} consumes shared tokens`);
  }
});

test("the homepage hero is typographic", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const hero = html.match(/<section class="hero"[\s\S]*?<\/section>/);
    assert.ok(hero, `${route} renders a hero`);
    assert.match(hero[0], /class="hero__eyebrow"/, `${route} hero has an eyebrow`);
    assert.doesNotMatch(hero[0], /<img/, `${route} hero has no image`);
  }
});

test("homepage sections follow the approved order", async () => {
  for (const route of HOME_ROUTES) {
    const html = await readOutput(route);
    const order = ["services", "about", "team", "visit"].map((name) => html.indexOf(`data-section="${name}"`));
    assert.ok(order.every((index) => index > -1), `${route} renders all four numbered sections`);
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

test("services pages keep all nine detailed services, each with a phone CTA", async () => {
  for (const route of SERVICES_ROUTES) {
    const html = await readOutput(route);
    const articles = html.split('class="service-detail"');
    assert.equal(articles.length, 10, `${route} renders nine service articles`);
    for (const anchor of SERVICE_ANCHORS[route]) {
      assert.ok(html.includes(`id="${anchor}"`), `${route} keeps anchor ${anchor}`);
    }
    for (let i = 1; i < articles.length; i++) {
      assert.match(articles[i], PHONE_HREF, `${route} service article ${i} exposes a tel CTA`);
    }
  }
});

test("the 404 page pairs the not-found heading with a call CTA", async () => {
  const html = await readOutput("404.html");
  assert.match(html, /<h1 class="error-title">/, "404 heading is an h1");
  assert.match(html, PHONE_HREF, "404 offers a call CTA");
});
