import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import test from "node:test";

import site from "../src/_data/site.js";
import { EXPECTED_HTML_ROUTES, OUTPUT_ROOT, outputPath, readOutput } from "./helpers/site.mjs";

const INDEXABLE_ROUTES = [
  "/index.html", "/about.html", "/services.html", "/contact.html",
  "/fr/index.html", "/fr/about.html", "/fr/services.html", "/fr/contact.html",
  "/ar/index.html", "/ar/about.html", "/ar/services.html", "/ar/contact.html"
];

const TRANSLATABLE_PAGES = [
  ["index.html", "/index.html", "/fr/index.html", "/ar/index.html"],
  ["about.html", "/about.html", "/fr/about.html", "/ar/about.html"],
  ["services.html", "/services.html", "/fr/services.html", "/ar/services.html"],
  ["contact.html", "/contact.html", "/fr/contact.html", "/ar/contact.html"],
  ["fr/index.html", "/index.html", "/fr/index.html", "/ar/index.html"],
  ["fr/about.html", "/about.html", "/fr/about.html", "/ar/about.html"],
  ["fr/services.html", "/services.html", "/fr/services.html", "/ar/services.html"],
  ["fr/contact.html", "/contact.html", "/fr/contact.html", "/ar/contact.html"],
  ["ar/index.html", "/index.html", "/fr/index.html", "/ar/index.html"],
  ["ar/about.html", "/about.html", "/fr/about.html", "/ar/about.html"],
  ["ar/services.html", "/services.html", "/fr/services.html", "/ar/services.html"],
  ["ar/contact.html", "/contact.html", "/fr/contact.html", "/ar/contact.html"]
];

function attribute(tag, name) {
  return new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i").exec(tag)?.[1] ?? new RegExp(`\\b${name}=(?:"([^"]*)"|'([^']*)')`, "i").exec(tag)?.[2];
}

function tags(html, tagName) {
  return html.match(new RegExp(`<${tagName}\\b[^>]*>`, "gi")) ?? [];
}

function tagWithAttributes(html, tagName, expected) {
  return tags(html, tagName).filter((tag) => Object.entries(expected).every(([name, value]) => attribute(tag, name) === value));
}

function srcsetCandidates(srcset) {
  return srcset.split(",").map((candidate) => candidate.trim().split(/\s+/, 1)[0]).filter(Boolean);
}

