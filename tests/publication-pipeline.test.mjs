import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
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
import * as storageModule from "../scripts/publications/storage.mjs";
import * as uploadModule from "../scripts/publications/upload.mjs";
import { verifyPublishedAssets } from "../scripts/publications/verify-storage.mjs";

const PUBLICATION_LOCALES = ["en", "fr", "ar"];
const STORAGE_BASE_URL =
  "https://familyclinic-doctor-publications.nbg1.your-objectstorage.com";
const { buildPutObjectInput, uploadPreparedAssets } = uploadModule;

async function createPreparedFixture(publicationIds) {
  const root = await mkdtemp(path.join(os.tmpdir(), "publication-upload-"));

  for (const id of publicationIds) {
    for (const locale of PUBLICATION_LOCALES) {
      const directory = path.join(root, id, locale, "v1");
      await mkdir(directory, { recursive: true });
      const files = {
        cover: {
          path: "cover.webp",
          content: Buffer.from(`${id}-${locale}-cover`),
          width: 640,
          height: 900,
        },
        preview: {
          path: "preview.pdf",
          content: Buffer.from(`${id}-${locale}-preview`),
          pageCount: 7,
          pages: [1, 3, 5, 7, 9, 11, 13],
        },
        full: {
          path: "full.pdf",
          content: Buffer.from(`${id}-${locale}-full`),
          pageCount: 20,
        },
      };

      for (const file of Object.values(files)) {
        await writeFile(path.join(directory, file.path), file.content);
        file.size = file.content.length;
        file.sha256 = await sha256File(path.join(directory, file.path));
        delete file.content;
      }

      await writeFile(
        path.join(directory, "metadata.json"),
        `${JSON.stringify(
          {
            id,
            locale,
            version: "v1",
            textLayer: !(id === "pregnancy" && locale === "ar"),
            full: files.full,
            preview: files.preview,
            cover: files.cover,
          },
          null,
          2,
        )}\n`,
      );
    }
  }

  return root;
}

function createFakeS3Client({ existing = new Map(), failPutKey } = {}) {
  const commands = [];

  return {
    commands,
    async send(command) {
      commands.push(command);
      const { Key } = command.input;

      if (command.constructor.name === "HeadObjectCommand") {
        if (existing.has(Key)) {
          return existing.get(Key);
        }

        const error = new Error("missing");
        error.name = "NotFound";
        error.$metadata = { httpStatusCode: 404 };
        throw error;
      }

      if (command.constructor.name === "PutObjectCommand") {
        if (Key === failPutKey) {
          command.input.Body.destroy();
          throw new Error("simulated upload failure");
        }

        for await (const _chunk of command.input.Body) {
          // Consume the stream as a real S3 client would.
        }
      }

      return {};
    },
  };
}

