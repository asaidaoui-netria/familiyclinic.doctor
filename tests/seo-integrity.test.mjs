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

const PUBLIC_BASE_URL = "https://www.familyclinic.doctor";

const CONTACT_TEMPLATE_PATHS = ["src/en/contact.njk", "src/fr/contact.njk", "src/ar/contact.njk"];

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

  if (!path) return sourcePath;

  return path.startsWith("/")
    ? resolve(OUTPUT_ROOT, `.${path}`)
    : resolve(dirname(sourcePath), path);
}

function fragmentTarget(htmlRoute, reference) {
  const hashIndex = reference.indexOf("#");

  if (hashIndex === -1) return null;

  const fragment = reference.slice(hashIndex + 1);

  if (!fragment) return null;

  return {
    target: referenceTarget(htmlRoute, reference),
    fragment: decodeURIComponent(fragment)
  };
}

test("each indexable page publishes one canonical URL and complete Open Graph metadata", async () => {
  for (const route of INDEXABLE_ROUTES) {
    const html = await readOutput(route.slice(1));
    const canonicalUrl = `${PUBLIC_BASE_URL}${route}`;
    const locale = route.startsWith("/fr/") ? "fr" : route.startsWith("/ar/") ? "ar" : "en";
    const copy = site.locales[locale];
    const canonicals = tagWithAttributes(html, "link", { rel: "canonical" });

    assert.equal(canonicals.length, 1, `${route} has one canonical URL`);
    assert.equal(attribute(canonicals[0], "href"), canonicalUrl, `${route} canonical URL uses the public site domain and retained route`);
    for (const property of ["og:title", "og:description"]) {
      const metadata = tagWithAttributes(html, "meta", { property });

      assert.equal(metadata.length, 1, `${route} has ${property}`);
      assert.ok(attribute(metadata[0], "content")?.trim(), `${route} has a populated ${property}`);
    }
    assert.equal(tagWithAttributes(html, "meta", { property: "og:url", content: canonicalUrl }).length, 1, `${route} has its canonical og:url`);
    assert.equal(tagWithAttributes(html, "meta", { property: "og:type", content: "website" }).length, 1, `${route} has website Open Graph type`);
    assert.equal(tagWithAttributes(html, "meta", { property: "og:site_name", content: copy.clinicName }).length, 1, `${route} has the localized Open Graph site name`);
    const ogLocale = { en: "en_US", fr: "fr_FR", ar: "ar_MA" }[locale];

    assert.equal(tagWithAttributes(html, "meta", { property: "og:locale", content: ogLocale }).length, 1, `${route} has its protocol-shaped Open Graph locale`);
    assert.equal(tagWithAttributes(html, "meta", { property: "og:image", content: `${PUBLIC_BASE_URL}/assets/images/optimized/clinic/clinic_entrance_desktop_800x400.jpg` }).length, 1, `${route} has the retained absolute Open Graph image`);
  }
});

