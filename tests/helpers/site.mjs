import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

export const OUTPUT_ROOT = fileURLToPath(new URL("../../_site/", import.meta.url));

export const EXPECTED_HTML_ROUTES = [
  "index.html", "about.html", "services.html", "contact.html", "404.html",
  "fr/index.html", "fr/about.html", "fr/services.html", "fr/contact.html",
  "ar/index.html", "ar/about.html", "ar/services.html", "ar/contact.html"
];

export function outputPath(relativePath) {
  return new URL(relativePath, new URL("file://" + OUTPUT_ROOT + "/")).pathname;
}

export function readOutput(relativePath) {
  return readFile(outputPath(relativePath), "utf8");
}