test("the Hetzner delivery contract has exact CORS and credential documentation", async () => {
  const cors = JSON.parse(await readFile("infra/hetzner/cors.json", "utf8"));
  assert.deepEqual(cors, {
    CORSRules: [
      {
        AllowedOrigins: [
          "https://www.familyclinic.doctor",
          "https://familyclinic.doctor",
          "http://localhost:8080",
        ],
        AllowedMethods: ["GET", "HEAD"],
        AllowedHeaders: ["*"],
        ExposeHeaders: [
          "Accept-Ranges",
          "Content-Length",
          "Content-Range",
          "Content-Disposition",
          "ETag",
        ],
        MaxAgeSeconds: 3600,
      },
    ],
  });

  const runbook = await readFile(
    "docs/publications-storage-runbook.md",
    "utf8",
  );
  const requiredVariables = [
    "HETZNER_S3_ACCESS_KEY_ID",
    "HETZNER_S3_SECRET_ACCESS_KEY",
  ];

  for (const variable of requiredVariables) {
    assert.match(runbook, new RegExp(`\\b${variable}\\b`));
  }

  assert.match(runbook, /never (?:store|paste|commit).*literal secret/i);
  assert.doesNotMatch(
    runbook,
    /(?:HETZNER_S3_ACCESS_KEY_ID|HETZNER_S3_SECRET_ACCESS_KEY)\s*=\s*["']?[A-Za-z0-9_-]{12,}/,
  );
});

test("the Hetzner client uses the nbg1 endpoint and requires every credential", async () => {
  assert.equal(typeof uploadModule.createStorageClient, "function");
  assert.throws(
    () =>
      uploadModule.createStorageClient({
        HETZNER_S3_ACCESS_KEY_ID: "test-access-key",
      }),
    /HETZNER_S3_SECRET_ACCESS_KEY/,
  );

  const client = uploadModule.createStorageClient({
    HETZNER_S3_ACCESS_KEY_ID: "test-access-key",
    HETZNER_S3_SECRET_ACCESS_KEY: "test-secret-key",
  });
  const endpoint = await client.config.endpoint();

  assert.equal(await client.config.region(), "nbg1");
  assert.equal(
    `${endpoint.protocol}//${endpoint.hostname}`,
    "https://nbg1.your-objectstorage.com",
  );
  client.destroy();
});

test("storage configuration scopes CORS and Governance retention to the publication bucket", async () => {
  assert.equal(typeof storageModule.buildStorageCorsInput, "function");
  assert.equal(
    typeof storageModule.buildGovernanceRetentionInput,
    "function",
  );
  assert.equal(typeof storageModule.runStorageAction, "function");

  const corsDocument = JSON.parse(
    await readFile("infra/hetzner/cors.json", "utf8"),
  );
  assert.deepEqual(storageModule.buildStorageCorsInput(corsDocument), {
    Bucket: "familyclinic-doctor-publications",
    CORSConfiguration: corsDocument,
  });
  assert.deepEqual(storageModule.buildGovernanceRetentionInput(), {
    Bucket: "familyclinic-doctor-publications",
    ObjectLockConfiguration: {
      ObjectLockEnabled: "Enabled",
      Rule: {
        DefaultRetention: {
          Mode: "GOVERNANCE",
          Days: 365,
        },
      },
    },
  });

  const client = createFakeS3Client();
  await storageModule.runStorageAction({
    action: "apply-cors",
    client,
    corsDocument,
  });
  assert.equal(client.commands.length, 1);
  assert.equal(client.commands[0].constructor.name, "PutBucketCorsCommand");
  assert.deepEqual(client.commands[0].input, {
    Bucket: "familyclinic-doctor-publications",
    CORSConfiguration: corsDocument,
  });

  await storageModule.runStorageAction({ action: "set-retention", client });
  assert.equal(client.commands[1].constructor.name, "PutObjectLockConfigurationCommand");
  assert.deepEqual(
    client.commands[1].input,
    storageModule.buildGovernanceRetentionInput(),
  );

  await assert.rejects(
    storageModule.runStorageAction({ action: "delete", client }),
    /unsupported storage action/i,
  );
});

test("storage commands require one explicit safe action", () => {
  assert.equal(typeof storageModule.parseStorageAction, "function");
  for (const action of ["status", "apply-cors", "probe", "set-retention"]) {
    assert.equal(storageModule.parseStorageAction([action]), action);
  }
  assert.throws(() => storageModule.parseStorageAction([]), /choose.*action/i);
  assert.throws(
    () => storageModule.parseStorageAction(["apply-cors", "extra"]),
    /exactly one/i,
  );
  assert.throws(
    () => storageModule.parseStorageAction(["delete"]),
    /unsupported storage action/i,
  );
});

test("storage status reports CORS and Object Lock without changing the bucket", async () => {
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      if (command.constructor.name === "GetBucketCorsCommand") {
        return { CORSRules: [{ AllowedMethods: ["GET", "HEAD"] }] };
      }
      if (command.constructor.name === "GetObjectLockConfigurationCommand") {
        return {
          ObjectLockConfiguration: {
            ObjectLockEnabled: "Enabled",
            Rule: {
              DefaultRetention: { Mode: "GOVERNANCE", Days: 365 },
            },
          },
        };
      }
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  };

  assert.deepEqual(
    await storageModule.runStorageAction({ action: "status", client }),
    {
      bucket: "familyclinic-doctor-publications",
      region: "nbg1",
      endpoint: "https://nbg1.your-objectstorage.com",
      publicBaseUrl:
        "https://familyclinic-doctor-publications.nbg1.your-objectstorage.com",
      corsRules: [{ AllowedMethods: ["GET", "HEAD"] }],
      objectLock: {
        ObjectLockEnabled: "Enabled",
        Rule: {
          DefaultRetention: { Mode: "GOVERNANCE", Days: 365 },
        },
      },
    },
  );
  assert.deepEqual(
    commands.map(({ constructor }) => constructor.name),
    ["GetBucketCorsCommand", "GetObjectLockConfigurationCommand"],
  );
});

