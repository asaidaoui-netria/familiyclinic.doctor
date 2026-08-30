import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { randomUUID } from "node:crypto";

import {
  DeleteObjectCommand,
  GetBucketCorsCommand,
  GetObjectLockConfigurationCommand,
  ListObjectVersionsCommand,
  PutBucketCorsCommand,
  PutObjectCommand,
  PutObjectLockConfigurationCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { sha256File } from "./lib/files.mjs";
import { verifyPublishedAssets } from "./verify-storage.mjs";

export const STORAGE_BUCKET = "familyclinic-doctor-publications";
export const STORAGE_REGION = "nbg1";
export const STORAGE_ENDPOINT = "https://nbg1.your-objectstorage.com";
export const PUBLIC_BASE_URL =
  "https://familyclinic-doctor-publications.nbg1.your-objectstorage.com";
const CACHE_CONTROL = "public, max-age=31536000, immutable";
const DEFAULT_ORIGIN = "https://www.familyclinic.doctor";
const STORAGE_ACTIONS = new Set([
  "status",
  "apply-cors",
  "probe",
  "set-retention",
]);

function requireEnvironmentValue(env, name) {
  const value = env[name];
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${name} is required`);
  }
  return value.trim();
}

export function createStorageClient(env = process.env) {
  const accessKeyId = requireEnvironmentValue(
    env,
    "HETZNER_S3_ACCESS_KEY_ID",
  );
  const secretAccessKey = requireEnvironmentValue(
    env,
    "HETZNER_S3_SECRET_ACCESS_KEY",
  );

  return new S3Client({
    region: STORAGE_REGION,
    endpoint: STORAGE_ENDPOINT,
    credentials: { accessKeyId, secretAccessKey },
  });
}

export function parseStorageAction(arguments_) {
  if (arguments_.length === 0) {
    throw new Error("Choose a storage action");
  }
  if (arguments_.length !== 1) {
    throw new Error("Provide exactly one storage action");
  }
  const [action] = arguments_;
  if (!STORAGE_ACTIONS.has(action)) {
    throw new Error(`Unsupported storage action: ${action}`);
  }
  return action;
}

export function buildStorageCorsInput(corsDocument) {
  if (!Array.isArray(corsDocument?.CORSRules)) {
    throw new Error("Storage CORS document must define CORSRules");
  }
  return {
    Bucket: STORAGE_BUCKET,
    CORSConfiguration: corsDocument,
  };
}

export function buildGovernanceRetentionInput() {
  return {
    Bucket: STORAGE_BUCKET,
    ObjectLockConfiguration: {
      ObjectLockEnabled: "Enabled",
      Rule: {
        DefaultRetention: {
          Mode: "GOVERNANCE",
          Days: 365,
        },
      },
    },
  };
}

export async function runStorageAction({ action, client, corsDocument }) {
  if (!client || typeof client.send !== "function") {
    throw new Error("An S3 client is required");
  }
  if (action === "apply-cors") {
    await client.send(
      new PutBucketCorsCommand(buildStorageCorsInput(corsDocument)),
    );
    return;
  }
  if (action === "set-retention") {
    await client.send(
      new PutObjectLockConfigurationCommand(
        buildGovernanceRetentionInput(),
      ),
    );
    return;
  }
  if (action === "status") {
    let cors = {};
    try {
      cors = await client.send(
        new GetBucketCorsCommand({ Bucket: STORAGE_BUCKET }),
      );
    } catch (error) {
      if (
        error?.name !== "NoSuchCORSConfiguration" &&
        error?.$metadata?.httpStatusCode !== 404
      ) {
        throw error;
      }
    }
    const lock = await client.send(
      new GetObjectLockConfigurationCommand({ Bucket: STORAGE_BUCKET }),
    );
    return {
      bucket: STORAGE_BUCKET,
      region: STORAGE_REGION,
      endpoint: STORAGE_ENDPOINT,
      publicBaseUrl: PUBLIC_BASE_URL,
      corsRules: cors.CORSRules ?? [],
      objectLock: lock.ObjectLockConfiguration ?? {},
    };
  }
  throw new Error(`Unsupported storage action: ${action}`);
}

export async function runStorageProbe({
  client,
  localPath,
  fetchImpl = fetch,
  origin = DEFAULT_ORIGIN,
}) {
  if (!client || typeof client.send !== "function") {
    throw new Error("An S3 client is required");
  }
  if (typeof localPath !== "string" || localPath.trim() === "") {
    throw new Error("A local probe PDF is required");
  }

  const [{ size }, sha256] = await Promise.all([
    stat(localPath),
    sha256File(localPath),
  ]);
  const key = `staging/pdf-delivery-probe-${sha256.slice(0, 16)}-${randomUUID()}.pdf`;
  const upload = await client.send(
    new PutObjectCommand({
      Bucket: STORAGE_BUCKET,
      Key: key,
      Body: createReadStream(localPath),
      ContentType: "application/pdf",
      ContentDisposition: 'inline; filename="pdf-delivery-probe.pdf"',
      CacheControl: CACHE_CONTROL,
      Metadata: { sha256 },
    }),
  );

  let result;
  try {
    if (!upload.VersionId) {
      throw new Error("Storage probe upload did not return a version ID");
    }
    result = await verifyPublishedAssets({
      manifest: {
        publications: [
          {
            id: "storage-probe",
            editions: {
              en: {
                preview: {
                  url: `${PUBLIC_BASE_URL}/${key}`,
                  size,
                  sha256,
                },
              },
            },
          },
        ],
      },
      fetchImpl,
      origin,
    });
  } finally {
    let versionIds = upload.VersionId ? [upload.VersionId] : [];
    if (versionIds.length === 0) {
      const listed = await client.send(
        new ListObjectVersionsCommand({
          Bucket: STORAGE_BUCKET,
          Prefix: key,
        }),
      );
      versionIds = [
        ...(listed.Versions ?? []),
        ...(listed.DeleteMarkers ?? []),
      ]
        .filter((entry) => entry.Key === key && entry.VersionId)
        .map((entry) => entry.VersionId);
      if (versionIds.length === 0) {
        throw new Error(
          `Storage probe could not locate the uploaded version at ${key}`,
        );
      }
    }
    for (const versionId of versionIds) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: STORAGE_BUCKET,
          Key: key,
          VersionId: versionId,
          BypassGovernanceRetention: true,
        }),
      );
    }
  }
  return { ...result, key, size, sha256 };
}

async function main() {
  const action = parseStorageAction(process.argv.slice(2));
  const client = createStorageClient();
  try {
    let result;
    if (action === "probe") {
      result = await runStorageProbe({
        client,
        localPath:
          ".publication-work/prepared/enzymes/en/v1/preview.pdf",
      });
    } else {
      const corsDocument =
        action === "apply-cors"
          ? JSON.parse(await readFile("infra/hetzner/cors.json", "utf8"))
          : undefined;
      result = await runStorageAction({ action, client, corsDocument });
    }
    if (result) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`Storage action completed: ${action}`);
    }
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
