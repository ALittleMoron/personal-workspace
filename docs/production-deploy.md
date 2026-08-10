# Production Deploy

Production deploy is a manual server-build deploy:

The post-smoke container security jobs use the same Make targets in CI and locally:

```bash
make security-trivy-config
make security-backend-docker-image IMAGE_TAG=local-security-check
make security-frontend-docker-image IMAGE_TAG=local-security-check
make security-nginx-docker-image IMAGE_TAG=local-security-check
```

Each image target builds from the current checkout, runs Dockle and Trivy, and removes only the
temporary image tag it created. Use an image tag that does not already exist locally.

Locally built runtime images use the GitHub commit SHA from the required `IMAGE_TAG` runtime
environment entry. `docker-compose.yml` intentionally has no `latest` fallback for the backend,
frontend, nginx, or MinIO wrapper images, so a production start fails early if the deploy renderer
does not provide the tag.

Start deploy from **Actions** -> **Deploy to production** -> **Run workflow** on `main`. Select
`issue_certificates` when the certificate must be issued again, including after adding a hostname
to the certificate SAN list. The repository environment must restrict production deployments to
`main` and require reviewer approval. Without those GitHub Environment protection rules, the
workflow remains manual, but production deploys would no longer have the environment approval and
branch protections described here.

## GitHub Environment

Create a GitHub Environment named `production`.

Required protection rules:

- Required reviewers are enabled, so the deploy job waits for **Approve and deploy**.
- Deployment branches are restricted to `main`.

Deploy connection variables:

- `REMOTE_HOST`
- `REMOTE_USER`
- `REMOTE_PATH`

Deploy-only secret:

- `SSH_PRIVATE_KEY`

Runtime variables:

Runtime secrets:

The deploy renderer still writes these values into the host-side runtime `.env`, but
the Compose helper materializes them as read-only files under `.deploy-state/compose-secrets/`
before Docker Compose starts. The secret directory is host-user-only, while the files keep a read bit
for non-root container UIDs because local Compose file-backed secrets are bind mounts.
`docker-compose.yml` grants those files to containers through Compose secrets. Backend processes
read the matching `/run/secrets/*` files at startup, PostgreSQL uses `POSTGRES_PASSWORD_FILE`, and
MinIO loads root credentials from secret files in its non-root wrapper image. Do not move these
values back into service `environment` entries or `env_file`, because those values are visible in
`docker inspect`.

MinIO runs as UID/GID `10002:10002`. During `make run`, the deploy script runs a transient
maintenance container as root to repair ownership on the `minio_data` volume before starting the
non-root MinIO runtime container. This keeps upgrades from older root-owned MinIO volumes working
without granting root to the long-running MinIO service.

Use `SSL_CERT=/certs/fullchain.pem` and `SSL_KEY=/certs/privkey.pem` for the compose-managed
certificate sync path. Keep deploy-only values such as `REMOTE_HOST`, `REMOTE_USER`,
`REMOTE_PATH`, `SSH_PRIVATE_KEY`, and registry passwords out of runtime `.env`.

Use `MINIO_HOST=minio` and `MINIO_PORT=9000` for the backend-internal S3 endpoint in the Compose
network. Use `MINIO_PUBLIC_URL=https://s3.<APP_DOMAIN>` for browser-facing object access and
computed public file URLs. `MINIO_REGION` must be explicit for SigV4 S3 client operations;
`us-east-1` is suitable for the bundled MinIO service unless deployment policy chooses another
region string. The Compose MinIO service derives `MINIO_API_CORS_ALLOW_ORIGIN` from
`APP_URL_SCHEMA` and `APP_DOMAIN` because the bundled MinIO release does not accept bucket-level
CORS setup through `PutBucketCors`.

Each task run locks and rechecks at most 100 oldest eligible metadata rows from the public `media`
namespace. It deletes the MinIO object before deleting its database metadata. A MinIO error keeps
the row and timestamp for the next scheduled retry, while a reference discovered during the final
check clears the stale orphan marker. The task deliberately does not list the bucket or remove
objects without database metadata, and it never scans the private `knowledge-private` bucket;
object/metadata reconciliation remains a separate operational procedure. Run exactly one TaskIQ
scheduler process, as defined by Compose, while workers may be scaled independently.

## Private Knowledge Bucket

`make run` executes the one-shot `backend-init` service after PostgreSQL and MinIO are healthy. Its
`litestar initbuckets` CLI command initializes both `media` and `knowledge-private`; for the private
bucket it creates the bucket when absent and deletes any bucket policy and bucket CORS
configuration. Do not replace this with a public MinIO bootstrap policy. If initialization fails,
the deployment must not be treated as ready even if old application containers are still serving.

