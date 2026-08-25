import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join, relative } from "node:path";
import test from "node:test";

import { OUTPUT_ROOT } from "./helpers/site.mjs";

const SOURCE_ROOT = fileURLToPath(new URL("../", import.meta.url));

const REMOVED_SOURCE_PATHS = [
  "blog",
  "fr/blog",
  "ar/blog",
  "assets/images/optimized/blog",
  "assets/blog.css",
  "assets/blog-article.css",
  "assets/blog-pagination.js"
];

const LEGACY_RETAINED_HTML = [
  "index.html",
  "about.html",
  "services.html",
  "contact.html",
  "404.html",
  "fr/index.html",
  "fr/about.html",
  "fr/services.html",
  "fr/contact.html",
  "ar/index.html",
  "ar/about.html",
  "ar/services.html",
  "ar/contact.html"
];

const REMOVED_OUTPUT_PATHS = [
  "blog",
  "fr/blog",
  "ar/blog",
  "assets/blog.css",
  "assets/blog-article.css",
  "assets/blog-pagination.js",
  "assets/images/optimized/blog"
];

async function generatedHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return generatedHtmlFiles(path);
    }

    return entry.isFile() && entry.name.endsWith(".html") ? [relative(OUTPUT_ROOT, path)] : [];
  }));

  return nestedFiles.flat();
}

test("the source tree contains no blog-specific files or legacy retained pages", () => {
  for (const path of [...REMOVED_SOURCE_PATHS, ...LEGACY_RETAINED_HTML]) {
    assert.equal(existsSync(join(SOURCE_ROOT, path)), false, `${path} is absent from source`);
  }
});

test("the localization switcher has no blog or catalog route cases", async () => {
  const localization = await readFile(join(SOURCE_ROOT, "assets/localization.js"), "utf8");

  assert.doesNotMatch(localization, /["'`]\/blog\//);
  assert.doesNotMatch(localization, /catalog\.html/);
});

test("the generated site publishes no blog surface", () => {
  for (const path of REMOVED_OUTPUT_PATHS) {
    assert.equal(existsSync(join(OUTPUT_ROOT, path)), false, `${path} is absent from generated output`);
  }
});

test("generated pages contain no Blog navigation or footer links", async () => {
  for (const path of await generatedHtmlFiles(OUTPUT_ROOT)) {
    const html = await readFile(join(OUTPUT_ROOT, path), "utf8");

    assert.doesNotMatch(
      html,
      /<a\b[^>]*href=["'][^"']*blog[^"']*["'][^>]*>\s*(?:Blog|المدونة)\s*<\/a>/i,
      `${path} contains no Blog navigation or footer link`
    );
  }
});
