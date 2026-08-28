# Publications R2 operations runbook

This runbook governs the publication documents delivered from
`https://media.familyclinic.doctor`. Cloudflare R2 stores the public delivery
copies; the protected local originals and the generated SHA-256 inventory remain
the custody record.

## Fixed delivery contract

- Account bucket: `family-clinic-publications`
- Jurisdiction: `eu`
- Public hostname: `media.familyclinic.doctor`
- Immutable key pattern:
  `publications/<publication-id>/<locale>/v1/{cover.webp,preview.pdf,full.pdf}`
- Bucket lock: indefinite retention for the `publications/` prefix
- CORS source of truth: `infra/r2/cors.json`

EU jurisdiction is a data-residency guarantee, not merely a placement hint. It
cannot be changed after bucket creation. S3 access to this bucket must use the
jurisdiction endpoint `https://<account-id>.eu.r2.cloudflarestorage.com`.

## Credentials

Two separate credentials are required so routine uploads cannot reconfigure the
bucket or DNS.

1. Use a Cloudflare management API token for Wrangler. Restrict it to the target
   account's R2 administration and the `familyclinic.doctor` zone only. Grant no
   unrelated account or zone access. Wrangler reads it from
   `CLOUDFLARE_API_TOKEN`; custom-domain operations also use
   `CLOUDFLARE_ZONE_ID`.
2. After the bucket exists, create a separate R2 S3 token with **Object Read &
   Write** permission and **Apply to specific buckets only**, selecting
   `family-clinic-publications`. The upload pipeline uses `R2_ACCOUNT_ID`,
   `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY`.

Keep these values only in the current shell, the team's secret manager, or the
ignored `.env.publications` file. Never store or paste a literal secret into this
runbook, a command example, source control, chat, or ticket. Do not reuse the
management token as an S3 upload credential.

The local secret contract is:

```text
CLOUDFLARE_ZONE_ID=<familyclinic-doctor-zone-id>
CLOUDFLARE_API_TOKEN=<restricted-management-token>
R2_ACCOUNT_ID=<cloudflare-account-id>
R2_ACCESS_KEY_ID=<bucket-scoped-access-key-id>
R2_SECRET_ACCESS_KEY=<bucket-scoped-secret-access-key>
```

Load the file without printing it:

```sh
set -a
. ./.env.publications
set +a
```

## Provisioning

Wrangler is pinned in `package.json`. Run from the repository root with the
management environment loaded:

```sh
npx wrangler r2 bucket create family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket cors set family-clinic-publications --file infra/r2/cors.json --jurisdiction eu --force
npx wrangler r2 bucket domain add family-clinic-publications --domain media.familyclinic.doctor --zone-id "$CLOUDFLARE_ZONE_ID" --min-tls 1.2 --jurisdiction eu --force
npx wrangler r2 bucket lock add family-clinic-publications publication-retention publications/ --retention-indefinite --jurisdiction eu --force
```

The hostname must belong to a zone in the same Cloudflare account as the bucket.
Do not enable the temporary `r2.dev` URL.

Verify the remote state:

```sh
npx wrangler r2 bucket info family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket cors list family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket domain list family-clinic-publications --jurisdiction eu
npx wrangler r2 bucket lock list family-clinic-publications --jurisdiction eu
```

The checks must show EU jurisdiction, the committed CORS rule, the enabled custom
domain with TLS 1.2 or newer, and indefinite retention for `publications/`.
After changing CORS on a hostname that has already served traffic, purge that
hostname's Cloudflare cache so cached responses acquire the new CORS headers.

## Upload and release

The upload command validates hashes and refuses to replace an existing key whose
metadata differs. Upload a pilot publication first, verify it, then upload all 39
editions. Treat each version prefix as immutable; publish a new `v2` prefix for a
changed document instead of replacing `v1`.

Before activating a manifest, verify over HTTPS:

- cover responses have the expected content type and immutable cache policy;
- preview PDFs support byte-range requests and render in the embedded viewer;
- full PDFs download with the expected filename;
- all public content lengths and SHA-256 values match the prepared metadata.

## Rotation and incident rollback

If a credential may be compromised, revoke or rotate that credential immediately,
update the local secret store, and rerun all public verification. Rotate the
bucket-scoped S3 token without changing the management token unless both are at
risk.

Never replace already published object keys during recovery. Roll back the site by
changing the committed active version in `src/_data/publication-assets.json` to a
previous verified version and redeploying. Do not delete protected objects during
an incident; the indefinite retention rule intentionally prevents that shortcut.

## References

- [Cloudflare R2 data location](https://developers.cloudflare.com/r2/reference/data-location/)
- [Cloudflare R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)
- [Cloudflare R2 custom domains](https://developers.cloudflare.com/r2/buckets/public-buckets/)
- [Cloudflare R2 authentication](https://developers.cloudflare.com/r2/api/tokens/)
