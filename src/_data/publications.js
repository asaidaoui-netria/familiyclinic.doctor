import assetManifest from "./publication-assets.json" with { type: "json" };
import { PUBLICATION_CONTENT } from "./publication-content.js";

const LOCALES = ["en", "fr", "ar"];
const CATEGORIES = new Set([
  "nutrition",
  "conditions",
  "pregnancy",
  "environment",
]);
const AUTHOR = "Dr. Said-Alaoui Moulay Abdellah";
const STORAGE_ORIGIN =
  "https://familyclinic-doctor-publications.nbg1.your-objectstorage.com";
const HASH_PATTERN = /^[a-f0-9]{64}$/;

function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) {
      deepFreeze(child);
    }
    Object.freeze(value);
  }
  return value;
}

function hasExactLocales(value) {
  return (
    value &&
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...LOCALES].sort())
  );
}

function validateContent(records) {
  if (!Array.isArray(records)) {
    throw new Error("Publication content must be an array");
  }
  const ids = new Set();
  const slugs = new Set();

  for (const record of records) {
    if (/cook(?:ing)?-to-heal|cuisiner-pour-guerir/i.test(record.id ?? "")) {
      throw new Error("The cookbook cannot be a publication record");
    }
    if (ids.has(record.id)) {
      throw new Error(`Duplicate publication ID: ${record.id}`);
    }
    ids.add(record.id);
    if (slugs.has(record.slug)) {
      throw new Error(`Duplicate publication slug: ${record.slug}`);
    }
    slugs.add(record.slug);
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug ?? "")) {
      throw new Error(`Invalid publication slug: ${record.slug}`);
    }
    if (!CATEGORIES.has(record.category)) {
      throw new Error(`Unsupported publication category: ${record.category}`);
    }
    if (record.author !== AUTHOR) {
      throw new Error(`Unexpected publication author for ${record.id}`);
    }
    if (!hasExactLocales(record.editions)) {
      throw new Error(`${record.id} must define exactly locales en, fr, and ar`);
    }

    for (const locale of LOCALES) {
      const copy = record.editions[locale];
      for (const field of ["title", "summary", "description"]) {
        if (typeof copy[field] !== "string" || copy[field].trim() === "") {
          throw new Error(`${record.id}/${locale} ${field} must be nonempty`);
        }
      }
      if (copy.summary.length > 180) {
        throw new Error(`${record.id}/${locale} summary exceeds 180 characters`);
      }
    }
  }
}

function validateAsset(asset, { id, locale, kind }) {
  if (!Number.isInteger(asset?.size) || asset.size <= 0) {
    throw new Error(`${id}/${locale}/${kind} must have a positive size`);
  }
  if (!HASH_PATTERN.test(asset.sha256 ?? "")) {
    throw new Error(`${id}/${locale}/${kind} has an invalid SHA-256`);
  }

  const extension = kind === "cover" ? "cover.webp" : `${kind}.pdf`;
  const expectedUrl = `${STORAGE_ORIGIN}/publications/${id}/${locale}/v1/${extension}`;
  if (asset.url !== expectedUrl) {
    throw new Error(`${id}/${locale}/${kind} has an invalid storage URL`);
  }
}

function validateAssets(manifest, records) {
  if (
    manifest?.schemaVersion !== 1 ||
    manifest.publicBaseUrl !== STORAGE_ORIGIN ||
    !Array.isArray(manifest.publications)
  ) {
    throw new Error("Invalid publication asset manifest");
  }
  if (
    manifest.publications.length !== records.length ||
    manifest.publications.some(
      (assetRecord, index) => assetRecord.id !== records[index].id,
    )
  ) {
    throw new Error("Publication asset IDs must match content IDs in order");
  }

  for (const assetRecord of manifest.publications) {
    if (!hasExactLocales(assetRecord.editions)) {
      throw new Error(
        `${assetRecord.id} assets must define exactly locales en, fr, and ar`,
      );
    }
    for (const locale of LOCALES) {
      const edition = assetRecord.editions[locale];
      if (edition.version !== "v1") {
        throw new Error(`${assetRecord.id}/${locale} has an invalid version`);
      }
      if (typeof edition.textLayer !== "boolean") {
        throw new Error(
          `${assetRecord.id}/${locale} has an invalid text-layer decision`,
        );
      }
      validateAsset(edition.full, {
        id: assetRecord.id,
        locale,
        kind: "full",
      });
      validateAsset(edition.preview, {
        id: assetRecord.id,
        locale,
        kind: "preview",
      });
      validateAsset(edition.cover, {
        id: assetRecord.id,
        locale,
        kind: "cover",
      });

      if (!Number.isInteger(edition.full.pageCount) || edition.full.pageCount <= 0) {
        throw new Error(`${assetRecord.id}/${locale} full PDF has no pages`);
      }
      if (
        !Number.isInteger(edition.preview.pageCount) ||
        edition.preview.pageCount < 6 ||
        edition.preview.pageCount > 8 ||
        !Array.isArray(edition.preview.pages) ||
        edition.preview.pages.length !== edition.preview.pageCount
      ) {
        throw new Error(
          `${assetRecord.id}/${locale} preview must contain six to eight pages`,
        );
      }
      if (
        !Number.isInteger(edition.cover.width) ||
        edition.cover.width <= 0 ||
        !Number.isInteger(edition.cover.height) ||
        edition.cover.height <= 0
      ) {
        throw new Error(
          `${assetRecord.id}/${locale} cover dimensions must be positive`,
        );
      }
    }
  }
}

function buildPublications(content, assets) {
  validateContent(content);
  validateAssets(assets, content);

  const publications = content.map((record, index) => {
    const assetRecord = assets.publications[index];
    return {
      id: record.id,
      slug: record.slug,
      category: record.category,
      author: record.author,
      assets: assetRecord,
      editions: Object.fromEntries(
        LOCALES.map((locale) => [
          locale,
          {
            ...record.editions[locale],
            assets: assetRecord.editions[locale],
          },
        ]),
      ),
    };
  });

  return deepFreeze(publications);
}

function publicationData() {
  return buildPublications(PUBLICATION_CONTENT, assetManifest);
}

publicationData.buildPublications = buildPublications;

export default publicationData;
