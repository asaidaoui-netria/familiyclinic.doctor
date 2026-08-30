import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const DEFAULT_ORIGIN = "https://www.familyclinic.doctor";
const MANIFEST_PATH = "src/_data/publication-assets.json";
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const ASSET_KINDS = ["cover", "preview", "full"];
const MAX_CONCURRENCY = 4;

function fail(context, message) {
  throw new Error(`${context}: ${message}`);
}

function requireHeader(response, name, expected, context) {
  const actual = response.headers.get(name);
  if (actual !== expected) {
    fail(context, `expected ${name} ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`);
  }
}

function validateCommonHeaders({ response, asset, kind, origin, context }) {
  requireHeader(response, "access-control-allow-origin", origin, context);
  requireHeader(response, "cache-control", CACHE_CONTROL, context);
  requireHeader(
    response,
    "content-type",
    kind === "cover" ? "image/webp" : "application/pdf",
    context,
  );

  const etag = response.headers.get("etag");
  if (!etag) {
    fail(context, "missing ETag");
  }

  const remoteHash = response.headers.get("x-amz-meta-sha256");
  if (remoteHash && remoteHash !== asset.sha256) {
    fail(context, "x-amz-meta-sha256 does not match the manifest");
  }

  const disposition = response.headers.get("content-disposition") ?? "";
  if (kind === "preview" && !/^inline(?:;|$)/i.test(disposition)) {
    fail(context, "preview content-disposition must be inline");
  }
  if (kind === "full" && !/^attachment(?:;|$)/i.test(disposition)) {
    fail(context, "full content-disposition must be attachment");
  }
}

async function fetchWithContext(fetchImpl, url, options, context, label) {
  try {
    return await fetchImpl(url, options);
  } catch (error) {
    fail(context, `${label} request failed: ${error?.message ?? error}`);
  }
}

async function verifyAsset({ fetchImpl, origin, id, locale, kind, asset }) {
  const context = `${id}/${locale}/${kind}`;
  if (!asset || typeof asset.url !== "string") {
    fail(context, "missing manifest asset URL");
  }
  if (!Number.isInteger(asset.size) || asset.size <= 0) {
    fail(context, "manifest size must be a positive integer");
  }
  if (!/^[a-f0-9]{64}$/.test(asset.sha256)) {
    fail(context, "manifest SHA-256 is invalid");
  }

  const headResponse = await fetchWithContext(
    fetchImpl,
    asset.url,
    {
      method: "HEAD",
      headers: { Origin: origin },
    },
    context,
    "HEAD",
  );
  if (headResponse.status !== 200) {
    fail(context, `HEAD returned ${headResponse.status}, expected 200`);
  }
  validateCommonHeaders({
    response: headResponse,
    asset,
    kind,
    origin,
    context,
  });
  requireHeader(headResponse, "content-length", String(asset.size), context);

  if (kind === "cover") {
    return;
  }

  const rangeResponse = await fetchWithContext(
    fetchImpl,
    asset.url,
    {
      method: "GET",
      headers: { Origin: origin, Range: "bytes=0-1023" },
    },
    context,
    "range GET",
  );
  if (rangeResponse.status !== 206) {
    fail(context, `range GET returned ${rangeResponse.status}, expected 206`);
  }
  validateCommonHeaders({
    response: rangeResponse,
    asset,
    kind,
    origin,
    context,
  });

  const expectedEnd = Math.min(1_023, asset.size - 1);
  const contentRange = rangeResponse.headers.get("content-range");
  if (contentRange !== `bytes 0-${expectedEnd}/${asset.size}`) {
    fail(
      context,
      `invalid content-range ${JSON.stringify(contentRange)}; expected bytes 0-${expectedEnd}/${asset.size}`,
    );
  }
  requireHeader(
    rangeResponse,
    "content-length",
    String(expectedEnd + 1),
    context,
  );
  await rangeResponse.body?.cancel();
}

function flattenAssets(manifest) {
  if (!Array.isArray(manifest?.publications)) {
    throw new Error("Publication asset manifest is invalid");
  }

  return manifest.publications.flatMap(({ id, editions }) =>
    Object.entries(editions ?? {}).flatMap(([locale, edition]) =>
      ASSET_KINDS.filter((kind) => edition[kind]).map((kind) => ({
        id,
        locale,
        kind,
        asset: edition[kind],
      })),
    ),
  );
}

async function runWithConcurrency(tasks, worker, limit) {
  let cursor = 0;
  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    async () => {
      while (cursor < tasks.length) {
        const task = tasks[cursor];
        cursor += 1;
        await worker(task);
      }
    },
  );
  await Promise.all(workers);
}

export async function verifyPublishedAssets({
  manifest,
  fetchImpl = fetch,
  origin = DEFAULT_ORIGIN,
}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("fetchImpl must be a function");
  }
  const assets = flattenAssets(manifest);
  let pdfRangeRequests = 0;

  await runWithConcurrency(
    assets,
    async (task) => {
      await verifyAsset({ ...task, fetchImpl, origin });
      if (task.kind !== "cover") {
        pdfRangeRequests += 1;
      }
    },
    MAX_CONCURRENCY,
  );

  return { assets: assets.length, pdfRangeRequests };
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  const result = await verifyPublishedAssets({ manifest });
  console.log(
    `Verified ${result.assets} public assets and ${result.pdfRangeRequests} PDF range responses.`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
