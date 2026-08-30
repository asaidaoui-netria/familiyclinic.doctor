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
const PREVIEW_LABELS = {
  en: "Preview publication",
  fr: "Aperçu de la publication",
  ar: "معاينة المنشور",
};
const DOWNLOAD_LABELS = {
  en: "Download",
  fr: "Télécharger",
  ar: "تنزيل",
};
const VIEWER_LABELS = {
  en: "Preview",
  fr: "Aperçu",
  ar: "معاينة",
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

test("each publication card is one complete link without a separate preview CTA", async () => {
  for (const [locale, route] of Object.entries(CATALOGS)) {
    const html = await readOutput(route);
    const cards = [
      ...html.matchAll(
        /<article class="publication-card"[\s\S]*?<\/article>/g,
      ),
    ].map(([card]) => card);
    const prefix = locale === "en" ? "" : `/${locale}`;

    assert.equal(cards.length, 13);
    for (const [index, publication] of publications.entries()) {
      const edition = publication.editions[locale];
      const card = cards[index];
      const destination = `${prefix}/publications/${publication.slug}/`;

      assert.equal((card.match(/<a\b/g) ?? []).length, 1);
      assert.match(
        card,
        new RegExp(
          `^<article[^>]*>\\s*<a[^>]+href="${escapeRegExp(destination)}"[^>]*>[\\s\\S]*<\\/a>\\s*<\\/article>$`,
        ),
      );
      assert.match(
        card,
        new RegExp(
          `aria-label="${escapeRegExp(escapeHtml(edition.title))}"`,
        ),
      );
      assert.match(card, new RegExp(escapeRegExp(escapeHtml(edition.title))));
      assert.match(card, new RegExp(escapeRegExp(escapeHtml(edition.summary))));
      assert.doesNotMatch(
        card,
        new RegExp(escapeRegExp(escapeHtml(PREVIEW_LABELS[locale]))),
      );
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
      new RegExp(`<a[^>]+href="${escapeRegExp(edition.assets.full.url)}"[^>]*>[\\s\\S]*?${escapeRegExp(copy.download)}`)
    );
    assert.match(
      html,
      new RegExp(
        `${escapeRegExp(copy.language)}: ${escapeRegExp(site.localeNames[locale])}`,
      ),
    );
  }
});

test("publication detail headers do not repeat the catalog cover thumbnail", async () => {
  for (const route of PUBLICATION_ROUTES) {
    const html = await readOutput(route);
    const header = html.match(
      /<header class="publication-detail__header">[\s\S]*?<\/header>/,
    )?.[0];

    assert.ok(header, `${route} has a publication detail header`);
    assert.doesNotMatch(header, /<img\b/);
    assert.doesNotMatch(header, /publication-detail__cover/);
  }
});

test("publication viewers omit the repeated visible preview heading", async () => {
  for (const route of PUBLICATION_ROUTES) {
    const html = await readOutput(route);
    const viewer = html.match(
      /<section class="publication-viewer"[\s\S]*?<\/section>/,
    )?.[0];

    assert.ok(viewer, `${route} has a publication viewer`);
    assert.doesNotMatch(viewer, /publication-viewer__heading/);
    assert.doesNotMatch(viewer, /<h2\b/);
  }
});

test("publication viewer sections retain a localized accessible name", async () => {
  for (const route of PUBLICATION_ROUTES) {
    const locale = route.startsWith("fr/") ? "fr" : route.startsWith("ar/") ? "ar" : "en";
    const html = await readOutput(route);

    assert.match(
      html,
      new RegExp(
        `<section class="publication-viewer"[^>]+aria-label="${VIEWER_LABELS[locale]}"`,
      ),
    );
  }
});

test("publication download CTAs contain only the localized download label", async () => {
  for (const route of PUBLICATION_ROUTES) {
    const locale = route.startsWith("fr/") ? "fr" : route.startsWith("ar/") ? "ar" : "en";
    const html = await readOutput(route);
    const link = html.match(
      /<a class="publication-detail__read"[\s\S]*?<\/a>/,
    )?.[0];

    assert.ok(link, `${route} has a publication download link`);
    assert.match(link, new RegExp(`aria-label="${DOWNLOAD_LABELS[locale]}"`));
    assert.equal((link.match(/<span\b/g) ?? []).length, 1);
    assert.equal(
      link.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      DOWNLOAD_LABELS[locale],
    );
    assert.doesNotMatch(link, /\b(?:PDF|MB)\b/);
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
    assert.match(viewer, new RegExp(`data-preview-locale="${locale}"`));
    assert.match(viewer, new RegExp(`data-text-layer="${edition.assets.textLayer}"`));
    assert.doesNotMatch(viewer, new RegExp(escapeRegExp(edition.assets.full.url)));
    assert.equal(
      (html.match(new RegExp(escapeRegExp(edition.assets.full.url), "g")) ?? []).length,
      1,
    );
    assert.match(
      html,
      new RegExp(`<a[^>]+href="${escapeRegExp(edition.assets.full.url)}"[^>]+download="${escapeRegExp(edition.assets.full.filename)}"[^>]*>[\\s\\S]*?${escapeRegExp(escapeHtml(copy.download))}`),
    );
    assert.ok(
      html.indexOf('</section>') < html.indexOf(`href="${edition.assets.full.url}"`),
      `${route} places Download after the preview`,
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

test("publication viewer chrome keeps the same control direction in every locale", async () => {
  for (const route of [
    `publications/${PUBLICATION_SLUGS[0]}/index.html`,
    `fr/publications/${PUBLICATION_SLUGS[0]}/index.html`,
    `ar/publications/${PUBLICATION_SLUGS[0]}/index.html`,
  ]) {
    const html = await readOutput(route);
    assert.match(
      html,
      /<div class="publication-viewer__toolbar" dir="ltr" role="toolbar"/,
      `${route} keeps reader controls left-to-right`,
    );
  }
});

test("publication viewer arrows follow each locale's reading direction", async () => {
  for (const [route, previousArrow, nextArrow] of [
    [`publications/${PUBLICATION_SLUGS[0]}/index.html`, "←", "→"],
    [`fr/publications/${PUBLICATION_SLUGS[0]}/index.html`, "←", "→"],
    [`ar/publications/${PUBLICATION_SLUGS[0]}/index.html`, "→", "←"],
  ]) {
    const html = await readOutput(route);
    assert.match(
      html,
      new RegExp(`data-viewer-previous[^>]*><span aria-hidden="true">${previousArrow}<\\/span>`),
      `${route} uses ${previousArrow} for Back`,
    );
    assert.match(
      html,
      new RegExp(`data-viewer-next[^>]*><span aria-hidden="true">${nextArrow}<\\/span>`),
      `${route} uses ${nextArrow} for Forward`,
    );
  }
});

test("Arabic pagination reverses button positions without moving the toolbar groups", async () => {
  for (const route of [
    `publications/${PUBLICATION_SLUGS[0]}/index.html`,
    `fr/publications/${PUBLICATION_SLUGS[0]}/index.html`,
  ]) {
    const html = await readOutput(route);
    assert.match(html, /<div class="publication-viewer__pagination">/);
    assert.doesNotMatch(html, /publication-viewer__pagination--rtl/);
  }

  const arabic = await readOutput(`ar/publications/${PUBLICATION_SLUGS[0]}/index.html`);
  assert.match(
    arabic,
    /<div class="publication-viewer__pagination publication-viewer__pagination--rtl">/,
  );
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
