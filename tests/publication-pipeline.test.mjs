import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { PDFDocument, StandardFonts } from "pdf-lib";

import { SOURCE_PUBLICATIONS } from "../scripts/publications/source-catalog.mjs";
import {
  PREVIEW_PAGES,
  TEXT_LAYER_SUITABILITY,
} from "../scripts/publications/preview-pages.mjs";
import {
  validatePreviewPages,
  validateSourceCatalog,
} from "../scripts/publications/lib/catalog.mjs";
import {
  sha256File,
  writeJsonAtomic,
} from "../scripts/publications/lib/files.mjs";
import {
  convertWordToPdf,
  createPreviewPdf,
  linearizePdf,
  renderPageWebp,
} from "../scripts/publications/lib/pdf.mjs";
import { preparePublicationEdition } from "../scripts/publications/prepare.mjs";

test("the R2 delivery contract has exact CORS and credential documentation", async () => {
  const cors = JSON.parse(await readFile("infra/r2/cors.json", "utf8"));
  assert.deepEqual(cors, {
    rules: [
      {
        allowed: {
          origins: [
            "https://www.familyclinic.doctor",
            "http://localhost:8080",
          ],
          methods: ["GET", "HEAD"],
          headers: ["Range"],
        },
        exposeHeaders: [
          "Accept-Ranges",
          "Content-Length",
          "Content-Range",
          "ETag",
        ],
        maxAgeSeconds: 3600,
      },
    ],
  });

  const runbook = await readFile("docs/publications-r2-runbook.md", "utf8");
  const requiredVariables = [
    "CLOUDFLARE_ZONE_ID",
    "CLOUDFLARE_API_TOKEN",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
  ];

  for (const variable of requiredVariables) {
    assert.match(runbook, new RegExp(`\\b${variable}\\b`));
  }

  assert.match(runbook, /never (?:store|paste|commit).*literal secret/i);
  assert.doesNotMatch(
    runbook,
    /(?:CLOUDFLARE_API_TOKEN|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY)\s*=\s*["']?[A-Za-z0-9_-]{12,}/,
  );
});

test("the source catalog defines thirteen complete localized publications", () => {
  const records = validateSourceCatalog(SOURCE_PUBLICATIONS, {
    existsSync: () => true,
  });

  assert.equal(records.length, 13);
  assert.equal(new Set(records.map(({ id }) => id)).size, 13);
  assert.equal(
    records.flatMap(({ sources }) => Object.keys(sources)).length,
    39,
  );

  for (const { sources } of records) {
    assert.deepEqual(Object.keys(sources).sort(), ["ar", "en", "fr"]);
  }
});

test(
  "the local publication archive contains all 39 catalog sources",
  { skip: !existsSync("FC web site files") },
  () => {
    const records = validateSourceCatalog(SOURCE_PUBLICATIONS, { existsSync });
    assert.equal(records.flatMap(({ sources }) => Object.values(sources)).length, 39);
  },
);

test("source validation rejects incomplete, unsafe, and unsupported records", () => {
  const edition = {
    kind: "pdf",
    path: "FC web site files/example/example.pdf",
  };
  const record = {
    id: "example",
    category: "nutrition",
    sources: { en: edition, fr: edition, ar: edition },
  };

  const invalidCatalogs = [
    {
      name: "duplicate IDs",
      records: [record, { ...record }],
      expected: /duplicate publication ID/i,
    },
    {
      name: "unsupported categories",
      records: [{ ...record, category: "other" }],
      expected: /unsupported category/i,
    },
    {
      name: "missing locales",
      records: [{ ...record, sources: { en: edition, fr: edition } }],
      expected: /exactly the locales/i,
    },
    {
      name: "extra locales",
      records: [
        {
          ...record,
          sources: { en: edition, fr: edition, ar: edition, de: edition },
        },
      ],
      expected: /exactly the locales/i,
    },
    {
      name: "unsupported source kinds",
      records: [
        {
          ...record,
          sources: { ...record.sources, en: { ...edition, kind: "epub" } },
        },
      ],
      expected: /unsupported source kind/i,
    },
    {
      name: "paths outside the protected source directory",
      records: [
        {
          ...record,
          sources: {
            ...record.sources,
            en: { ...edition, path: "FC web site files/../secret.pdf" },
          },
        },
      ],
      expected: /outside FC web site files/i,
    },
    {
      name: "cookbook paths",
      records: [
        {
          ...record,
          sources: {
            ...record.sources,
            en: {
              ...edition,
              path: "FC web site files/Cooking to Heal/book.pdf",
            },
          },
        },
      ],
      expected: /cookbook/i,
    },
  ];

  for (const { name, records, expected } of invalidCatalogs) {
    assert.throws(
      () => validateSourceCatalog(records, { existsSync: () => true }),
      expected,
      name,
    );
  }

  assert.throws(
    () => validateSourceCatalog([record], { existsSync: () => false }),
    /does not exist/i,
  );
});

test("the cookbook and publication binaries are absent from Git", () => {
  const tracked = execFileSync("git", ["ls-files", "-z"], {
    encoding: "utf8",
  })
    .split("\0")
    .filter(Boolean);

  assert.equal(
    tracked.some((path) => /cuisiner|cooking.to.heal/i.test(path)),
    false,
  );
  assert.equal(
    tracked.some((path) => /^FC web site files(?:\/|\.zip$)/.test(path)),
    false,
  );
  assert.equal(
    tracked.some((path) => /^\.publication-work\//.test(path)),
    false,
  );
});

async function createTestPdf(outputPath, pageCount = 10) {
  const document = await PDFDocument.create();
  const font = await document.embedFont(StandardFonts.Helvetica);

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const page = document.addPage([320, 480]);
    page.drawText(`Page ${pageNumber}`, {
      x: 40,
      y: 420,
      size: 24,
      font,
    });
  }

  await writeFile(outputPath, await document.save());
}

test("file helpers hash content and replace formatted JSON atomically", async (t) => {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "publication-files-"),
  );
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));

  const sourcePath = path.join(temporaryDirectory, "source.txt");
  const outputPath = path.join(temporaryDirectory, "manifest.json");
  await writeFile(sourcePath, "Family Clinic publications\n");

  const firstHash = await sha256File(sourcePath);
  const secondHash = await sha256File(sourcePath);
  assert.match(firstHash, /^[a-f0-9]{64}$/);
  assert.equal(secondHash, firstHash);

  await writeJsonAtomic(outputPath, { title: "Publication", count: 13 });
  assert.equal(
    await readFile(outputPath, "utf8"),
    '{\n  "title": "Publication",\n  "count": 13\n}\n',
  );
});

