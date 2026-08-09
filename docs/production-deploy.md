# Production deployment

Personal Workspace uses a manual, protected-environment deployment that builds images on the
target host and switches healthy backend/frontend slots through nginx.

## Delivery flow

1. CI runs reusable backend, frontend, infrastructure, Dockerfile, image, and configuration jobs.
   Coverage and Lighthouse output are uploaded as artifacts; workflows do not commit generated
   badges or reports.
2. An operator starts **Deploy to production** on `main`.
3. The protected `production` GitHub Environment requires approval.
4. The reusable deploy workflow renders `.env` from
   `infra/deploy/runtime-env.manifest.json`, syncs the runtime payload without deleting
   `.deploy-state`, and optionally issues the TLS certificate.
   Deploy concurrency is serialized without canceling an in-progress run. Before payload sync, the
   workflow rejects a `REMOTE_PATH` that is not an absolute normalized path containing only
   no-whitespace path characters. It atomically provisions an executable rsync wrapper under the
   host's `.deploy-state`; the rsync action receives that wrapper path as one no-whitespace argv
   token. The wrapper opens and locks `.deploy-state/deploy.lock`, then `exec`s rsync with its
   original arguments so the lock descriptor lives for the remote rsync process lifetime.
   `.deploy-state` remains excluded from payload deletion. Remote TLS and stack-start mutations use
   the same lock, so a disconnected client cannot overlap a later deployment while its remote
   process is still running. Wrapper provisioning creates `.deploy-state` itself and therefore also
   works on the first deploy without an existing remote checkout.
5. `make run` verifies the WireGuard bind and root Docker context exclusions, starts private
   dependencies, runs database migrations, starts the inactive
   healthy application slot and TaskIQ processes, and synchronizes the certificate. It validates
   the target nginx configuration before switching traffic, then recreates nginx, checks restart
   policies and edge health, atomically records the active slot, and drains the previous slot.
   Every failure after the switch attempt recreates nginx against the previous healthy slot and
   smoke-checks it; if no healthy rollback can be established, the nginx container is removed and
   its absence verified fail-closed. Active-slot target writes and rollback restores fsync both the
   state file and its parent directory. Successful rollback records the previous slot; first-deploy
   failure and every fail-closed path remove and directory-fsync stale state.

The first deployment must select `issue_certificates`; certificate files are not stored in the
repository. Later renewal uses `make certbot-renew`.

For a manual deployment, create `.env` atomically where practical, set mode `0600`, and keep it
owned by the runtime user. All Make-backed runtime/TLS commands enforce the mode and owner. Values
use one shell-quoted `NAME=value` per LF-terminated UTF-8 line; control characters, duplicates,
malformed quoting, and CRLF are rejected. The file is parsed as data and never sourced as shell
code.

## GitHub Environment

Create an environment named `production`, restrict it to `main`, and enable required reviewers.

Connection variables:

- `REMOTE_HOST`
- `REMOTE_USER`
- `REMOTE_PATH`

Deploy secret:

- `SSH_PRIVATE_KEY`

Runtime variables are the entries in the manifest's `vars` group. Runtime secrets are exactly:

- `DB_PASSWORD`
- `MINIO_ACCESS_KEY`
- `MINIO_SECRET_KEY`
- `SENTRY_DSN` (may be empty when Sentry is disabled)

`SENTRY_DSN` must be nonempty when `SENTRY_USE=true`; both secret materialization and backend
settings validation reject an enabled Sentry configuration without a DSN.

`IMAGE_TAG` is computed from the commit SHA. The renderer refuses missing or control-character
values, shell-quotes supported literal values, and atomically replaces `.env` at mode `0600`.
CI verifies the mode before packaging and after remote transfer. On the host,
`compose_secrets.sh` writes secret values under `.deploy-state/compose-secrets/` and grants
containers file-backed Compose secrets. Secret values are not placed in application service
environment blocks. The deployed root `.dockerignore` is checked before any root-context nginx or
MinIO build and excludes `.env`, `.deploy-state`, `.deploy-payload`, certificates, and private keys.

## Runtime topology

- `backend-blue` / `backend-green` and `frontend-blue` / `frontend-green` are the switchable slots.
- `backend-init` applies database migrations before the new slot starts.
- PostgreSQL, Valkey, MinIO, Databasus, and the active slot's TaskIQ worker and scheduler stay on
  the internal application network; deployment keeps exactly one scheduler active.
- A durable transition marker is written before a target slot starts. If deployment is interrupted,
  the next `make run` either finishes the recorded target after an active-slot commit or restores
  the recorded previous slot before beginning a new rollout.
- nginx alone joins both the internal application network and the edge network.
- Only nginx publishes public HTTP/HTTPS. The MinIO Console and Databasus listeners bind to the
  configured WireGuard address.
- MinIO's API remains private and has no browser-facing object route.
- Startup uses unprivileged `ip` JSON inspection to require `VPN_INTERFACE` to be a WireGuard link
  with its administrative `UP` flag, then confirms that the private, non-loopback
  `VPN_BIND_ADDRESS` is assigned to it before Compose publishes either panel listener. This
  preflight requires neither sudo nor `CAP_NET_ADMIN`.

Databasus provides the backup control plane, but backup presence is not proof of recovery.
Configure encrypted retention appropriate for private data, record recovery points, and perform an
isolated PostgreSQL/MinIO restore exercise before claiming recoverability. Automated restore proof
remains a required foundation-verification item in [TODO](TODO.md).

## Operator commands

```sh
make certbot-issue
make certbot-renew
make certbot-sync
make run
make stop
```

Before every production rollout, run the applicable root quality/security/image targets and verify
the stack, both edge health paths, blue/green replacement, certificate renewal, backup creation,
and an isolated restore according to the release policy.
