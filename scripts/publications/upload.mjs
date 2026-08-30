import { createReadStream } from "node:fs";
import { mkdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  HeadObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { sha256File, writeJsonAtomic } from "./lib/files.mjs";
import { SOURCE_PUBLICATIONS } from "./source-catalog.mjs";
import {
  createStorageClient,
  PUBLIC_BASE_URL,
  STORAGE_BUCKET,
} from "./storage.mjs";

const VERSION = "v1";
const LOCALES = ["en", "fr", "ar"];
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const ASSET_DEFINITIONS = {
  cover: { fileName: "cover.webp", contentType: "image/webp" },
  preview: { fileName: "preview.pdf", contentType: "application/pdf" },
  full: { fileName: "full.pdf", contentType: "application/pdf" },
};

export { createStorageClient } from "./storage.mjs";

function contentDisposition({ id, locale, kind }) {
  if (kind === "full") {
    return `attachment; filename="${id}-${locale}.pdf"`;
  }
  if (kind === "preview") {
    return `inline; filename="${id}-${locale}-preview.pdf"`;
  }
  return undefined;
}

export function buildPutObjectInput(asset) {
  const definition = ASSET_DEFINITIONS[asset.kind];
  if (!definition) {
    throw new Error(`Unsupported publication asset kind: ${asset.kind}`);
  }

  return {
    Bucket: STORAGE_BUCKET,
    Key: asset.objectKey,
    Body: createReadStream(asset.localPath),
    ContentType: definition.contentType,
    ContentDisposition: contentDisposition(asset),
    CacheControl: CACHE_CONTROL,
    Metadata: { sha256: asset.sha256 },
    IfNoneMatch: "*",
  };
}

function isMissingObject(error) {
  return (
    error?.name === "NotFound" ||
    error?.name === "NoSuchKey" ||
    error?.$metadata?.httpStatusCode === 404
  );
}

function isConditionalConflict(error) {
  return (
    error?.name === "PreconditionFailed" ||
    error?.name === "ConditionalRequestConflict" ||
    error?.$metadata?.httpStatusCode === 409 ||
    error?.$metadata?.httpStatusCode === 412
  );
}

async function headObject(client, asset) {
  try {
    return await client.send(
      new HeadObjectCommand({ Bucket: STORAGE_BUCKET, Key: asset.objectKey }),
    );
  } catch (error) {
    if (isMissingObject(error)) return undefined;
    throw error;
  }
}

function matchesExpectedObject(existing, asset) {
  const definition = ASSET_DEFINITIONS[asset.kind];
  return (
    Number(existing.ContentLength) === asset.size &&
    existing.Metadata?.sha256 === asset.sha256 &&
    existing.ContentType === definition.contentType &&
    existing.CacheControl === CACHE_CONTROL &&
    (existing.ContentDisposition ?? undefined) ===
      contentDisposition(asset)
  );
}

function requireMatchingObject(existing, asset) {
  if (existing && matchesExpectedObject(existing, asset)) return;
  throw new Error(`Immutable object conflict at ${asset.objectKey}`);
}

function validatePublicationIds(publicationIds) {
  const knownIds = new Set(SOURCE_PUBLICATIONS.map(({ id }) => id));
  if (!Array.isArray(publicationIds) || publicationIds.length === 0) {
    throw new Error("At least one publication ID is required");
  }
  if (new Set(publicationIds).size !== publicationIds.length) {
    throw new Error("Duplicate publication IDs are not allowed");
  }
  for (const id of publicationIds) {
    if (!knownIds.has(id)) {
      throw new Error(`Unknown publication ID: ${id}`);
    }
  }
}

function validateMetadata(metadata, { id, locale }) {
  if (
    metadata.id !== id ||
    metadata.locale !== locale ||
    metadata.version !== VERSION
  ) {
    throw new Error(
      `Invalid prepared metadata for ${id}/${locale}; expected version ${VERSION}`,
    );
  }
  if (typeof metadata.textLayer !== "boolean") {
    throw new Error(`Invalid text-layer decision for ${id}/${locale}`);
  }
}

async function planEditionAssets({ preparedRoot, id, locale }) {
  const directory = path.resolve(preparedRoot, id, locale, VERSION);
  const metadataPath = path.join(directory, "metadata.json");
  const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
  validateMetadata(metadata, { id, locale });

  const assets = [];
  for (const [kind, definition] of Object.entries(ASSET_DEFINITIONS)) {
    const details = metadata[kind];
    if (!details || details.path !== definition.fileName) {
      throw new Error(`Invalid ${kind} metadata path for ${id}/${locale}`);
    }
    if (
      !Number.isInteger(details.size) ||
      details.size <= 0 ||
      !/^[a-f0-9]{64}$/.test(details.sha256)
    ) {
      throw new Error(`Invalid ${kind} metadata for ${id}/${locale}`);
    }

    const localPath = path.join(directory, definition.fileName);
    const [fileDetails, actualHash] = await Promise.all([
      stat(localPath),
      sha256File(localPath),
    ]);
    if (fileDetails.size !== details.size || actualHash !== details.sha256) {
      throw new Error(`Local ${kind} integrity mismatch for ${id}/${locale}`);
    }

    assets.push({
      id,
      locale,
      kind,
      localPath,
      objectKey: `publications/${id}/${locale}/${VERSION}/${definition.fileName}`,
      size: details.size,
      sha256: details.sha256,
    });
  }

  return { metadata, assets };
}

function publicAsset({ id, locale, kind, details, publicBaseUrl }) {
  const fileName = ASSET_DEFINITIONS[kind].fileName;
  const asset = {
    ...details,
    url: `${publicBaseUrl}/publications/${id}/${locale}/${VERSION}/${fileName}`,
  };
  if (kind === "full") {
    asset.filename = `${id}-${locale}.pdf`;
  }
  return asset;
}

async function publishImmutableAsset(client, asset) {
  const existing = await headObject(client, asset);

  if (existing) {
    requireMatchingObject(existing, asset);
    return "skipped";
  }

  const input = buildPutObjectInput(asset);
  try {
    await client.send(new PutObjectCommand(input));
  } catch (error) {
    if (!isConditionalConflict(error)) throw error;
    requireMatchingObject(await headObject(client, asset), asset);
    return "skipped";
  } finally {
    input.Body.destroy();
  }
  return "uploaded";
}

export async function uploadPreparedAssets({
  client,
  preparedRoot = ".publication-work/prepared",
  publicBaseUrl = PUBLIC_BASE_URL,
  publicationIds = SOURCE_PUBLICATIONS.map(({ id }) => id),
  manifestPath,
}) {
  if (!client || typeof client.send !== "function") {
    throw new Error("An S3 client is required");
  }
  if (publicBaseUrl !== PUBLIC_BASE_URL) {
    throw new Error(`Public base URL must be ${PUBLIC_BASE_URL}`);
  }
  validatePublicationIds(publicationIds);

  const plannedPublications = [];
  const objectKeys = new Set();
  for (const id of publicationIds) {
    const editions = {};
    for (const locale of LOCALES) {
      const edition = await planEditionAssets({ preparedRoot, id, locale });
      for (const asset of edition.assets) {
        if (objectKeys.has(asset.objectKey)) {
          throw new Error(`Duplicate object key planned: ${asset.objectKey}`);
        }
        objectKeys.add(asset.objectKey);
      }
      editions[locale] = edition;
    }
    plannedPublications.push({ id, editions });
  }

  for (const { editions } of plannedPublications) {
    for (const locale of LOCALES) {
      for (const asset of editions[locale].assets) {
        await publishImmutableAsset(client, asset);
      }
    }
  }

  const manifest = {
    schemaVersion: 1,
    publicBaseUrl,
    publications: plannedPublications.map(({ id, editions }) => ({
      id,
      editions: Object.fromEntries(
        LOCALES.map((locale) => {
          const { metadata } = editions[locale];
          return [
            locale,
            {
              version: VERSION,
              textLayer: metadata.textLayer,
              full: publicAsset({
                id,
                locale,
                kind: "full",
                details: metadata.full,
                publicBaseUrl,
              }),
              preview: publicAsset({
                id,
                locale,
                kind: "preview",
                details: metadata.preview,
                publicBaseUrl,
              }),
              cover: publicAsset({
                id,
                locale,
                kind: "cover",
                details: metadata.cover,
                publicBaseUrl,
              }),
            },
          ];
        }),
      ),
    })),
  };

  if (manifestPath) {
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await writeJsonAtomic(manifestPath, manifest);
  }
  return manifest;
}

function parseArguments(arguments_) {
  const options = { publicationIds: [], manifestPath: undefined, all: false };
  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];
    if (argument === "--all") {
      options.all = true;
    } else if (argument === "--publication") {
      options.publicationIds.push(arguments_[index + 1]);
      index += 1;
    } else if (argument === "--manifest") {
      options.manifestPath = arguments_[index + 1];
      index += 1;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!options.manifestPath) {
    throw new Error("--manifest is required");
  }
  if (options.all === (options.publicationIds.length > 0)) {
    throw new Error("Choose either --all or one or more --publication values");
  }
  return options;
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const publicationIds = options.all
    ? SOURCE_PUBLICATIONS.map(({ id }) => id)
    : options.publicationIds;
  const client = createStorageClient();

  try {
    const manifest = await uploadPreparedAssets({
      client,
      publicationIds,
      manifestPath: options.manifestPath,
    });
    const editionCount = manifest.publications.reduce(
      (count, publication) =>
        count + Object.keys(publication.editions).length,
      0,
    );
    console.log(
      `Published ${manifest.publications.length} publications (${editionCount} editions).`,
    );
  } finally {
    client.destroy();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
