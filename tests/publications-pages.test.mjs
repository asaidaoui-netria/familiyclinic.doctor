import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import test from "node:test";

import {
  matchesPublicationCategory,
} from "../assets/publication-catalog.js";
import publicationData from "../src/_data/publications.js";
import site from "../src/_data/site.js";
import {
  PUBLICATION_ROUTES,
  PUBLICATION_SLUGS,
  outputPath,
  readOutput
} from "./helpers/site.mjs";

const CATALOGS = {
  en: "publications/index.html",
  fr: "fr/publications/index.html",
  ar: "ar/publications/index.html"
};
const publications = publicationData();

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

test("localized catalogs expose one heading and all thirteen detail links", async () => {
  for (const [locale, route] of Object.entries(CATALOGS)) {
    const html = await readOutput(route);
    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/publications\.css">/);
    assert.doesNotMatch(html, /pdf_viewer\.css/);

    for (const slug of PUBLICATION_SLUGS) {
      const prefix = locale === "en" ? "" : `/${locale}`;
      assert.match(html, new RegExp(`href="${prefix}/publications/${slug}/"`));
    }
  }
});

test("localized catalogs render thirteen measured cards and five filters", async () => {
  const approvedCategories = new Set([
    "nutrition",
    "conditions",
    "pregnancy",
    "environment",
  ]);

  for (const [locale, route] of Object.entries(CATALOGS)) {
    const html = await readOutput(route);
    assert.equal(
      (html.match(/<article class="publication-card"/g) ?? []).length,
      13,
    );
    assert.match(html, /data-publication-filters[^>]*hidden/);
    assert.equal((html.match(/data-publication-filter=/g) ?? []).length, 5);
    assert.equal((html.match(/aria-pressed="true"/g) ?? []).length, 1);
    assert.doesNotMatch(html, /<input[^>]+type="search"/i);

    for (const publication of publications) {
      const edition = publication.editions[locale];
      assert.equal(approvedCategories.has(publication.category), true);
      assert.match(
        html,
        new RegExp(
          `<article class="publication-card" data-publication-category="${publication.category}"`,
        ),
      );
      assert.ok(edition.assets.cover.width > 0);
      assert.ok(edition.assets.cover.height > 0);
      assert.match(
        html,
        new RegExp(
          `<img[^>]+src="${escapeRegExp(edition.assets.cover.url)}"[^>]+width="${edition.assets.cover.width}"[^>]+height="${edition.assets.cover.height}"`,
        ),
      );
      assert.match(html, new RegExp(escapeRegExp(escapeHtml(edition.title))));
      assert.match(html, new RegExp(escapeRegExp(escapeHtml(edition.summary))));
      assert.match(html, new RegExp(`>${edition.assets.full.pageCount} (?:pages|صفحة)<`));
    }
  }
});

test("publication category matching is strict and supports all", () => {
  const categories = ["nutrition", "conditions", "pregnancy", "environment"];
  for (const category of categories) {
    assert.equal(matchesPublicationCategory(category, "all"), true);
    for (const selected of categories) {
      assert.equal(
        matchesPublicationCategory(category, selected),
        category === selected,
      );
    }
  }
  assert.equal(matchesPublicationCategory("nutrition", "unknown"), false);
  assert.equal(matchesPublicationCategory("unknown", "all"), false);
});

test("all 39 detail pages render localized copy and a direct full-PDF link", async () => {
  assert.equal(PUBLICATION_ROUTES.length, 39);

  for (const route of PUBLICATION_ROUTES) {
    const locale = route.startsWith("fr/") ? "fr" : route.startsWith("ar/") ? "ar" : "en";
    const slug = route.split("/").at(-2);
    const publication = publications.find((entry) => entry.slug === slug);
    const edition = publication.editions[locale];
    const copy = site.locales[locale].publications;
    const html = await readOutput(route);

    assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(edition.title))));
    assert.match(html, /Dr\. Said-Alaoui Moulay Abdellah/);
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(edition.summary))));
    assert.match(
      html,
      new RegExp(`<a[^>]+href="${escapeRegExp(edition.assets.full.url)}"[^>]*>[\\s\\S]*?${escapeRegExp(copy.readNow)}`)
    );
    assert.match(
      html,
      new RegExp(
        `${escapeRegExp(copy.language)}: ${escapeRegExp(site.localeNames[locale])}`,
      ),
    );
  }
});

