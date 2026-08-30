import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import assetManifest from "../src/_data/publication-assets.json" with { type: "json" };
import { PUBLICATION_CONTENT } from "../src/_data/publication-content.js";
import publicationPagesData from "../src/_data/publicationPages.js";
import publicationData from "../src/_data/publications.js";
import site from "../src/_data/site.js";

const publications = publicationData();
const publicationPages = publicationPagesData();
const { buildPublications } = publicationData;
const { publicationOutputPath, publicationRoute } = publicationPagesData;

const IDS = [
  "nature-to-factory",
  "hypotoxic-nutrition",
  "enzymes",
  "nutrition-key-health",
  "hypotoxic-diet-principles",
  "basedow-disease",
  "diabetes-hyperinsulinism",
  "liver-immunity",
  "hashimoto-disease",
  "chronic-inflammation",
  "rheumatoid-arthritis",
  "pregnancy",
  "invisible-environmental-threats",
];
const LOCALES = ["en", "fr", "ar"];

test("publication content and Hetzner assets merge into thirteen localized records", () => {
  assert.equal(publications.length, 13);
  assert.deepEqual(
    publications.map(({ id }) => id),
    IDS,
  );
  assert.deepEqual(
    [...new Set(publications.map(({ category }) => category))].sort(),
    ["conditions", "environment", "nutrition", "pregnancy"],
  );
  assert.equal(
    publications.some(({ id }) => /cooking|cuisiner/i.test(id)),
    false,
  );

  for (const publication of publications) {
    assert.equal(publication.author, "Dr. Said-Alaoui Moulay Abdellah");
    assert.equal(publication.id, publication.assets.id);
    assert.deepEqual(Object.keys(publication.editions), LOCALES);

    for (const [locale, edition] of Object.entries(publication.editions)) {
      assert.ok(edition.title.trim());
      assert.ok(edition.summary.trim());
      assert.ok(edition.description.trim());
      assert.ok(edition.summary.length <= 180);
      assert.equal(edition.assets.version, "v1");
      assert.ok(edition.assets.preview.pageCount >= 6);
      assert.ok(edition.assets.preview.pageCount <= 8);
      assert.ok(edition.assets.full.size > 0);
      assert.ok(edition.assets.preview.size > 0);
      assert.ok(edition.assets.cover.size > 0);
      assert.ok(edition.assets.cover.width > 0);
      assert.ok(edition.assets.cover.height > 0);

      for (const asset of [
        edition.assets.full,
        edition.assets.preview,
        edition.assets.cover,
      ]) {
        assert.match(asset.sha256, /^[a-f0-9]{64}$/);
        assert.match(
          asset.url,
          new RegExp(
            `^https://familyclinic-doctor-publications\\.nbg1\\.your-objectstorage\\.com/publications/${publication.id}/${locale}/v1/`,
          ),
        );
      }
    }
    assert.equal(Object.isFrozen(publication), true);
    assert.equal(Object.isFrozen(publication.editions.en.assets), true);
  }
});

test("Arabic publication copy is free of reviewed OCR-order artifacts", async () => {
  const arabicCopy = [
    JSON.stringify(site.locales.ar.publications),
    ...PUBLICATION_CONTENT.flatMap(({ editions }) =>
      Object.values(editions.ar),
    ),
    await readFile("src/ar/publications.njk", "utf8"),
  ].join("\n");

  assert.doesNotMatch(arabicCopy, /اأ|اإ|اآ|اال|هللا|ا ً/);
});

test("publication detail records have deterministic reciprocal locale routes", () => {
  assert.equal(publicationPages.length, 39);
  assert.equal(
    publicationPages.filter(({ locale }) => locale === "ar").length,
    13,
  );
  assert.equal(publicationRoute("en", "enzymes"), "/publications/enzymes/");
  assert.equal(
    publicationRoute("fr", "enzymes"),
    "/fr/publications/enzymes/",
  );
  assert.equal(
    publicationOutputPath("ar", "enzymes"),
    "ar/publications/enzymes/index.html",
  );

  for (const page of publicationPages) {
    assert.equal(
      page.permalink,
      publicationRoute(page.locale, page.publication.slug),
    );
    assert.equal(
      page.outputPath,
      publicationOutputPath(page.locale, page.publication.slug),
    );
    assert.deepEqual(page.localizedRoutes, {
      en: publicationRoute("en", page.publication.slug),
      fr: publicationRoute("fr", page.publication.slug),
      ar: publicationRoute("ar", page.publication.slug),
    });
  }
});

test("publication validation rejects unsafe or incomplete content and assets", () => {
  const cases = [
    {
      name: "duplicate IDs",
      edit(content) {
        content[1].id = content[0].id;
      },
      expected: /duplicate publication id/i,
    },
    {
      name: "duplicate slugs",
      edit(content) {
        content[1].slug = content[0].slug;
      },
      expected: /duplicate publication slug/i,
    },
    {
      name: "missing locales",
      edit(content) {
        delete content[0].editions.ar;
      },
      expected: /exactly.*en.*fr.*ar/i,
    },
    {
      name: "extra locales",
      edit(content) {
        content[0].editions.de = structuredClone(content[0].editions.en);
      },
      expected: /exactly.*en.*fr.*ar/i,
    },
    {
      name: "mismatched asset IDs",
      edit(_content, assets) {
        assets.publications[0].id = "different";
      },
      expected: /asset.*id/i,
    },
    {
      name: "unsupported categories",
      edit(content) {
        content[0].category = "other";
      },
      expected: /category/i,
    },
    {
      name: "empty content",
      edit(content) {
        content[0].editions.en.title = "";
      },
      expected: /nonempty/i,
    },
    {
      name: "long summaries",
      edit(content) {
        content[0].editions.en.summary = "x".repeat(181);
      },
      expected: /180/i,
    },
    {
      name: "invalid versions",
      edit(_content, assets) {
        assets.publications[0].editions.en.version = "latest";
      },
      expected: /version/i,
    },
    {
      name: "non-storage URLs",
      edit(_content, assets) {
        assets.publications[0].editions.en.preview.url = "http://example.com/a.pdf";
      },
      expected: /storage url/i,
    },
    {
      name: "short previews",
      edit(_content, assets) {
        assets.publications[0].editions.en.preview.pageCount = 5;
      },
      expected: /preview.*six to eight/i,
    },
    {
      name: "zero sizes",
      edit(_content, assets) {
        assets.publications[0].editions.en.full.size = 0;
      },
      expected: /positive size/i,
    },
    {
      name: "zero cover dimensions",
      edit(_content, assets) {
        assets.publications[0].editions.en.cover.width = 0;
      },
      expected: /cover dimensions/i,
    },
    {
      name: "malformed hashes",
      edit(_content, assets) {
        assets.publications[0].editions.en.full.sha256 = "bad";
      },
      expected: /sha-256/i,
    },
    {
      name: "cookbook identifiers",
      edit(content, assets) {
        content[0].id = "cooking-to-heal";
        content[0].slug = "cooking-to-heal";
        assets.publications[0].id = "cooking-to-heal";
      },
      expected: /cookbook/i,
    },
  ];

  for (const scenario of cases) {
    const content = structuredClone(PUBLICATION_CONTENT);
    const assets = structuredClone(assetManifest);
    scenario.edit(content, assets);
    assert.throws(
      () => buildPublications(content, assets),
      scenario.expected,
      scenario.name,
    );
  }
});