test("storage status treats an unconfigured CORS policy as an empty rule set", async () => {
  const client = {
    async send(command) {
      if (command.constructor.name === "GetBucketCorsCommand") {
        const error = new Error("missing CORS");
        error.name = "NoSuchCORSConfiguration";
        error.$metadata = { httpStatusCode: 404 };
        throw error;
      }
      if (command.constructor.name === "GetObjectLockConfigurationCommand") {
        return {
          ObjectLockConfiguration: { ObjectLockEnabled: "Enabled" },
        };
      }
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  };

  const status = await storageModule.runStorageAction({
    action: "status",
    client,
  });
  assert.deepEqual(status.corsRules, []);
  assert.deepEqual(status.objectLock, { ObjectLockEnabled: "Enabled" });
});

test("the delivery probe verifies a staged PDF and permanently removes its version", async () => {
  assert.equal(typeof storageModule.runStorageProbe, "function");
  const directory = await mkdtemp(path.join(os.tmpdir(), "storage-probe-"));
  const localPath = path.join(directory, "probe.pdf");
  await writeFile(localPath, "probe-pdf");
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      if (command.constructor.name === "PutObjectCommand") {
        for await (const _chunk of command.input.Body) {
          // Consume the upload stream as the real client would.
        }
        return { VersionId: "probe-version-1" };
      }
      if (command.constructor.name === "DeleteObjectCommand") return {};
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  };
  const origin = "https://www.familyclinic.doctor";
  const hash =
    "1660cbebd24add5093e748d09bbf42f398d1844b92244128a8e1535bfc35bb4e";
  const commonHeaders = {
    "access-control-allow-origin": origin,
    "cache-control": "public, max-age=31536000, immutable",
    "content-disposition": 'inline; filename="pdf-delivery-probe.pdf"',
    "content-type": "application/pdf",
    etag: '"probe-etag"',
    "x-amz-meta-sha256": hash,
  };
  const fetchImpl = async (_url, options) => {
    if (options.method === "HEAD") {
      return new Response(null, {
        status: 200,
        headers: { ...commonHeaders, "content-length": "9" },
      });
    }
    return new Response(Buffer.from("probe-pdf"), {
      status: 206,
      headers: {
        ...commonHeaders,
        "content-length": "9",
        "content-range": "bytes 0-8/9",
      },
    });
  };

  try {
    const result = await storageModule.runStorageProbe({
      client,
      localPath,
      fetchImpl,
      origin,
    });
    assert.equal(result.assets, 1);
    assert.equal(result.pdfRangeRequests, 1);
    assert.equal(result.size, 9);
    assert.equal(result.sha256, hash);
    assert.match(
      result.key,
      new RegExp(
        `^staging/pdf-delivery-probe-${hash.slice(0, 16)}-[a-f0-9-]+\\.pdf$`,
      ),
    );
    assert.deepEqual(
      commands.map(({ constructor }) => constructor.name),
      ["PutObjectCommand", "DeleteObjectCommand"],
    );
    assert.deepEqual(
      {
        Bucket: commands[0].input.Bucket,
        Key: commands[0].input.Key,
        ContentType: commands[0].input.ContentType,
        ContentDisposition: commands[0].input.ContentDisposition,
        CacheControl: commands[0].input.CacheControl,
        Metadata: commands[0].input.Metadata,
      },
      {
        Bucket: "familyclinic-doctor-publications",
        Key: result.key,
        ContentType: "application/pdf",
        ContentDisposition: 'inline; filename="pdf-delivery-probe.pdf"',
        CacheControl: "public, max-age=31536000, immutable",
        Metadata: { sha256: hash },
      },
    );
    assert.deepEqual(commands[1].input, {
      Bucket: "familyclinic-doctor-publications",
      Key: result.key,
      VersionId: "probe-version-1",
      BypassGovernanceRetention: true,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the delivery probe removes its exact version when public verification fails", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "storage-probe-fail-"));
  const localPath = path.join(directory, "probe.pdf");
  await writeFile(localPath, "probe-pdf");
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      if (command.constructor.name === "PutObjectCommand") {
        for await (const _chunk of command.input.Body) {
          // Consume the upload stream as the real client would.
        }
        return { VersionId: "failed-probe-version" };
      }
      if (command.constructor.name === "DeleteObjectCommand") return {};
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  };

  try {
    await assert.rejects(
      storageModule.runStorageProbe({
        client,
        localPath,
        fetchImpl: async () => new Response(null, { status: 403 }),
      }),
      /HEAD returned 403/i,
    );
    assert.deepEqual(
      commands.map(({ constructor }) => constructor.name),
      ["PutObjectCommand", "DeleteObjectCommand"],
    );
    assert.equal(commands[1].input.VersionId, "failed-probe-version");
    assert.equal(commands[1].input.BypassGovernanceRetention, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("the delivery probe recovers and removes its version when PUT omits the version ID", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "storage-probe-version-"));
  const localPath = path.join(directory, "probe.pdf");
  await writeFile(localPath, "probe-pdf");
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      if (command.constructor.name === "PutObjectCommand") {
        for await (const _chunk of command.input.Body) {
          // Consume the upload stream as the real client would.
        }
        return {};
      }
      if (command.constructor.name === "ListObjectVersionsCommand") {
        return {
          Versions: [
            { Key: command.input.Prefix, VersionId: "recovered-version" },
          ],
        };
      }
      if (command.constructor.name === "DeleteObjectCommand") return {};
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  };

  try {
    await assert.rejects(
      storageModule.runStorageProbe({
        client,
        localPath,
        fetchImpl: async () => {
          throw new Error("verification must not run");
        },
      }),
      /did not return a version ID/i,
    );
    assert.deepEqual(
      commands.map(({ constructor }) => constructor.name),
      ["PutObjectCommand", "ListObjectVersionsCommand", "DeleteObjectCommand"],
    );
    assert.deepEqual(commands[2].input, {
      Bucket: "familyclinic-doctor-publications",
      Key: commands[0].input.Key,
      VersionId: "recovered-version",
      BypassGovernanceRetention: true,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("put inputs use immutable delivery headers and safe dispositions", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "publication-put-"));
  const localPath = path.join(directory, "full.pdf");
  await writeFile(localPath, "pdf");

  try {
    const input = buildPutObjectInput({
      id: "enzymes",
      locale: "fr",
      kind: "full",
      localPath,
      objectKey: "publications/enzymes/fr/v1/full.pdf",
      sha256: "a".repeat(64),
    });

    assert.equal(input.Bucket, "familyclinic-doctor-publications");
    assert.equal(input.Key, "publications/enzymes/fr/v1/full.pdf");
    assert.equal(input.ContentType, "application/pdf");
    assert.equal(
      input.ContentDisposition,
      'attachment; filename="enzymes-fr.pdf"',
    );
    assert.equal(input.CacheControl, "public, max-age=31536000, immutable");
    assert.deepEqual(input.Metadata, { sha256: "a".repeat(64) });
    assert.equal(input.IfNoneMatch, "*");
    input.Body.destroy();
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test("a three-language pilot uploads nine immutable objects", async () => {
  const preparedRoot = await createPreparedFixture(["enzymes"]);
  const client = createFakeS3Client();

  try {
    const manifest = await uploadPreparedAssets({
      client,
      preparedRoot,
      publicBaseUrl: STORAGE_BASE_URL,
      publicationIds: ["enzymes"],
    });
    const puts = client.commands.filter(
      (command) => command.constructor.name === "PutObjectCommand",
    );

    assert.equal(puts.length, 9);
    assert.deepEqual(
      puts.map(({ input }) => input.Key).sort(),
      PUBLICATION_LOCALES.flatMap((locale) => [
        `publications/enzymes/${locale}/v1/cover.webp`,
        `publications/enzymes/${locale}/v1/full.pdf`,
        `publications/enzymes/${locale}/v1/preview.pdf`,
      ]).sort(),
    );
    for (const { input } of puts) {
      assert.equal(input.CacheControl, "public, max-age=31536000, immutable");
      assert.match(input.Metadata.sha256, /^[a-f0-9]{64}$/);
      assert.equal(
        input.ContentType,
        input.Key.endsWith(".webp") ? "image/webp" : "application/pdf",
      );
      if (input.Key.endsWith("preview.pdf")) {
        assert.match(input.ContentDisposition, /^inline;/);
      }
    }
    assert.equal(manifest.publications.length, 1);
    assert.deepEqual(
      Object.keys(manifest.publications[0].editions),
      PUBLICATION_LOCALES,
    );
  } finally {
    await rm(preparedRoot, { recursive: true, force: true });
  }
});

test("the complete manifest contains thirteen IDs and 39 measured editions", async () => {
  const publicationIds = SOURCE_PUBLICATIONS.map(({ id }) => id);
  const preparedRoot = await createPreparedFixture(publicationIds);
  const client = createFakeS3Client();

  try {
    const manifest = await uploadPreparedAssets({
      client,
      preparedRoot,
      publicBaseUrl: STORAGE_BASE_URL,
      publicationIds,
    });

    assert.equal(manifest.schemaVersion, 1);
    assert.equal(manifest.publications.length, 13);
    assert.equal(
      manifest.publications.flatMap(({ editions }) => Object.values(editions))
        .length,
      39,
    );

    for (const publication of manifest.publications) {
      for (const [locale, edition] of Object.entries(publication.editions)) {
        assert.equal(edition.version, "v1");
        assert.equal(typeof edition.textLayer, "boolean");
        assert.ok(edition.full.size > 0);
        assert.ok(edition.full.pageCount > 0);
        assert.ok(edition.preview.pageCount > 0);
        assert.ok(edition.cover.width > 0);
        assert.ok(edition.cover.height > 0);
        for (const [kind, asset] of Object.entries({
          full: edition.full,
          preview: edition.preview,
          cover: edition.cover,
        })) {
          assert.match(asset.sha256, /^[a-f0-9]{64}$/);
          assert.equal(
            asset.url,
            `${STORAGE_BASE_URL}/publications/${publication.id}/${locale}/v1/${kind === "cover" ? "cover.webp" : `${kind}.pdf`}`,
          );
        }
      }
    }
  } finally {
    await rm(preparedRoot, { recursive: true, force: true });
  }
});

test("immutable uploads skip matches and reject conflicting remote keys", async () => {
  const preparedRoot = await createPreparedFixture(["enzymes"]);
  const metadata = JSON.parse(
    await readFile(path.join(preparedRoot, "enzymes/en/v1/metadata.json")),
  );
  const key = "publications/enzymes/en/v1/cover.webp";
  const matchingClient = createFakeS3Client({
    existing: new Map([
      [
        key,
        {
          ContentLength: metadata.cover.size,
          ContentType: "image/webp",
          CacheControl: "public, max-age=31536000, immutable",
          Metadata: { sha256: metadata.cover.sha256 },
        },
      ],
    ]),
  });

  try {
    await uploadPreparedAssets({
      client: matchingClient,
      preparedRoot,
      publicBaseUrl: STORAGE_BASE_URL,
      publicationIds: ["enzymes"],
    });
    assert.equal(
      matchingClient.commands.filter(
        ({ constructor }) => constructor.name === "PutObjectCommand",
      ).length,
      8,
    );

    const conflictingClient = createFakeS3Client({
      existing: new Map([
        [key, { ContentLength: metadata.cover.size, Metadata: { sha256: "bad" } }],
      ]),
    });
    await assert.rejects(
      uploadPreparedAssets({
        client: conflictingClient,
        preparedRoot,
        publicBaseUrl: STORAGE_BASE_URL,
        publicationIds: ["enzymes"],
      }),
      /immutable object conflict.*enzymes\/en\/v1\/cover\.webp/i,
    );
    assert.equal(
      conflictingClient.commands.filter(
        ({ constructor }) => constructor.name === "PutObjectCommand",
      ).length,
      0,
    );

    const wrongHeadersClient = createFakeS3Client({
      existing: new Map([
        [
          key,
          {
            ContentLength: metadata.cover.size,
            ContentType: "application/octet-stream",
            CacheControl: "public, max-age=31536000, immutable",
            Metadata: { sha256: metadata.cover.sha256 },
          },
        ],
      ]),
    });
    await assert.rejects(
      uploadPreparedAssets({
        client: wrongHeadersClient,
        preparedRoot,
        publicBaseUrl: STORAGE_BASE_URL,
        publicationIds: ["enzymes"],
      }),
      /immutable object conflict.*enzymes\/en\/v1\/cover\.webp/i,
    );
  } finally {
    await rm(preparedRoot, { recursive: true, force: true });
  }
});

test("conditional uploads accept only an exactly matching concurrent object", async () => {
  const preparedRoot = await createPreparedFixture(["enzymes"]);
  const metadata = JSON.parse(
    await readFile(path.join(preparedRoot, "enzymes/en/v1/metadata.json")),
  );
  const racedKey = "publications/enzymes/en/v1/cover.webp";
  let raced = false;
  const commands = [];
  const client = {
    async send(command) {
      commands.push(command);
      const { Key } = command.input;
      if (command.constructor.name === "HeadObjectCommand") {
        if (Key === racedKey && raced) {
          return {
            ContentLength: metadata.cover.size,
            ContentType: "image/webp",
            CacheControl: "public, max-age=31536000, immutable",
            Metadata: { sha256: metadata.cover.sha256 },
          };
        }
        const error = new Error("missing");
        error.name = "NotFound";
        error.$metadata = { httpStatusCode: 404 };
        throw error;
      }
      if (command.constructor.name === "PutObjectCommand") {
        assert.equal(command.input.IfNoneMatch, "*");
        if (Key === racedKey) {
          raced = true;
          command.input.Body.destroy();
          const error = new Error("precondition failed");
          error.name = "PreconditionFailed";
          error.$metadata = { httpStatusCode: 412 };
          throw error;
        }
        for await (const _chunk of command.input.Body) {
          // Consume the stream as a real S3 client would.
        }
        return {};
      }
      throw new Error(`Unexpected command: ${command.constructor.name}`);
    },
  };

  try {
    await uploadPreparedAssets({
      client,
      preparedRoot,
      publicBaseUrl: STORAGE_BASE_URL,
      publicationIds: ["enzymes"],
    });
    assert.equal(
      commands.filter(
        ({ constructor, input }) =>
          constructor.name === "HeadObjectCommand" && input.Key === racedKey,
      ).length,
      2,
    );
  } finally {
    await rm(preparedRoot, { recursive: true, force: true });
  }
});

test("a failed upload does not replace the existing manifest", async () => {
  const preparedRoot = await createPreparedFixture(["enzymes"]);
  const manifestPath = path.join(preparedRoot, "existing-manifest.json");
  const existingManifest = '{"keep":"this"}\n';
  await writeFile(manifestPath, existingManifest);
  const client = createFakeS3Client({
    failPutKey: "publications/enzymes/en/v1/cover.webp",
  });

  try {
    await assert.rejects(
      uploadPreparedAssets({
        client,
        preparedRoot,
        publicBaseUrl: STORAGE_BASE_URL,
        publicationIds: ["enzymes"],
        manifestPath,
      }),
      /simulated upload failure/,
    );
    assert.equal(await readFile(manifestPath, "utf8"), existingManifest);
  } finally {
    await rm(preparedRoot, { recursive: true, force: true });
  }
});

test("the public verifier checks CORS, immutable headers, and PDF ranges", async () => {
  const origin = "https://www.familyclinic.doctor";
  const assets = {
    cover: {
      body: Buffer.from("cover-data"),
      contentType: "image/webp",
      sha256: "a".repeat(64),
    },
    preview: {
      body: Buffer.alloc(2_048, "p"),
      contentType: "application/pdf",
      disposition: 'inline; filename="enzymes-en-preview.pdf"',
      sha256: "b".repeat(64),
    },
    full: {
      body: Buffer.alloc(3_072, "f"),
      contentType: "application/pdf",
      disposition: 'attachment; filename="enzymes-en.pdf"',
      sha256: "c".repeat(64),
    },
  };
  const requests = [];
  const server = createServer((request, response) => {
    const kind = request.url.split("/").at(-1).split(".")[0];
    const asset = assets[kind];
    requests.push({
      method: request.method,
      path: request.url,
      origin: request.headers.origin,
      range: request.headers.range,
    });

    response.setHeader("Content-Type", asset.contentType);
    response.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    response.setHeader("Access-Control-Allow-Origin", origin);
    response.setHeader("ETag", `"${kind}-etag"`);
    response.setHeader("x-amz-meta-sha256", asset.sha256);
    if (asset.disposition) {
      response.setHeader("Content-Disposition", asset.disposition);
    }

    if (request.method === "GET") {
      response.statusCode = 206;
      response.setHeader("Content-Range", `bytes 0-1023/${asset.body.length}`);
      response.setHeader("Content-Length", 1_024);
      response.end(asset.body.subarray(0, 1_024));
      return;
    }

    response.setHeader("Content-Length", asset.body.length);
    response.end();
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const manifest = {
    publications: [
      {
        id: "enzymes",
        editions: {
          en: {
            cover: {
              url: `${baseUrl}/cover.webp`,
              size: assets.cover.body.length,
              sha256: assets.cover.sha256,
            },
            preview: {
              url: `${baseUrl}/preview.pdf`,
              size: assets.preview.body.length,
              sha256: assets.preview.sha256,
            },
            full: {
              url: `${baseUrl}/full.pdf`,
              size: assets.full.body.length,
              sha256: assets.full.sha256,
            },
          },
        },
      },
    ],
  };

  try {
    assert.deepEqual(
      await verifyPublishedAssets({ manifest, fetchImpl: fetch, origin }),
      { assets: 3, pdfRangeRequests: 2 },
    );
    assert.equal(requests.filter(({ method }) => method === "HEAD").length, 3);
    assert.equal(requests.filter(({ method }) => method === "GET").length, 2);
    assert.equal(requests.every((request) => request.origin === origin), true);
    assert.equal(
      requests
        .filter(({ method }) => method === "GET")
        .every(({ range }) => range === "bytes=0-1023"),
      true,
    );
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});

test("public verification failures identify publication, locale, and asset", async () => {
  const manifest = {
    publications: [
      {
        id: "enzymes",
        editions: {
          en: {
            preview: {
              url: `${STORAGE_BASE_URL}/preview.pdf`,
              size: 2_048,
              sha256: "b".repeat(64),
            },
          },
        },
      },
    ],
  };
  const headers = {
    "access-control-allow-origin": "https://www.familyclinic.doctor",
    "cache-control": "public, max-age=31536000, immutable",
    "content-disposition": 'inline; filename="preview.pdf"',
    "content-length": "2048",
    "content-type": "application/pdf",
    etag: '"preview-etag"',
    "x-amz-meta-sha256": "b".repeat(64),
  };
  const fetchImpl = async (_url, options) => {
    if (options.method === "HEAD") {
      return new Response(null, { status: 200, headers });
    }
    return new Response(Buffer.alloc(1_024), {
      status: 206,
      headers: { ...headers, "content-length": "1024" },
    });
  };

  await assert.rejects(
    verifyPublishedAssets({
      manifest,
      fetchImpl,
      origin: "https://www.familyclinic.doctor",
    }),
    /enzymes\/en\/preview.*content-range/i,
  );

  await assert.rejects(
    verifyPublishedAssets({
      manifest,
      fetchImpl: async () => {
        throw new Error("network unavailable");
      },
      origin: "https://www.familyclinic.doctor",
    }),
    /enzymes\/en\/preview.*HEAD request failed.*network unavailable/i,
  );

  await assert.rejects(
    verifyPublishedAssets({
      manifest,
      fetchImpl: async (_url, options) => {
        if (options.method === "HEAD") {
          return new Response(null, { status: 200, headers });
        }
        throw new Error("range network unavailable");
      },
      origin: "https://www.familyclinic.doctor",
    }),
    /enzymes\/en\/preview.*range GET request failed.*range network unavailable/i,
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