test("PDF helpers extract ordered pages and render a WebP cover", async (t) => {
  const temporaryDirectory = await mkdtemp(
    path.join(os.tmpdir(), "publication-pdf-"),
  );
  t.after(() => rm(temporaryDirectory, { recursive: true, force: true }));

  const sourcePath = path.join(temporaryDirectory, "source.pdf");
  const previewPath = path.join(temporaryDirectory, "preview.pdf");
  const coverPath = path.join(temporaryDirectory, "cover.webp");
  await createTestPdf(sourcePath);

  const preview = await createPreviewPdf({
    sourcePath,
    pageNumbers: [1, 3, 5, 7, 9, 10],
    outputPath: previewPath,
  });
  assert.deepEqual(preview, { pageCount: 6 });

  const previewDocument = await PDFDocument.load(await readFile(previewPath));
  assert.equal(previewDocument.getPageCount(), 6);

  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...arguments_) => warnings.push(arguments_.join(" "));
  let cover;
  try {
    cover = await renderPageWebp({
      sourcePath,
      pageNumber: 1,
      outputPath: coverPath,
      width: 640,
    });
  } finally {
    console.warn = originalWarn;
  }

  assert.equal(
    warnings.some((warning) => warning.includes("standardFontDataUrl")),
    false,
  );
  assert.equal(cover.width, 640);
  assert.ok(cover.height > 640);

  const webp = await readFile(coverPath);
  assert.ok(webp.length > 100);
  assert.equal(webp.subarray(0, 4).toString("ascii"), "RIFF");
  assert.equal(webp.subarray(8, 12).toString("ascii"), "WEBP");
});