test("each translated page publishes reciprocal language alternates and English x-default", async () => {
  for (const [route, en, fr, ar] of TRANSLATABLE_PAGES) {
    const html = await readOutput(route);

    for (const [locale, localizedRoute] of [["en", en], ["fr", fr], ["ar", ar], ["x-default", en]]) {
      assert.equal(
        tagWithAttributes(html, "link", { rel: "alternate", hreflang: locale, href: `${PUBLIC_BASE_URL}${localizedRoute}` }).length,
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
    assert.equal(data.address.streetAddress, copy.contact.addressLines[0]);
    assert.equal(data.address.addressLocality, copy.contact.addressLines[1]);
    assert.equal(data.address.postalCode, site.contact.postalCode);
    assert.equal(data.address.addressCountry, "MA");
  }
});

test("the 404 page is noindex and is not advertised in the sitemap", async () => {
  const notFound = await readOutput("404.html");
  const sitemap = await readFile(outputPath("sitemap.xml"), "utf8");

  assert.equal(tagWithAttributes(notFound, "meta", { name: "robots", content: "noindex, follow" }).length, 1);
  assert.equal(tagWithAttributes(notFound, "link", { rel: "alternate", hreflang: "fr" }).length, 0, "the English-only 404 has no unsupported French alternate");
  assert.equal(tagWithAttributes(notFound, "link", { rel: "alternate", hreflang: "ar" }).length, 0, "the English-only 404 has no unsupported Arabic alternate");
  assert.doesNotMatch(sitemap, /404\.html/);
});

test("the generated sitemap lists only the twelve canonical public routes", async () => {
  const sitemap = await readFile(outputPath("sitemap.xml"), "utf8");
  const locations = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

  assert.deepEqual(locations.sort(), INDEXABLE_ROUTES.map((route) => `${PUBLIC_BASE_URL}${route}`).sort());
  assert.doesNotMatch(sitemap, /blog/i);
  assert.match(sitemap, /https:\/\/www\.familyclinic\.doctor/);
});

test("robots allows crawling and advertises the canonical sitemap", async () => {
  const robots = await readFile(outputPath("robots.txt"), "utf8");

  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.match(robots, /^Sitemap: https:\/\/www\.familyclinic\.doctor\/sitemap\.xml$/m);
});

test("built HTML metadata and navigation links, sitemap, and robots omit blog URLs", async () => {
  const sitemap = await readFile(outputPath("sitemap.xml"), "utf8");
  const robots = await readFile(outputPath("robots.txt"), "utf8");

  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);
    const head = /<head\b[^>]*>[\s\S]*?<\/head>/i.exec(html)?.[0] ?? "";
    const links = tags(html, "a").map((tag) => attribute(tag, "href")).filter(Boolean);

    assert.doesNotMatch(head, /(?:href|content)=(?:"[^"]*blog|\'[^\']*blog)/i, `${route} head metadata has no blog URL`);
    assert.equal(links.some((href) => /(?:^|\/)blog(?:\/|$|[?#])/i.test(href)), false, `${route} navigation has no blog URL`);
  }

  assert.doesNotMatch(sitemap, /blog/i);
  assert.doesNotMatch(robots, /blog/i);
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

test("every generated local anchor fragment resolves to an id or named anchor in its target HTML", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);

    for (const href of tags(html, "a").map((tag) => attribute(tag, "href")).filter(Boolean)) {
      if (/^(?:mailto:|tel:|data:|https?:)/i.test(href)) continue;

      const target = fragmentTarget(route, href);

      if (!target) continue;

      assert.equal(target.target.startsWith(`${resolve(OUTPUT_ROOT)}/`), true, `${route} fragment stays inside _site: ${href}`);
      const targetHtml = await readFile(target.target, "utf8");
      assert.match(targetHtml, new RegExp(`\\b(?:id|name)=(?:"${target.fragment}"|'${target.fragment}')`), `${route} fragment resolves: ${href}`);
    }
  }
});

test("contact pages render the centralized localized contact data and retained routes", async () => {
  for (const [locale, route] of [["en", "contact.html"], ["fr", "fr/contact.html"], ["ar", "ar/contact.html"]]) {
    const html = await readOutput(route);
    const contact = site.locales[locale].contact;

    assert.ok(contact, `${locale} exposes localized contact data`);
    assert.ok(html.includes(`href="${site.contact.mapUrl}"`), `${route} uses the shared map URL`);
    assert.ok(html.includes(`href="tel:${site.contact.phone}"`), `${route} uses the shared phone route`);
    assert.ok(html.includes(`href="mailto:${site.contact.email}"`), `${route} uses the shared email route`);

    for (const line of contact.addressLines) assert.ok(html.includes(line), `${route} renders its centralized address line`);
    for (const { day, time } of contact.hours) {
      assert.ok(html.includes(day), `${route} renders its centralized opening-day label`);
      for (const value of time) assert.ok(html.includes(value), `${route} renders its centralized opening time`);
    }
  }
});

test("contact templates have one mutable phone source and render it in their FAQ copy", async () => {
  for (const [locale, route, templatePath] of [["en", "contact.html", CONTACT_TEMPLATE_PATHS[0]], ["fr", "fr/contact.html", CONTACT_TEMPLATE_PATHS[1]], ["ar", "ar/contact.html", CONTACT_TEMPLATE_PATHS[2]]]) {
    const template = await readFile(resolve(templatePath), "utf8");
    const html = await readOutput(route);

    assert.doesNotMatch(template, /\+212-641-745-441/, `${templatePath} does not duplicate the mutable clinic phone`);
    assert.match(template, /\{\{ site\.contact\.phone \}\}/, `${templatePath} renders the centralized phone in its FAQ answer`);
    assert.ok(html.includes(site.contact.phone), `${route} renders the centralized phone`);
    assert.ok(site.locales[locale].contact, `${locale} has localized contact copy`);
  }
});

test("built footers use the build-time current year and encode the attribution URL", async () => {
  const year = String(new Date().getFullYear());
  const attribution = "https://netria.dev?utm_source=familyclinic&amp;utm_medium=website&amp;utm_campaign=footer_attribution";

  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);

    assert.ok(html.includes(`© ${year}`), `${route} has the build-time copyright year`);
    assert.ok(html.includes(`href="${attribution}"`), `${route} encodes attribution query separators`);
    assert.equal(attribution.replaceAll("&amp;", "&"), "https://netria.dev?utm_source=familyclinic&utm_medium=website&utm_campaign=footer_attribution");
  }
});
