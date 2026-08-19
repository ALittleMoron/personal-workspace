# Security threat model

This public-safe model records the current security boundaries for the private personal workspace
and operations stack. It intentionally omits secrets, private host details and exploit playbooks.
Reassess it after an auth implementation, routing/deploy change, data-model change, security finding
or restore exercise.

## Scope and assets

Assets include the private workspace UI, private Knowledge records and attachments, resumes,
PostgreSQL/MinIO/Valkey data, deployment credentials, Compose secrets, TLS and WireGuard keys, and
backup material. `/login` is the only anonymous UI route. The current workspace has one
environment-configured authenticated owner, not account or team management. That owner supplies the
`author_username` passed into retained per-author access predicates.

Out of scope are endpoint compromise of a visitor device, a full enterprise risk register, and
complete incident-response or disaster-recovery procedures.

## Trust boundaries

```text
Public browser
    |
    v
nginx edge: TLS, headers, CSP, rate limits and routing
    |--> Angular CSR assets + Node static shell (nonce-bound index.html)
    |--> Litestar /api/* --> PostgreSQL, Valkey, MinIO, TaskIQ
    '--> public MinIO object endpoint

Maintainer browser over WireGuard
    '--> VPN-bound nginx --> MinIO Console and Databasus

GitHub protected production deployment
    '--> rendered runtime env, host secret files and Docker Compose
```

In the normal running stack nginx publishes ports. Backend, frontend, PostgreSQL, Valkey, MinIO and
Databasus are private to the Compose network. The standalone Certbot service temporarily publishes
port 80 only when certificate issuance needs nginx to be down. nginx passes a CSP nonce to the
static shell, which validates it before substituting each `index.html` nonce placeholder. A request
without a valid nonce cannot receive the SPA shell.

## Threats, controls and residual risk

| Threat | Current controls | Residual risk / follow-up |
| --- | --- | --- |
| Private Knowledge object becomes public. | Separate `knowledge-private` bucket; authenticated backend stream; no public or presigned URL; initializer removes bucket policy and CORS; public S3 exact/prefix routes return `404`; private responses are `no-store`. | Host, MinIO-root or private-network compromise can expose data. Verify policy/CORS and public denials after deploy and restore. |
| A caller reaches private APIs without authority. | Private APIs and API docs require the configured owner. The anonymous login POST uses one generic invalid-credential response, an encrypted persistent `HttpOnly`, `SameSite=Strict` cookie, and CSRF cookie/header validation for unsafe authenticated requests. Responses from protected private-domain APIs, auth session/logout, and API documentation use `Cache-Control: no-store`; domain calls remain author-scoped. | The copied stateless cookie has no individual server-side revocation yet. Add durable sessions and session management before multi-user access. |
| Public markup or browser behavior enables script injection. | CSP is enforced at nginx; the static shell uses a validated request nonce; authored Markdown uses the centralized sanitizer; protected images use Blob URLs rather than direct private paths. | A compromised browser, extension or authenticated endpoint can read data already exposed to it. Keep CSP and sanitization regression tests current. |
| Secret reaches an image, repository, logs or `docker inspect`. | Deployment renders `.env` from GitHub Environment values; Compose mounts `OWNER_PASSWORD_HASH` and other secrets as files; application services do not receive secret values as normal environment entries; repository rules prohibit real secrets. | Host/deploy-user compromise can read runtime files. Limit host access and rotate exposed credentials. |
| Internal panels become public. | Only nginx maps ports; panel ports bind to `VPN_BIND_ADDRESS`; infrastructure checks reject public/legacy exposure; host firewall is part of the boundary. | Docker port publishing can bypass naive host-firewall rules. Verify public failure from an external network after each deploy. |
| Transaction failure removes a referenced private object or leaves an orphan. | Superseded objects are cleaned only post-commit; new uploads have rollback/commit-failure cleanup; cleanup does not replace the original error. | Best-effort cleanup can leave orphans. Recovery and reconciliation procedures remain operational work. |
| Availability loss from service or edge failure. | Health checks, blue/green slots, restart policies and nginx local liveness recovery reduce single-deploy downtime. | There is no complete production observability or alerting yet. Monitor service health and add alerting as roadmap work. |
| Query or bundle growth degrades UX. | Retained Knowledge/Resume PostgreSQL query-plan gate; CSR Lighthouse performance, accessibility and best-practices budgets; cache tools and TaskIQ maintenance. | These gates do not prove production throughput. Define latency targets and monitoring before making capacity claims. |
| Backup cannot reconstruct private data. | Documentation requires coordinated PostgreSQL and MinIO recovery points, encryption/access control, isolated restore, metadata reconciliation and public-denial checks. | Automated backups and recurring restore tests are pending; the latest successful restore is the only evidence of recoverability. |

## Operating controls

- Public HTTP redirects to HTTPS; nginx permits TLS 1.2 and TLS 1.3 and supplies HSTS,
  `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and CSP.
- Public API limiting is applied at nginx. Login additionally has an edge-only per-IP limit of
  5 requests per minute while retaining the general API limit; 429 remains distinguishable to the
  frontend. Swagger uses a route-specific CSP because its UI loads documented third-party assets.
- Session cookies derive `Secure` from the configured URL schema. A password-hash rotation prevents
  new logins with the old credential but does not revoke an already copied stateless cookie;
  rotating the session secret revokes all current cookies. Individual revocation is future
  server-side-session work.
- Authentication failures do not disclose whether the username, password, or configured hash was
  invalid, and credentials, hashes, cookies, and CSRF values stay out of logs.
- The Node frontend is a static CSR shell with a request-bound nonce; it owns neither edge routing
  nor deployment configuration.
- Keep exactly one TaskIQ scheduler process. Workers can scale independently.
- Security and dependency/image/config checks, query plans and CSR Lighthouse are Make/CI gates;
  run the relevant ones before production changes.

## Maintenance triggers

Update this model when changing authentication, private file delivery, Markdown rendering, CSP/TLS,
Compose ports/networks/secrets, deployment, backup/restore, query-plan or Lighthouse policy, or
when an incident, scan or restore exercise reveals a material finding.