test("document command wrappers pass separate safe arguments", async () => {
  const calls = [];
  const run = async (command, args) => {
    calls.push({ command, args });
  };

  const convertedPath = await convertWordToPdf({
    sourcePath: "/sources/diabetes edition.docx",
    outputDir: "/staging/converted",
    run,
  });
  await linearizePdf({
    sourcePath: "/sources/full edition.pdf",
    outputPath: "/staging/full-v1.pdf",
    run,
  });

  assert.equal(convertedPath, "/staging/converted/diabetes edition.pdf");
  assert.deepEqual(calls, [
    {
      command: "soffice",
      args: [
        "--headless",
        "--convert-to",
        "pdf",
        "--outdir",
        "/staging/converted",
        "/sources/diabetes edition.docx",
      ],
    },
    {
      command: "qpdf",
      args: [
        "--linearize",
        "/sources/full edition.pdf",
        "/staging/full-v1.pdf",
      ],
    },
  ]);
});

test("preview selections contain six to eight unique valid pages", () => {
  assert.equal(typeof PREVIEW_PAGES, "object");

  const invalidSelections = [
    { pages: [1, 2, 3, 4, 5], expected: /six to eight/i },
    { pages: [1, 2, 3, 4, 5, 6, 7, 8, 9], expected: /six to eight/i },
    { pages: [1, 2, 3, 4, 5, 5], expected: /unique/i },
    { pages: [0, 1, 2, 3, 4, 5], expected: /one-based/i },
    { pages: [1, 2, 3, 4, 5, 11], expected: /outside/i },
    { pages: [2, 3, 4, 5, 6, 7], expected: /page 1/i },
  ];

  for (const { pages, expected } of invalidSelections) {
    assert.throws(
      () =>
        validatePreviewPages(pages, {
          pageCount: 10,
          id: "example",
          locale: "en",
        }),
      expected,
    );
  }

  const selection = [1, 2, 4, 6, 8, 10];
  assert.strictEqual(
    validatePreviewPages(selection, {
      pageCount: 10,
      id: "example",
      locale: "en",
    }),
    selection,
  );
});

test("every localized edition has a reviewed preview and text-layer decision", () => {
  for (const publication of SOURCE_PUBLICATIONS) {
    for (const locale of ["en", "fr", "ar"]) {
      const pages = PREVIEW_PAGES[publication.id]?.[locale];
      assert.ok(
        Array.isArray(pages) && pages.length >= 6 && pages.length <= 8,
        `${publication.id}/${locale} needs a reviewed preview`,
      );
      assert.equal(
        typeof TEXT_LAYER_SUITABILITY[publication.id]?.[locale],
        "boolean",
        `${publication.id}/${locale} needs a text-layer decision`,
      );
    }
  }
});

