import path from "node:path";

const ALLOWED_CATEGORIES = new Set([
  "nutrition",
  "conditions",
  "pregnancy",
  "environment",
]);
const ALLOWED_KINDS = new Set(["pdf", "word"]);
const REQUIRED_LOCALES = ["ar", "en", "fr"];
const SOURCE_ROOT = "FC web site files";

function validateSourcePath(sourcePath, { id, locale, existsSync }) {
  if (typeof sourcePath !== "string" || sourcePath.length === 0) {
    throw new TypeError(`${id}/${locale} must provide a source path`);
  }

  const normalized = path.normalize(sourcePath);
  const isWithinSourceRoot =
    !path.isAbsolute(sourcePath) &&
    normalized.startsWith(`${SOURCE_ROOT}${path.sep}`) &&
    normalized !== SOURCE_ROOT &&
    !normalized.split(path.sep).includes("..");

  if (!isWithinSourceRoot) {
    throw new Error(`${id}/${locale} points outside FC web site files`);
  }

  if (/cuisiner|cooking.to.heal/i.test(normalized)) {
    throw new Error(`${id}/${locale} includes the excluded cookbook`);
  }

  if (!existsSync(sourcePath)) {
    throw new Error(`${id}/${locale} source does not exist: ${sourcePath}`);
  }
}

export function validateSourceCatalog(records, { existsSync }) {
  if (!Array.isArray(records)) {
    throw new TypeError("source catalog must be an array");
  }

  if (typeof existsSync !== "function") {
    throw new TypeError("existsSync must be a function");
  }

  const seenIds = new Set();

  for (const record of records) {
    const { id, category, sources } = record ?? {};

    if (typeof id !== "string" || id.length === 0) {
      throw new TypeError("every publication must have a non-empty ID");
    }
    if (seenIds.has(id)) {
      throw new Error(`duplicate publication ID: ${id}`);
    }
    seenIds.add(id);

    if (!ALLOWED_CATEGORIES.has(category)) {
      throw new Error(`unsupported category for ${id}: ${category}`);
    }

    const locales = Object.keys(sources ?? {}).sort();
    if (
      locales.length !== REQUIRED_LOCALES.length ||
      locales.some((locale, index) => locale !== REQUIRED_LOCALES[index])
    ) {
      throw new Error(`${id} must contain exactly the locales ar, en, and fr`);
    }

    for (const locale of REQUIRED_LOCALES) {
      const source = sources[locale];

      if (!ALLOWED_KINDS.has(source?.kind)) {
        throw new Error(
          `unsupported source kind for ${id}/${locale}: ${source?.kind}`,
        );
      }

      validateSourcePath(source.path, { id, locale, existsSync });
    }
  }

  return records;
}
