# Production deployment

Production is deployed manually from the `main` branch through **Deploy to production**. The
workflow renders a fresh runtime `.env`, synchronizes the deploy payload, optionally issues a
certificate, then runs `make run` on the host. Protect the `production` GitHub Environment with
required reviewers and a `main`-only deployment branch rule.

## Prerequisites and GitHub Environment

The server needs Docker with the Compose plugin, `make`, `curl`, `rsync`, SSH access for the deploy
user and an enabled Docker service. Keep the host checkout directory private to that user. The
workflow needs these Environment variables:

- `APP_DEBUG`, `APP_DOMAIN`, `APP_URL_SCHEMA`, `APP_USE_CACHE`, `I18N_DEFAULT_LANGUAGE`;
- `DB_DRIVER`, `DB_EXPIRE_ON_COMMIT`, `DB_HOST`, `DB_LOG_QUERY_METRICS`, `DB_MAX_OVERFLOW`,
  `DB_NAME`, `DB_POOL_PRE_PING`, `DB_POOL_SIZE`, `DB_PORT`, `DB_SLOW_QUERY_LOG_STATEMENT_MAX_LENGTH`,
  `DB_SLOW_QUERY_LOG_THRESHOLD_MS`, `DB_USER`;
- `FILES_ORPHAN_RETENTION_SECONDS`;
- `LE_EMAIL`, `SSL_CERT`, `SSL_KEY`, `VPN_BIND_ADDRESS`;
- `MINIO_CORS_MAX_AGE_SECONDS`, `MINIO_HOST`, `MINIO_PORT`, `MINIO_PUBLIC_URL`, `MINIO_REGION`,
  `MINIO_SECURE`;
- `SENTRY_USE`, `TASKIQ_CACHE_WARM_INTERVAL_SECONDS`,
  `TASKIQ_FILE_ORPHAN_PRUNE_INTERVAL_SECONDS`, `TASKIQ_RESULT_EXPIRE_SECONDS`, `VALKEY_HOST`, and
  `VALKEY_PORT`;
- deployment connection variables `REMOTE_HOST`, `REMOTE_PATH`, and `REMOTE_USER`.

Required Environment secrets are `APP_SECRET_KEY`, `DB_PASSWORD`, `MINIO_ACCESS_KEY`,
`MINIO_SECRET_KEY` and `SSH_PRIVATE_KEY`. `SENTRY_DSN` is a secret that may be deliberately empty.
`IMAGE_TAG` is computed from the deployed commit; do not add a `latest` fallback. The authoritative
machine-readable contract is `infra/deploy/runtime-env.manifest.json`.

At runtime Compose materializes application secrets below `.deploy-state/compose-secrets/` and mounts
them as read-only files under `/run/secrets/*`. Do not put secret values in service `environment` or
`env_file`, where `docker inspect` can expose them. Do not commit generated `.env`, secret files,
TLS private keys or production values.

## Network and services

In the normal running stack nginx is the only service with host port mappings: public `80` and
`443`, plus VPN-bound `18081` (MinIO Console) and `18082` (Databasus). PostgreSQL, Valkey, backend,
frontend and MinIO remain on the private Compose network. During first issuance or nginx recovery,
`make certbot-issue` can temporarily run Certbot's standalone HTTP challenge on port 80 when nginx
is not running; it exits after issuance. See [WireGuard internal access](wireguard-internal-access.md)
for the host firewall and peer setup.

The stack uses blue/green backend and frontend slots. `make run` brings up dependencies, runs the
one-shot backend bucket initializer, starts the inactive slot, waits for health checks, switches
nginx, runs edge smoke checks, records the active slot and drains the previous slot. The Angular
runtime is CSR-only: the frontend container is a Node static shell with `PORT=4000`, a `/healthz`
endpoint and per-request CSP nonce substitution.

## TLS

Set `SSL_CERT=/certs/fullchain.pem` and `SSL_KEY=/certs/privkey.pem` for Compose-managed certificate
sync. Certificates are named for `APP_DOMAIN` and `s3.APP_DOMAIN`. To issue after the public DNS and
port 80 are ready, select `issue_certificates` in the deploy workflow or run on the host:

```bash
make certbot-issue
```

For regular renewal, schedule the following on the host from the deployed project directory:

```bash
make certbot-renew
```

`make certbot-sync` copies existing Certbot material to the nginx certificate mount and reloads a
running nginx. The nginx runtime user must be able to read the synchronized certificate files.

## Backup and restore

PostgreSQL and MinIO objects are separate backups but one logical recovery point. Back up the
PostgreSQL volume/database and MinIO data with matching identifiers; include `knowledge-private` as
well as public `media`. Keep backup storage encrypted, non-public and limited to authorized
operators. Databasus is a VPN-only administrative panel, not evidence that a backup or restore is
valid.

Restore only to an isolated environment first:

1. Restore PostgreSQL and MinIO data from the same recovery point.
2. Run normal migrations and the backend bucket initializer. It must remove any restored policy or
   CORS configuration from `knowledge-private`.
3. Reconcile file metadata and object paths; sample public-media and authorized private-file reads.
4. From a public network, confirm the exact `knowledge-private` path and a child path on the public
   S3 endpoint return `404`.
5. Record the recovery point, duration, integrity results, authorization checks and failures before
   considering production recovery.

Recurring backup automation and restore drills remain roadmap work; stored backups are not a
recovery guarantee until a documented isolated restore succeeds.

## Validation

Before deploying, use the applicable Make targets. The security image checks require an unused
explicit `IMAGE_TAG` because each target builds and removes that temporary tag:

```bash
make tests
make security
make query-plans-realistic
make performance-lighthouse
make security-trivy-config
make security-backend-docker-image IMAGE_TAG=local-security-check
make security-frontend-docker-image IMAGE_TAG=local-security-check
make security-nginx-docker-image IMAGE_TAG=local-security-check
```

After deployment, verify `https://<APP_DOMAIN>/api/healthcheck` and
`https://<APP_DOMAIN>/healthz`, inspect the active Compose services, and repeat the private-bucket
and WireGuard acceptance checks. Query plans are a blocking check for retained Knowledge and Resume
storage paths. Lighthouse audits CSR performance, accessibility and best practices.
