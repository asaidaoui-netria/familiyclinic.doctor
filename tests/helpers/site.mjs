import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

export const OUTPUT_ROOT = fileURLToPath(new URL("../../_site/", import.meta.url));

export const PUBLICATION_SLUGS = [
  "nature-to-factory", "hypotoxic-nutrition", "enzymes",
  "nutrition-key-health", "hypotoxic-diet-principles", "basedow-disease",
  "diabetes-hyperinsulinism", "liver-immunity", "hashimoto-disease",
  "chronic-inflammation", "rheumatoid-arthritis", "pregnancy",
  "invisible-environmental-threats"
];

export const PUBLICATION_ROUTES = ["en", "fr", "ar"].flatMap((locale) => {
  const prefix = locale === "en" ? "" : `${locale}/`;
  return PUBLICATION_SLUGS.map(
    (slug) => `${prefix}publications/${slug}/index.html`
  );
});

import publicationPagesData from '../../src/_data/publicationPages.js';
export const PUBLICATION_PAGES = publicationPagesData();

export const EXPECTED_HTML_ROUTES = [
  "index.html", "about.html", "services.html", "contact.html", "404.html",
  "fr/index.html", "fr/about.html", "fr/services.html", "fr/contact.html",
  "ar/index.html", "ar/about.html", "ar/services.html", "ar/contact.html",
  ...PUBLICATION_PAGES.map(page => page.outputPath)
];

export function outputPath(relativePath) {
  return new URL(relativePath, new URL("file://" + OUTPUT_ROOT + "/")).pathname;
}

export function readOutput(relativePath) {
  return readFile(outputPath(relativePath), "utf8");
}
