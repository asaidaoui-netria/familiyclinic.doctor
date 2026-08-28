import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { PDFDocument, StandardFonts } from "pdf-lib";

import { SOURCE_PUBLICATIONS } from "../scripts/publications/source-catalog.mjs";
import { validateSourceCatalog } from "../scripts/publications/lib/catalog.mjs";
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

test("the source catalog contains thirteen complete localized publications", () => {
  const records = validateSourceCatalog(SOURCE_PUBLICATIONS, { existsSync });

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
