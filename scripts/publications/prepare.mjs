import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import {
  access,
  mkdir,
  readFile,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { loadImage } from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";

import {
  validatePreviewPages,
  validateSourceCatalog,
} from "./lib/catalog.mjs";
import { sha256File, writeJsonAtomic } from "./lib/files.mjs";
import {
  convertWordToPdf,
  createPreviewPdf,
  linearizePdf,
  renderPageWebp,
} from "./lib/pdf.mjs";
import {
  PREVIEW_PAGES,
  TEXT_LAYER_SUITABILITY,
} from "./preview-pages.mjs";
import { SOURCE_PUBLICATIONS } from "./source-catalog.mjs";

const execFileAsync = promisify(execFile);
const DEFAULT_WORK_ROOT = ".publication-work";
const LOCALES = ["en", "fr", "ar"];

export async function describePdf(filePath) {
  const bytes = await readFile(filePath);
  const document = await PDFDocument.load(bytes);
  const details = await stat(filePath);

  return {
    pageCount: document.getPageCount(),
    size: details.size,
    sha256: await sha256File(filePath),
  };
}

export async function describeImage(filePath) {
  const [image, details, sha256] = await Promise.all([
    loadImage(filePath),
    stat(filePath),
    sha256File(filePath),
  ]);

  return {
    width: image.width,
    height: image.height,
    size: details.size,
    sha256,
  };
}

const DEFAULT_DEPENDENCIES = {
  mkdir,
  convertWordToPdf,
  createPreviewPdf,
  describeImage,
  describePdf,
  linearizePdf,
  renderPageWebp,
  writeJsonAtomic,
};

async function resolveSourcePdf({
  publication,
  locale,
  workRoot,
  dependencies,
}) {
  const source = publication.sources[locale];
  if (source.kind === "pdf") {
    return source.path;
  }

  const outputDir = path.join(workRoot, "converted", publication.id, locale);
  await dependencies.mkdir(outputDir, { recursive: true });
  return dependencies.convertWordToPdf({
    sourcePath: source.path,
    outputDir,
  });
}

export async function preparePublicationEdition({
  publication,
  locale,
  previewPages,
  textLayer,
  workRoot = DEFAULT_WORK_ROOT,
  sourcePdfPath,
  dependencies: overrides = {},
}) {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides };
  const outputDirectory = path.join(
    workRoot,
    "prepared",
    publication.id,
    locale,
    "v1",
  );
  const stagingDirectory = path.join(
    workRoot,
    "staging",
    publication.id,
    locale,
    "v1",
  );
  await dependencies.mkdir(outputDirectory, { recursive: true });
  await dependencies.mkdir(stagingDirectory, { recursive: true });

  const sourcePdf =
    sourcePdfPath ??
    (await resolveSourcePdf({
      publication,
      locale,
      workRoot,
      dependencies,
    }));
  const sourceDetails = await dependencies.describePdf(sourcePdf);
  validatePreviewPages(previewPages, {
    pageCount: sourceDetails.pageCount,
    id: publication.id,
    locale,
  });
  if (typeof textLayer !== "boolean") {
    throw new TypeError(
      `${publication.id}/${locale} requires a reviewed text-layer decision`,
    );
  }

  const coverPath = path.join(outputDirectory, "cover.webp");
  const previewStagingPath = path.join(
    stagingDirectory,
    "preview-unlinearized.pdf",
  );
  const previewPath = path.join(outputDirectory, "preview.pdf");
  const fullPath = path.join(outputDirectory, "full.pdf");
  const metadataPath = path.join(outputDirectory, "metadata.json");

  await dependencies.renderPageWebp({
    sourcePath: sourcePdf,
    pageNumber: 1,
    outputPath: coverPath,
    width: 640,
  });
  await dependencies.createPreviewPdf({
    sourcePath: sourcePdf,
    pageNumbers: previewPages,
    outputPath: previewStagingPath,
  });
  await dependencies.linearizePdf({
    sourcePath: sourcePdf,
    outputPath: fullPath,
  });
  await dependencies.linearizePdf({
    sourcePath: previewStagingPath,
    outputPath: previewPath,
  });

  const [full, preview, cover] = await Promise.all([
    dependencies.describePdf(fullPath),
    dependencies.describePdf(previewPath),
    dependencies.describeImage(coverPath),
  ]);
  const metadata = {
    id: publication.id,
    locale,
    version: "v1",
    textLayer,
    full: { path: "full.pdf", ...full },
    preview: {
      path: "preview.pdf",
      ...preview,
      pages: [...previewPages],
    },
    cover: { path: "cover.webp", ...cover },
  };

  await dependencies.writeJsonAtomic(metadataPath, metadata);
  return metadata;
}

async function runTool(command, args) {
  await execFileAsync(command, args);
}

