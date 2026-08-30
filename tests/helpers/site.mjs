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

export const EXPECTED_HTML_ROUTES = [
  "index.html", "about.html", "services.html", "contact.html", "404.html",
  "fr/index.html", "fr/about.html", "fr/services.html", "fr/contact.html",
  "ar/index.html", "ar/about.html", "ar/services.html", "ar/contact.html",
  "publications/index.html", "fr/publications/index.html", "ar/publications/index.html",
  ...PUBLICATION_ROUTES
];

export function outputPath(relativePath) {
  return new URL(relativePath, new URL("file://" + OUTPUT_ROOT + "/")).pathname;
}

export function readOutput(relativePath) {
  return readFile(outputPath(relativePath), "utf8");
}
