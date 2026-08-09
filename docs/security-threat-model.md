# Foundation threat model

## Scope

This model covers the empty single-operator foundation: nginx/TLS, Angular CSR assets,
infrastructure-only backend routes, PostgreSQL, Valkey, private MinIO, TaskIQ, Databasus,
deployment, and CI. Product data and authentication require their own design updates before use.

## Trust boundaries and controls

| Boundary | Controls | Residual risk |
| --- | --- | --- |
| Public network to nginx | TLS 1.2/1.3, HSTS, content-type/frame/referrer headers, coarse API rate limits, no direct service ports | Edge or host compromise remains high impact; external monitoring is not yet configured. |
| nginx to active frontend | Internal network only; origin produces nonce-matched HTML/CSP and `no-store`; edge passes those headers unchanged | A proxy regression could cache HTML or create mismatched policies; preserve the static invariant and verify responses at runtime. |
| nginx to backend | Internal network only; `/api/*` is the sole API proxy; privacy-safe URI logs omit query strings | Future protected handlers still require backend authentication and authorization. |
| Application to PostgreSQL/Valkey/MinIO | Internal network, no published ports, explicit settings, file-backed secrets, non-root/capability-dropped application containers; a separate egress network permits Sentry delivery without exposing a host port | Compromise of an application-network service can reach other internal service ports. Keep membership narrow and patch images. |
| Operator to panels | Startup rejects wildcard/loopback/non-local binds and uses unprivileged `ip` inspection to verify WireGuard link kind, administrative `UP`, and exact private address without sudo or added capabilities; panel-native authentication remains enabled | A compromised VPN peer can reach login surfaces. Revoke peers and retain strong panel credentials. |
| GitHub to host | Manual workflow, protected environment approval, branch restriction, non-canceling deployment concurrency, read-only workflow permissions, non-persistent checkout credentials, explicit four-secret runtime manifest input, validated no-whitespace remote paths, and one durable host flock for payload/TLS/start mutations | GitHub identity, reviewer, SSH key, or host compromise can alter production. Rotate credentials and review delivery changes. |
| Backup and restore | Private Databasus panel and private storage topology | Restore has not been exercised; backup availability alone does not establish recoverability. |

## Container and secret baseline

- Long-running application images use explicit non-root identities, dropped capabilities,
  `no-new-privileges`, and read-only root filesystems where supported.
- The application network is Docker-internal. nginx alone also joins the edge network.
- Runtime images require an explicit tag; no application-owned image falls back to `latest`.
- GitHub Actions use immutable commit SHAs. Docker-based linters use immutable image digests;
  this is mandatory for Dockle because it receives the Docker socket during image inspection.
- Database, MinIO, and Sentry secrets are materialized as host-private files and mounted through
  Compose secrets. They must not enter source control, images, logs, or service environment blocks.
- Production `.env` is atomically replaced at mode `0600`, must be owned by the runtime user, and is
  parsed as shell-quoted data without shell execution. Root Docker context preflight requires
  `.env`, `.deploy-state`, private keys, and certificates to remain excluded.
- Example production credentials are blank. Startup rejects blank required credentials, unchanged
  legacy placeholders, and enabled Sentry without a nonempty DSN before materializing Compose
  secret files.
- MinIO has no public API, bucket route, anonymous policy, or browser object URL contract.
- TaskIQ processes are slot-scoped. Deployment confirms the old scheduler is stopped before
  starting the target scheduler, and confirms the target is stopped before rollback restores the
  prior scheduler, preventing duplicate scheduled execution across releases.
- Databasus `v3.47.1` is a documented upstream exception to the explicit non-root container rule:
  its entrypoint requires root for volume ownership and bundled PostgreSQL/Valkey setup, then starts
  its main application as UID 65532. The image tag is pinned, capabilities are dropped,
  `no-new-privileges` is enabled, and the service remains private.
- Blue/green traffic switching validates the target nginx configuration first. Post-switch failure
  restores and smoke-checks the prior slot; an unsuccessful rollback removes nginx fail-closed.
  A durable transition marker is fsynced before target startup, allowing the next run to complete
  a committed target or restore the prior slot after interruption. Target/rollback state writes
  fsync the file and directory, successful rollback restores prior state, and first-deploy or
  fail-closed paths remove stale state with a directory fsync. Fail-closed handling removes and
  verifies the absence of the `restart: always` nginx container so a Docker restart cannot expose a
  stale route.
- Remote payload sync, TLS, and stack-start mutations serialize on
  `.deploy-state/deploy.lock`; workflow cancellation is disabled. The atomically provisioned rsync
  wrapper path is one validated no-whitespace argv token, and the wrapper carries an open locked
  descriptor through `exec rsync`, so a disconnected client holds the flock for as long as its
  mutating process survives. `.deploy-state` remains outside payload deletion.

## Highest residual risks

1. Stack, image, restart, backup, and restore behavior must be verified before production use and
   after material infrastructure changes.
2. Authentication and protected product routes do not exist yet; the current foundation routes are
   operational and expose no private content.
3. Monitoring and alerting for certificate expiry, backup freshness, disk pressure, and service
   failure remain future work.
4. Public API documentation reveals the small infrastructure route surface and needs a relaxed,
   route-scoped Swagger policy.
5. A host, CI identity, deploy key, or maintainer device compromise remains outside what container
   isolation can fully contain.