test("edition preparation converts Word sources and measures final assets", async () => {
  const events = [];
  let writtenMetadata;
  const dependencies = {
    mkdir: async (directory) => events.push(["mkdir", directory]),
    convertWordToPdf: async ({ sourcePath, outputDir }) => {
      events.push(["convert", sourcePath, outputDir]);
      return "/converted/diabetes.pdf";
    },
    describePdf: async (filePath) => {
      events.push(["describe-pdf", filePath]);
      if (filePath.endsWith("preview.pdf")) {
        return { pageCount: 6, size: 600, sha256: "b".repeat(64) };
      }
      return { pageCount: 10, size: 1_000, sha256: "a".repeat(64) };
    },
    renderPageWebp: async (options) => {
      events.push(["render-cover", options.sourcePath, options.pageNumber]);
      return { width: 640, height: 960 };
    },
    createPreviewPdf: async (options) => {
      events.push([
        "create-preview",
        options.sourcePath,
        options.pageNumbers,
      ]);
      return { pageCount: options.pageNumbers.length };
    },
    linearizePdf: async (options) => {
      events.push(["linearize", options.sourcePath, options.outputPath]);
    },
    describeImage: async (filePath) => {
      events.push(["describe-image", filePath]);
      return {
        width: 640,
        height: 960,
        size: 200,
        sha256: "c".repeat(64),
      };
    },
    writeJsonAtomic: async (filePath, value) => {
      events.push(["write-metadata", filePath]);
      writtenMetadata = value;
    },
  };
  const publication = {
    id: "diabetes-hyperinsulinism",
    category: "conditions",
    sources: {
      en: { kind: "word", path: "/sources/diabetes.docx" },
    },
  };

  await preparePublicationEdition({
    publication,
    locale: "en",
    previewPages: [1, 2, 4, 6, 8, 10],
    textLayer: true,
    workRoot: "/work",
    dependencies,
  });

  const significantEvents = events.filter(([name]) =>
    ["convert", "render-cover", "create-preview", "linearize"].includes(
      name,
    ),
  );
  assert.deepEqual(significantEvents, [
    [
      "convert",
      "/sources/diabetes.docx",
      "/work/converted/diabetes-hyperinsulinism/en",
    ],
    ["render-cover", "/converted/diabetes.pdf", 1],
    [
      "create-preview",
      "/converted/diabetes.pdf",
      [1, 2, 4, 6, 8, 10],
    ],
    [
      "linearize",
      "/converted/diabetes.pdf",
      "/work/prepared/diabetes-hyperinsulinism/en/v1/full.pdf",
    ],
    [
      "linearize",
      "/work/staging/diabetes-hyperinsulinism/en/v1/preview-unlinearized.pdf",
      "/work/prepared/diabetes-hyperinsulinism/en/v1/preview.pdf",
    ],
  ]);
  assert.deepEqual(writtenMetadata, {
    id: "diabetes-hyperinsulinism",
    locale: "en",
    version: "v1",
    textLayer: true,
    full: {
      path: "full.pdf",
      pageCount: 10,
      size: 1_000,
      sha256: "a".repeat(64),
    },
    preview: {
      path: "preview.pdf",
      pageCount: 6,
      size: 600,
      sha256: "b".repeat(64),
      pages: [1, 2, 4, 6, 8, 10],
    },
    cover: {
      path: "cover.webp",
      width: 640,
      height: 960,
      size: 200,
      sha256: "c".repeat(64),
    },
  });
});

test("edition preparation preserves a supplied PDF as the full source", async () => {
  const conversions = [];
  const linearizations = [];
  const dependencies = {
    mkdir: async () => {},
    convertWordToPdf: async (options) => conversions.push(options),
    describePdf: async (filePath) => ({
      pageCount: filePath.endsWith("preview.pdf") ? 6 : 10,
      size: 100,
      sha256: "a".repeat(64),
    }),
    renderPageWebp: async () => ({ width: 640, height: 960 }),
    createPreviewPdf: async () => ({ pageCount: 6 }),
    linearizePdf: async (options) => linearizations.push(options),
    describeImage: async () => ({
      width: 640,
      height: 960,
      size: 100,
      sha256: "b".repeat(64),
    }),
    writeJsonAtomic: async () => {},
  };

  await preparePublicationEdition({
    publication: {
      id: "enzymes",
      sources: { en: { kind: "pdf", path: "/sources/enzymes.pdf" } },
    },
    locale: "en",
    previewPages: [1, 2, 3, 4, 5, 6],
    textLayer: true,
    workRoot: "/work",
    dependencies,
  });

  assert.deepEqual(conversions, []);
  assert.equal(linearizations[0].sourcePath, "/sources/enzymes.pdf");
});