test("detail pages expose the embedded-preview fallback contract without embedding full PDFs", async () => {
  for (const route of PUBLICATION_ROUTES) {
    const locale = route.startsWith("fr/") ? "fr" : route.startsWith("ar/") ? "ar" : "en";
    const slug = route.split("/").at(-2);
    const publication = publications.find((entry) => entry.slug === slug);
    const edition = publication.editions[locale];
    const copy = site.locales[locale].publications;
    const html = await readOutput(route);
    const viewer = html.match(/<section class="publication-viewer"[\s\S]*?<\/section>/)?.[0];

    assert.ok(viewer, `${route} has a viewer section`);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/vendor\/pdfjs\/pdf_viewer\.css">/);
    assert.match(html, /<link rel="stylesheet" href="\/assets\/publications\.css">/);
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(publication.author))));
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(copy.filters[publication.category]))));
    assert.match(html, new RegExp(escapeRegExp(escapeHtml(edition.description))));
    assert.match(html, new RegExp(`>${edition.assets.full.pageCount} (?:pages|صفحة)<`));
    assert.match(html, /\bMB\b/);

    assert.match(
      viewer,
      new RegExp(`data-preview-url="${escapeRegExp(edition.assets.preview.url)}"`),
    );
    assert.match(viewer, new RegExp(`data-preview-pages="${edition.assets.preview.pageCount}"`));
    assert.match(viewer, new RegExp(`data-text-layer="${edition.assets.textLayer}"`));
    assert.doesNotMatch(viewer, new RegExp(escapeRegExp(edition.assets.full.url)));
    assert.equal(
      (html.match(new RegExp(escapeRegExp(edition.assets.full.url), "g")) ?? []).length,
      1,
    );
    assert.match(
      html,
      new RegExp(`<a[^>]+href="${escapeRegExp(edition.assets.full.url)}"[^>]+download="${escapeRegExp(edition.assets.full.filename)}"[^>]*>[\\s\\S]*?${escapeRegExp(escapeHtml(copy.readNow))}`),
    );
    assert.ok(
      html.indexOf('</section>') < html.indexOf(`href="${edition.assets.full.url}"`),
      `${route} places Read now after the preview`,
    );

    assert.doesNotMatch(html, /<(?:iframe|embed|object)\b/i);
    assert.doesNotMatch(html, /<link[^>]+rel="preload"/i);
    for (const label of [
      copy.previousPage,
      copy.nextPage,
      copy.zoomOut,
      copy.zoomIn,
      copy.fullscreen,
    ]) {
      assert.match(
        viewer,
        new RegExp(`aria-label="${escapeRegExp(escapeHtml(label))}"[^>]*disabled`),
      );
    }
    assert.match(viewer, /role="status"/);
    assert.match(viewer, /role="alert"[^>]*hidden/);
    assert.equal(
      (viewer.match(new RegExp(escapeRegExp(edition.assets.preview.url), "g")) ?? []).length,
      3,
    );
    assert.match(viewer, /<noscript>[\s\S]*<a /);
    assert.match(
      html,
      new RegExp(escapeRegExp(escapeHtml(copy.educationalDisclaimer))),
    );
  }
});

test("Arabic publication controls retain a logical reading order", async () => {
  const html = await readOutput(CATALOGS.ar);
  assert.match(html, /<html lang="ar" dir="rtl">/);

  const filterValues = [...html.matchAll(/data-publication-filter="([^"]+)"/g)]
    .map((match) => match[1]);
  assert.deepEqual(filterValues, ["all", "nutrition", "conditions", "pregnancy", "environment"]);

  const detail = await readOutput(`ar/publications/${PUBLICATION_SLUGS[0]}/index.html`);
  const toolbarStart = detail.indexOf('<div class="publication-viewer__toolbar"');
  const toolbarEnd = detail.indexOf('<div class="publication-viewer__stage"', toolbarStart);
  const toolbar = detail.slice(toolbarStart, toolbarEnd);
  assert.ok(toolbar);
  for (const control of [
    "data-viewer-previous",
    "data-viewer-next",
    "data-viewer-zoom-out",
    "data-viewer-zoom-in",
    "data-viewer-fullscreen",
  ]) {
    assert.match(toolbar, new RegExp(`<button[^>]+${control}[^>]+aria-label="[^"]+"`));
  }
});

test("publication pages defer full PDFs and publish every local runtime asset", async () => {
  const routes = [
    ...Object.values(CATALOGS),
    ...PUBLICATION_ROUTES,
  ];

  for (const route of routes) {
    const html = await readOutput(route);
    const preloads = html.match(/<link\b[^>]+rel="preload"[^>]*>/gi) ?? [];
    assert.equal(
      preloads.some((tag) => /full\.pdf/i.test(tag)),
      false,
      `${route} does not preload a complete publication`,
    );

    for (const [, reference] of html.matchAll(
      /(?:href|src)="(\/assets\/(?:publication[^"?#]+|vendor\/pdfjs\/[^"?#]+))"/g,
    )) {
      assert.equal(
        existsSync(outputPath(reference.slice(1))),
        true,
        `${route} publishes ${reference}`,
      );
    }
  }
});

test("publication JavaScript contains no publication-specific analytics", async () => {
  for (const filename of ["publication-catalog.js", "publication-viewer.js"]) {
    const source = await readFile(resolve("assets", filename), "utf8");
    assert.doesNotMatch(source, /plausible\s*\(/i, `${filename} sends no Plausible event`);
    assert.doesNotMatch(source, /dispatchEvent|CustomEvent/, `${filename} dispatches no analytics event`);
  }
});