After initialization and after every restore:

### Backup And Restore

Use coordinated recovery points where practical and record the PostgreSQL snapshot and object
backup identifiers together. Test recovery in an isolated environment:

Private-bucket backup/restore automation and recurring restore tests are tracked as future work.
Until an isolated restore succeeds, backup presence is not proof of recoverability.

## Admin Operational Tools

Cache clear is synchronous, is limited to the three response-cache domains, and deliberately does
not enqueue a warm. Manual warm is asynchronous: the API creates a bounded-TTL operation record in
the TaskIQ results Valkey database, enqueues a manual wrapper around the shared full-warm service,
and the widget polls the operation through `queued`, `running`, `succeeded`, or `failed`. Operation
records use
`TASKIQ_RESULT_EXPIRE_SECONDS`; if a worker stops after accepting a task, a `queued` record can
remain until that TTL. Cache key/TTL metrics are an operational snapshot rather than a transactional
freshness guarantee.

Expired-session pruning uses the same use case as the scheduled TaskIQ cleanup. “Expiring soon” is
the server-owned seven-day window and counts only non-revoked sessions whose effective idle or
absolute expiration falls within it. Keep the TaskIQ worker and scheduler healthy even when manual
controls are available: the Dashboard widget is an operator tool, not a replacement for scheduled
maintenance.

Create a P-256 root CA offline and keep its private key off the production host. Use the root to
create a P-256 issuing CA, then provide the issuing certificate, issuing private key, and complete
chain through the three dedicated production secrets above. The deployment materializes them as
Compose secret files; do not move the issuing key into normal environment entries or an image.
The fail-closed helper accepts only absolute output directories outside the repository:

## TLS

The manual deploy workflow exposes the `issue_certificates` boolean input. When selected, the
reusable deploy job runs `make certbot-issue` after syncing the new Compose/TLS configuration and
before `make run`, so a newly added hostname can be included before nginx starts with that
configuration. Leave the input disabled for ordinary deploys. The deploy startup script still syncs
certbot-owned certificates into `infra/nginx/certs/` for the unprivileged nginx container.

In production, keep routine renewal host-owned: a systemd timer or equivalent scheduler should run
`make certbot-renew` from the deployed project directory and let the target resync certificates and
reload nginx.

If certificates must be issued again on the server, run the maintenance target directly on the
host:

```bash
make certbot-issue
```

For certificate renewal on a running stack:

```bash
make certbot-renew
```

To resync existing certbot certificates without renewal:

```bash
make certbot-sync
```

## Server Expectations

The remote host needs Docker with the Compose plugin, `make`, `curl`, and SSH access for the
configured deploy user. The manual deploy job syncs `Makefile`, `docker-compose.yml`, `backend/`,
`frontend/`, `infra/`, and generated `.env`.

On a systemd-based VPS, Docker itself must be enabled at boot or no container restart policy can
run after a host reboot:

```bash
sudo systemctl enable docker.service
sudo systemctl is-enabled docker.service
```

## Restart and Edge Recovery

Long-running services use Docker restart policies so containers that were running before a Docker
daemon or VPS restart return when the enabled daemon starts again. Inactive blue/green backend and
frontend slots intentionally remain on `unless-stopped`, so a slot stopped by the deploy drain step
does not return unexpectedly. The public nginx edge uses `always`; `make run` force-recreates it and
verifies the effective restart policies of every active runtime container through `docker inspect`
before the edge smoke check.

Docker does not restart a container merely because its health status changes to `unhealthy`.
The nginx healthcheck therefore records consecutive failures of its loopback
`/nginx-healthz` endpoint in the existing `/tmp` tmpfs. After 12 failures, it sends `TERM` to nginx
PID 1; the `always` policy then starts the container again. A successful probe clears the failure
counter. The recurring probe deliberately checks local liveness only: nginx configuration validity
is checked during image/deploy validation and at process startup, avoiding a restart loop that
could replace a still-serving loaded configuration with an invalid on-disk configuration. This
recovery path needs neither a Docker socket mount nor a privileged watchdog container.

After deployment, verify the applied state with:

```bash
docker inspect my_site_nginx \
  --format 'restart={{.HostConfig.RestartPolicy.Name}} status={{.State.Status}} health={{.State.Health.Status}} restarts={{.RestartCount}}'
docker inspect my_site_nginx \
  --format '{{range .State.Health.Log}}{{println .End "exit=" .ExitCode .Output}}{{end}}'
```