export async function runPreflight({
  records = SOURCE_PUBLICATIONS,
  run = runTool,
  describe = describePdf,
} = {}) {
  validateSourceCatalog(records, { existsSync });
  const errors = [];

  for (const [command, args, installHint] of [
    ["qpdf", ["--version"], "Install qpdf before preparing publications."],
    [
      "soffice",
      ["--version"],
      "Install LibreOffice so Word editions can be converted to PDF.",
    ],
  ]) {
    try {
      await run(command, args);
    } catch {
      errors.push(`${command} is unavailable. ${installHint}`);
    }
  }

  let sourceCount = 0;
  for (const publication of records) {
    for (const locale of LOCALES) {
      const source = publication.sources[locale];
      try {
        await access(source.path);
        if (source.kind === "pdf") {
          const details = await describe(source.path);
          if (details.pageCount < 1) {
            throw new Error("PDF contains no pages");
          }
        }
        sourceCount += 1;
      } catch (error) {
        errors.push(
          `${publication.id}/${locale} is unreadable: ${error.message}`,
        );
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Publication preflight failed:\n- ${errors.join("\n- ")}`);
  }

  return { publicationCount: records.length, sourceCount };
}

function contactSheetHtml({ publicationId, locale, pageCount }) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1)
    .map(
      (pageNumber) => `
      <figure>
        <img src="page-${String(pageNumber).padStart(3, "0")}.webp" alt="Page ${pageNumber}" loading="lazy">
        <figcaption>Page ${pageNumber}</figcaption>
      </figure>`,
    )
    .join("");

  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${publicationId} · ${locale}</title>
<style>
body{font:16px system-ui;margin:2rem;background:#eee;color:#222}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem}figure{margin:0;padding:.75rem;background:white}img{display:block;width:100%;height:auto}figcaption{padding-top:.5rem;font-weight:700}
</style>
<h1>${publicationId} · ${locale}</h1>
<p>${pageCount} pages</p>
<main>${pages}
</main>
`;
}

export async function generateContactSheets({
  records = SOURCE_PUBLICATIONS,
  workRoot = DEFAULT_WORK_ROOT,
  dependencies: overrides = {},
  onProgress = () => {},
} = {}) {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides };
  validateSourceCatalog(records, { existsSync });
  let editionCount = 0;

  for (const publication of records) {
    for (const locale of LOCALES) {
      const sourcePdf = await resolveSourcePdf({
        publication,
        locale,
        workRoot,
        dependencies,
      });
      const { pageCount } = await dependencies.describePdf(sourcePdf);
      const outputDirectory = path.join(
        workRoot,
        "contact-sheets",
        publication.id,
        locale,
      );
      await dependencies.mkdir(outputDirectory, { recursive: true });

      for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
        await dependencies.renderPageWebp({
          sourcePath: sourcePdf,
          pageNumber,
          outputPath: path.join(
            outputDirectory,
            `page-${String(pageNumber).padStart(3, "0")}.webp`,
          ),
          width: 240,
        });
      }

      await writeFile(
        path.join(outputDirectory, "index.html"),
        contactSheetHtml({ publicationId: publication.id, locale, pageCount }),
      );
      editionCount += 1;
      onProgress({ id: publication.id, locale, pageCount });
    }
  }

  return { publicationCount: records.length, editionCount };
}

export async function prepareAllPublications({
  records = SOURCE_PUBLICATIONS,
  selections = PREVIEW_PAGES,
  textLayers = TEXT_LAYER_SUITABILITY,
  workRoot = DEFAULT_WORK_ROOT,
  dependencies: overrides = {},
  onProgress = () => {},
} = {}) {
  const dependencies = { ...DEFAULT_DEPENDENCIES, ...overrides };
  validateSourceCatalog(records, { existsSync });
  const resolvedEditions = [];

  for (const publication of records) {
    for (const locale of LOCALES) {
      const sourcePdfPath = await resolveSourcePdf({
        publication,
        locale,
        workRoot,
        dependencies,
      });
      const { pageCount } = await dependencies.describePdf(sourcePdfPath);
      const previewPages = selections[publication.id]?.[locale];
      const textLayer = textLayers[publication.id]?.[locale];
      validatePreviewPages(previewPages, {
        pageCount,
        id: publication.id,
        locale,
      });
      if (typeof textLayer !== "boolean") {
        throw new TypeError(
          `${publication.id}/${locale} requires a reviewed text-layer decision`,
        );
      }
      resolvedEditions.push({
        publication,
        locale,
        sourcePdfPath,
        previewPages,
        textLayer,
      });
    }
  }

  const metadata = [];
  for (const edition of resolvedEditions) {
    metadata.push(
      await preparePublicationEdition({
        ...edition,
        workRoot,
        dependencies,
      }),
    );
    onProgress({ id: edition.publication.id, locale: edition.locale });
  }

  return metadata;
}

async function main() {
  const mode = process.argv[2];

  if (mode === "--preflight") {
    const result = await runPreflight();
    console.log(
      `Publication preflight passed: ${result.publicationCount} publications, ${result.sourceCount} readable sources, qpdf and LibreOffice available.`,
    );
    return;
  }

  if (mode === "--contact-sheets") {
    const result = await generateContactSheets({
      onProgress: ({ id, locale, pageCount }) =>
        console.log(`Rendered ${id}/${locale}: ${pageCount} pages`),
    });
    console.log(`Generated contact sheets for ${result.editionCount} editions.`);
    return;
  }

  if (mode === "--prepare") {
    const metadata = await prepareAllPublications({
      onProgress: ({ id, locale }) => console.log(`Prepared ${id}/${locale}`),
    });
    console.log(`Prepared ${metadata.length} publication editions.`);
    return;
  }

  throw new Error(
    "Choose one mode: --preflight, --contact-sheets, or --prepare",
  );
}

const isMain =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
