import assert from "node:assert/strict";
import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

import {
  EXPECTED_HTML_ROUTES,
  OUTPUT_ROOT,
  PUBLICATION_ROUTES,
  PUBLICATION_SLUGS,
  outputPath,
  readOutput
} from "./helpers/site.mjs";

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return htmlFiles(path);
    }

    return entry.isFile() && entry.name.endsWith(".html") ? [relative(OUTPUT_ROOT, path)] : [];
  }));

  return files.flat();
}

test("the generated site contains exactly the retained HTML routes", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    assert.equal(existsSync(outputPath(route)), true, `the generated ${route} exists`);
  }

  assert.deepEqual((await htmlFiles(OUTPUT_ROOT)).sort(), [...EXPECTED_HTML_ROUTES].sort());
});

test("Arabic and French generated pages expose their correct document language direction", async () => {
  for (const route of EXPECTED_HTML_ROUTES.filter((path) => path.startsWith("ar/"))) {
    assert.match(await readOutput(route), /<html lang="ar" dir="rtl">/);
  }

  for (const route of EXPECTED_HTML_ROUTES.filter((path) => path.startsWith("fr/"))) {
    const html = await readOutput(route);

    assert.match(html, /<html lang="fr">/);
    assert.doesNotMatch(html, /dir="rtl"/);
  }
});

test("each translatable page links to its English, French, and Arabic equivalent", async () => {
  const localizedRoutes = [
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

  for (const [route, ...languageUrls] of localizedRoutes) {
    const html = await readOutput(route);

    for (const languageUrl of languageUrls) {
      assert.match(html, new RegExp(`<a href="${languageUrl}" data-lang="(?:en|fr|ar)"`));
    }
  }
});

test("each language selector follows the navigation links inside the menu", async () => {
  for (const route of EXPECTED_HTML_ROUTES.filter((path) => path !== "404.html")) {
    const html = await readOutput(route);
    const header = html.match(/<header class="header">[\s\S]*?<\/header>/)?.[0];
    const nav = header?.match(/<nav class="nav"[\s\S]*?<\/nav>/)?.[0];

    assert.ok(header, `${route} has a header`);
    assert.ok(nav, `${route} has primary navigation`);
    assert.equal((header.match(/class="language-switcher"/g) ?? []).length, 1);
    assert.match(nav, /<\/ul>\s*<div class="language-switcher">/);
  }
});

test("retained pages use shared chrome without Blog links", async () => {
  for (const route of EXPECTED_HTML_ROUTES) {
    const html = await readOutput(route);

    assert.equal((html.match(/<header class="header">/g) ?? []).length, 1, `${route} has one header`);
    assert.equal((html.match(/<main\b/gi) ?? []).length, 1, `${route} has one main`);
    assert.equal((html.match(/<footer class="footer">/g) ?? []).length, 1, `${route} has one footer`);
    assert.doesNotMatch(html, /href="(?:\/blog|blog\/)[^"]*"|>\s*(?:Blog|المدونة)\s*<\/a>/i);
  }
});

test("retained navigation marks the active page", async () => {
  const activeRoutes = [
    ["index.html", "/index.html"], ["about.html", "/about.html"], ["services.html", "/services.html"], ["contact.html", "/contact.html"],
    ["fr/index.html", "/fr/index.html"], ["fr/about.html", "/fr/about.html"], ["fr/services.html", "/fr/services.html"], ["fr/contact.html", "/fr/contact.html"],
    ["ar/index.html", "/ar/index.html"], ["ar/about.html", "/ar/about.html"], ["ar/services.html", "/ar/services.html"], ["ar/contact.html", "/ar/contact.html"]
  ];

  for (const [route, activeUrl] of activeRoutes) {
    assert.match(await readOutput(route), new RegExp(`<a href="${activeUrl}" class="nav__link nav__link--active" aria-current="page">`));
  }

  for (const route of [
    "publications/index.html",
    "fr/publications/index.html",
    "ar/publications/index.html",
    ...PUBLICATION_ROUTES
  ]) {
    const locale = route.startsWith("fr/") ? "fr" : route.startsWith("ar/") ? "ar" : "en";
    const href = locale === "en" ? "/publications/" : `/${locale}/publications/`;
    assert.match(
      await readOutput(route),
      new RegExp(`<a href="${href}" class="nav__link nav__link--active" aria-current="page">`)
    );
  }
});

test("publication detail language switchers retain the current slug", async () => {
  for (const slug of PUBLICATION_SLUGS) {
    for (const locale of ["en", "fr", "ar"]) {
      const prefix = locale === "en" ? "" : `${locale}/`;
      const html = await readOutput(`${prefix}publications/${slug}/index.html`);

      for (const [language, href] of Object.entries({
        en: `/publications/${slug}/`,
        fr: `/fr/publications/${slug}/`,
        ar: `/ar/publications/${slug}/`
      })) {
        assert.match(html, new RegExp(`<a href="${href}" data-lang="${language}"`));
      }
    }
  }
});

test("publication pages load the language switcher behavior", async () => {
  for (const route of [
    "publications/index.html",
    "fr/publications/index.html",
    "ar/publications/index.html",
    ...PUBLICATION_ROUTES
  ]) {
    assert.match(
      await readOutput(route),
      /<script src="\/assets\/localization\.js"><\/script>/,
      `${route} loads localization.js`
    );
  }
});
