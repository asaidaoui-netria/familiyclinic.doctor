# Publications storage operations runbook

This runbook governs publication assets delivered directly from Hetzner Object
Storage. The protected local originals and generated SHA-256 inventory remain
the custody record.

## Fixed delivery contract

- Project: `Family Clinic Publications`
- Bucket: `familyclinic-doctor-publications`
- Region: `nbg1`
- S3 endpoint: `https://nbg1.your-objectstorage.com`
- Public origin:
  `https://familyclinic-doctor-publications.nbg1.your-objectstorage.com`
- Immutable key pattern:
  `publications/<publication-id>/<locale>/v1/{cover.webp,preview.pdf,full.pdf}`
- Object Lock: enabled at bucket creation
- Retention: one year in Governance mode before production upload
- CORS source of truth: `infra/hetzner/cors.json`

The bucket is dedicated to intentionally public publication assets. Public
visibility grants anonymous reads but does not grant writes or object listing.
Bucket deletion protection must remain enabled in Hetzner Console.

## Credentials

Create an S3 key in the dedicated Hetzner project. Hetzner keys apply to every
bucket in their project, so this project must not contain unrelated storage.
The publication tools use:

```text
HETZNER_S3_ACCESS_KEY_ID=<project-scoped-access-key-id>
HETZNER_S3_SECRET_ACCESS_KEY=<project-scoped-secret-access-key>
```

Keep these values only in the current shell, the team's secret manager, or the
ignored `.env.publications` file. Never store, paste, or commit a literal secret
in source code, documentation, chat, or tickets.

Load the ignored file without printing it:

```sh
set -a
. ./.env.publications
set +a
```

## Upload and release

The uploader validates local hashes and refuses to replace an existing key whose
size or SHA-256 metadata differs. Corrections use a new `v2` prefix rather than
overwriting `v1`.

Inspect the new bucket before making changes:

```sh
npm run publications:storage:status
```

Apply the committed CORS policy, then upload and publicly verify a disposable
copy of the English enzymes preview. The probe permanently deletes the exact
uploaded version even when verification fails:

```sh
npm run publications:storage:apply-cors
npm run publications:storage:probe
```

Only after the probe passes, set one-year Governance retention as the default
for new objects:

```sh
npm run publications:storage:set-retention
npm run publications:storage:status
```

After CORS and retention are configured, publish all editions and atomically
replace the website manifest only after every immutable object check succeeds:

```sh
npm run publications:upload -- --all --manifest src/_data/publication-assets.json
```

Run the read-only public delivery verifier after every upload, credential
rotation, CORS change, or release:

```sh
npm run publications:verify
```

A complete run checks 117 public objects and issues 78 PDF byte-range requests.
It performs no writes and remains separate from the offline `npm run verify`
pull-request gate.

## Delivery metadata

Every versioned object uses `Cache-Control: public, max-age=31536000, immutable`
and stores its SHA-256 value as object metadata. Covers use `image/webp`.
Previews use `application/pdf` with inline disposition. Full publications use
`application/pdf` with attachment disposition and a stable localized filename.

## Rotation and rollback

If a credential may be compromised, revoke it in Hetzner Console, create a new
project key, update the local secret store, and rerun public verification.

Never replace published object keys during recovery. Roll back the site by
changing the active version in `src/_data/publication-assets.json` and redeploy.
Do not delete protected versions during an incident.

## References

- [Hetzner Object Storage overview](https://docs.hetzner.com/storage/object-storage/overview/)
- [Hetzner CORS policies](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/cors/)
- [Hetzner Object Lock retention](https://docs.hetzner.com/storage/object-storage/howto-protect-objects/protect-object-lock-retention/)
- [Hetzner S3 credentials](https://docs.hetzner.com/storage/object-storage/faq/s3-credentials/)
