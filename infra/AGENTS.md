# Infrastructure instructions

These rules apply to shared deployment infrastructure under `infra/` and the root Compose files.

- nginx is the only public application entrypoint. Keep PostgreSQL, Valkey, backend, frontend,
  MinIO, TaskIQ, Databasus, and other operational services free of public port mappings.
- Bind the MinIO Console and Databasus panel only to the private, non-loopback
  `VPN_BIND_ADDRESS` assigned to the administratively active WireGuard link named by
  `VPN_INTERFACE`; verify link kind, `UP` flag, and exact address with unprivileged `ip` inspection
  before Compose can publish them. Never add a public object route, browser-facing bucket URL, or
  anonymous bucket policy; do not grant sudo or `CAP_NET_ADMIN` for this preflight.
- Keep the application network internal. Long-running application containers must be non-root,
  capability-dropped, and protected with `no-new-privileges`; retain read-only root filesystems
  where the image supports them.
- Databasus `v3.47.1` is the only approved root-entrypoint exception: keep the tag pinned, drop all
  capabilities, retain `no-new-privileges`, and keep it private. A version or runtime-model change
  requires a fresh review of this exception.
- Keep TaskIQ processes slot-scoped and exactly one scheduler active. Confirm the old scheduler is
  stopped before a switch and the target scheduler is stopped before rollback restores the prior
  one.
- Preserve blue/green backend and frontend switching, target nginx preflight, readiness gates,
  restart-policy checks, post-cutover rollback/fail-closed behavior, atomic active-slot state,
  durable transition recovery, and cleanup ownership in deployment scripts. Fsync deployment state
  files and their parent directory; restore previous state after successful rollback and remove
  state whenever the edge fails closed or the full stack is taken down. Fail-closed handling must
  remove the `restart: always` nginx container and verify its absence, not merely stop it.
- nginx owns public TLS, coarse edge limits, and API security headers. The frontend origin owns the
  CSR HTML nonce substitution, matching CSP header, and `no-store`; proxy those response headers
  unchanged so the nonce in the body and policy cannot diverge.
- Keep runtime secrets out of service environment blocks and Docker image layers. Materialize them
  as file-backed Compose secrets with restrictive host permissions. Treat production `.env` as
  data, create it atomically at mode `0600`, require runtime-user ownership, and never source it as
  shell code. Verify the root `.dockerignore` before every root-context image build.
- Keep Makefiles as thin wrappers. Put Compose, deployment, TLS, and scanning logic in
  `infra/scripts/`.
- Pin GitHub Actions to commit SHAs and Docker-based security tools to image digests. A tool that
  receives the Docker socket must never use a mutable tag.
- Do not introduce public discovery routes, alternate browser rendering modes, public storage
  delivery, or private machine-access listeners without an approved architecture and threat-model
  update.