function localReferences(html) {
  const references = [];

  for (const tag of tags(html, "[a-z][a-z0-9-]*")) {
    for (const name of ["href", "src"]) {
      const value = attribute(tag, name);
      if (value) references.push(value);
    }

    const srcset = attribute(tag, "srcset");
    if (srcset) references.push(...srcsetCandidates(srcset));
  }

  return references.filter((value) => !/^(?:#|mailto:|tel:|data:|https?:)/i.test(value));
}

function referenceTarget(htmlRoute, reference) {
  const path = reference.split(/[?#]/, 1)[0];
  const sourcePath = outputPath(htmlRoute);

  return path.startsWith("/")
    ? resolve(OUTPUT_ROOT, `.${path}`)
    : resolve(dirname(sourcePath), path);
}

test("each indexable page publishes one canonical URL and complete Open Graph metadata", async () => {
  for (const route of INDEXABLE_ROUTES) {
    const html = await readOutput(route.slice(1));
    const canonicalUrl = `${site.url}${route}`;
    const locale = route.startsWith("/fr/") ? "fr" : route.startsWith("/ar/") ? "ar" : "en";
    const copy = site.locales[locale];

    assert.equal(tagWithAttributes(html, "link", { rel: "canonical", href: canonicalUrl }).length, 1, `${route} has one canonical URL`);
    for (const property of ["og:title", "og:description"]) {
      const metadata = tagWithAttributes(html, "meta", { property });

      assert.equal(metadata.length, 1, `${route} has ${property}`);
      assert.ok(attribute(metadata[0], "content")?.trim(), `${route} has a populated ${property}`);
    }
    assert.equal(tagWithAttributes(html, "meta", { property: "og:url", content: canonicalUrl }).length, 1, `${route} has its canonical og:url`);
    assert.equal(tagWithAttributes(html, "meta", { property: "og:type", content: "website" }).length, 1, `${route} has website Open Graph type`);
    assert.equal(tagWithAttributes(html, "meta", { property: "og:site_name", content: copy.clinicName }).length, 1, `${route} has the localized Open Graph site name`);
    assert.equal(tagWithAttributes(html, "meta", { property: "og:locale", content: locale }).length, 1, `${route} has its Open Graph locale`);
  }
});

test("each translated page publishes reciprocal language alternates and English x-default", async () => {
  for (const [route, en, fr, ar] of TRANSLATABLE_PAGES) {
    const html = await readOutput(route);

    for (const [locale, localizedRoute] of [["en", en], ["fr", fr], ["ar", ar], ["x-default", en]]) {
      assert.equal(
        tagWithAttributes(html, "link", { rel: "alternate", hreflang: locale, href: `${site.url}${localizedRoute}` }).length,
        1,
        `${route} has its ${locale} alternate`
      );
    }
  }
});

test("every HTML page has valid LocalBusiness JSON-LD backed by clinic data", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);
    const jsonLdTags = tags(html, "script").filter((tag) => attribute(tag, "type") === "application/ld+json");
    const jsonLd = jsonLdTags[0];
    const start = jsonLd ? html.indexOf(">", html.indexOf(jsonLd)) + 1 : -1;
    const end = start >= 0 ? html.indexOf("</script>", start) : -1;

    assert.notEqual(start, -1, `${route} has JSON-LD`);
    assert.notEqual(end, -1, `${route} closes JSON-LD`);
    assert.equal(jsonLdTags.length, 1, `${route} has exactly one JSON-LD declaration`);
    const data = JSON.parse(html.slice(start, end));
    const locale = route.startsWith("fr/") ? "fr" : route.startsWith("ar/") ? "ar" : "en";
    const copy = site.locales[locale];

    assert.equal(data["@context"], "https://schema.org");
    assert.equal(data["@type"], "LocalBusiness");
    assert.equal(data.name, copy.clinicName);
    assert.equal(data.url, site.url);
    assert.equal(data.telephone, site.contact.phone);
    assert.equal(data.address["@type"], "PostalAddress");
    assert.equal(data.address.streetAddress, copy.footer.addressLines[0]);
    assert.equal(data.address.addressLocality, copy.footer.addressLines[1]);
    assert.equal(data.address.postalCode, site.contact.postalCode);
    assert.equal(data.address.addressCountry, "MA");
  }
});

test("the 404 page is noindex and is not advertised in the sitemap", async () => {
  const notFound = await readOutput("404.html");
  const sitemap = await readFile(outputPath("sitemap.xml"), "utf8");

  assert.equal(tagWithAttributes(notFound, "meta", { name: "robots", content: "noindex, follow" }).length, 1);
  assert.doesNotMatch(sitemap, /404\.html/);
});

test("the generated sitemap lists only the twelve canonical public routes", async () => {
  const sitemap = await readFile(outputPath("sitemap.xml"), "utf8");
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.deepEqual(locations.sort(), INDEXABLE_ROUTES.map((route) => `${site.url}${route}`).sort());
  assert.doesNotMatch(sitemap, /blog/i);
  assert.match(sitemap, /https:\/\/www\.familyclinic\.doctor/);
});

test("robots allows crawling and advertises the canonical sitemap", async () => {
  const robots = await readFile(outputPath("robots.txt"), "utf8");

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/www\.familyclinic\.doctor\/sitemap\.xml$/m);
});

test("every generated local href, src, and srcset reference resolves inside the site output", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);

    for (const reference of localReferences(html)) {
      const target = referenceTarget(route, reference);
      assert.equal(target.startsWith(`${resolve(OUTPUT_ROOT)}/`), true, `${route} reference stays inside _site: ${reference}`);
      assert.equal(existsSync(target), true, `${route} reference exists: ${reference} -> ${relative(OUTPUT_ROOT, target)}`);
    }
  }
});
