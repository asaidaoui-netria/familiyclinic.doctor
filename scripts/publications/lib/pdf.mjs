import { execFile } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import {
  createCanvas,
  DOMMatrix,
  ImageData,
  Path2D,
} from "@napi-rs/canvas";
import { PDFDocument } from "pdf-lib";

const execFileAsync = promisify(execFile);
const STANDARD_FONT_DATA_URL = fileURLToPath(
  new URL("../../../node_modules/pdfjs-dist/standard_fonts/", import.meta.url),
);

async function runCommand(command, args) {
  await execFileAsync(command, args);
}

export async function createPreviewPdf({
  sourcePath,
  pageNumbers,
  outputPath,
}) {
  const sourceDocument = await PDFDocument.load(await readFile(sourcePath));
  const sourcePageCount = sourceDocument.getPageCount();

  if (!Array.isArray(pageNumbers) || pageNumbers.length === 0) {
    throw new TypeError("pageNumbers must be a non-empty array");
  }

  for (const pageNumber of pageNumbers) {
    if (
      !Number.isInteger(pageNumber) ||
      pageNumber < 1 ||
      pageNumber > sourcePageCount
    ) {
      throw new RangeError(
        `preview page ${pageNumber} is outside the source PDF's 1-${sourcePageCount} page range`,
      );
    }
  }

  const previewDocument = await PDFDocument.create();
  const copiedPages = await previewDocument.copyPages(
    sourceDocument,
    pageNumbers.map((pageNumber) => pageNumber - 1),
  );

  for (const page of copiedPages) {
    previewDocument.addPage(page);
  }

  await writeFile(outputPath, await previewDocument.save());
  return { pageCount: copiedPages.length };
}

function exposeCanvasGlobals() {
  globalThis.DOMMatrix ??= DOMMatrix;
  globalThis.ImageData ??= ImageData;
  globalThis.Path2D ??= Path2D;
}

export async function renderPageWebp({
  sourcePath,
  pageNumber,
  outputPath,
  width,
}) {
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    throw new RangeError("pageNumber must be a positive one-based integer");
  }
  if (!Number.isInteger(width) || width < 1) {
    throw new RangeError("width must be a positive integer");
  }

  exposeCanvasGlobals();
  const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const loadingTask = getDocument({
    data: new Uint8Array(await readFile(sourcePath)),
    standardFontDataUrl: STANDARD_FONT_DATA_URL,
  });
  const document = await loadingTask.promise;

  try {
    if (pageNumber > document.numPages) {
      throw new RangeError(
        `render page ${pageNumber} is outside the source PDF's 1-${document.numPages} page range`,
      );
    }

    const page = await document.getPage(pageNumber);
    const naturalViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: width / naturalViewport.width });
    const intrinsicWidth = Math.round(viewport.width);
    const intrinsicHeight = Math.round(viewport.height);
    const canvas = createCanvas(intrinsicWidth, intrinsicHeight);
    const context = canvas.getContext("2d");

    await page.render({ canvasContext: context, viewport }).promise;
    await writeFile(outputPath, await canvas.encode("webp", 82));

    return { width: intrinsicWidth, height: intrinsicHeight };
  } finally {
    await loadingTask.destroy();
  }
}

export async function convertWordToPdf({
  sourcePath,
  outputDir,
  run = runCommand,
}) {
  await run("soffice", [
    "--headless",
    "--convert-to",
    "pdf",
    "--outdir",
    outputDir,
    sourcePath,
  ]);

  return path.join(outputDir, `${path.parse(sourcePath).name}.pdf`);
}

export async function linearizePdf({
  sourcePath,
  outputPath,
  run = runCommand,
}) {
  await run("qpdf", ["--linearize", sourcePath, outputPath]);
}
