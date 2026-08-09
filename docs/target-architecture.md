# Target Architecture

## Status

This document defines the current system boundary and the contracts for planned product work. The
reusable backend, Angular CSR, and infrastructure/delivery foundations are present; authentication
and product domains remain future work.

## System Boundary

Personal Workspace is one self-hosted deployment for one operator. The application may be exposed
through public HTTPS, but all product routes and data require authentication. PostgreSQL, Valkey,
MinIO, TaskIQ, backup services, and internal web panels remain on private networks. WireGuard gates
the internal panels.

The repository is a monorepo containing independently testable `backend`, `frontend`, and `infra`
contours.

## Authentication Contract

- Deployment secrets provide one login identifier and one Argon2id password hash. Plaintext
  credentials are never committed or persisted by the application.
- Login compares the submitted identifier and password against the configured values and applies
  both edge and application-aware brute-force limits.
- A successful login creates a cryptographically random opaque session identifier. The browser
  receives the raw identifier only as a `Secure`, `HttpOnly`, `SameSite=Strict` cookie restricted
  to the authentication path. Valkey stores the server-side session under a non-reversible digest.
- Every session has explicit deployment-configured idle, absolute, and renewal limits. There are no
  production defaults. Rotation invalidates the previous identifier after a bounded handover.
- Refresh validates the session and issues a short-lived PASETO access token. Angular keeps the
  access token in memory and sends it through the `Authorization` header. Tokens and session IDs
  never enter localStorage or sessionStorage.
- Refresh and logout will use a narrow CSRF boundary with a required CSRF header, Fetch
  Metadata validation, same-origin checks, restrictive cookie policy, and server-side tests.
- Logout deletes the Valkey session and expires the cookie. Credential or session-key rotation
  invalidates all existing sessions.
- Protected responses use `Cache-Control: no-store`. Authentication events are privacy-safe and do
  not log credentials, raw tokens, raw session IDs, or private content.

The detailed authentication setting names, timeout values, and key-rotation interface belong to
the dedicated authentication design and are not defined by the current foundation.

## HTTP and UI Routes

Public browser routes:

- `/login`

Protected browser routes:

- `/dashboard`
- `/knowledge/people`
- `/knowledge/people/:id`
- `/knowledge/dates`
- `/knowledge/dates/:id`
- `/resumes`
- `/resumes/:id`

HTTP contours:

- `/api/auth/*` owns login, refresh, and logout.
- `/api/knowledge/*` owns Knowledge taxonomy, typed items, and private files.
- `/api/resumes/*` owns resume CRUD and export.
- `/api/calendar` owns the composed calendar read model.
- Health endpoints expose only the minimum liveness/readiness information required for operations.

There is no `/admin`, `/admin-panel`, public knowledge API, public resume API, or public object URL.
Every new handler must be explicitly classified as public-authentication, protected-operator, or
internal-operational before implementation.

## Backend

- Python, Litestar, Dishka, PostgreSQL, async SQLAlchemy, and Alembic follow explicit layer
  boundaries.
- The initial database migration establishes an empty application schema. Product tables are added
  through later migrations as their domains are implemented.
- Domain and persistence contracts omit `author_username`, account foreign keys, role checks,
  and ownership predicates. There is only one data namespace per installation.
- Knowledge uses a common typed item/taxonomy/file foundation plus explicit one-to-one extensions
  and workflows for each item kind.
- Resume remains a separate structured domain rather than a Knowledge item.
- Calendar remains a read/composition domain over People and Dates; future Events require their own
  design and storage boundary.

## Frontend

- Angular runs as a client-rendered application. SSR, hydration, transfer cache, sitemap, robots,
  canonical metadata, public view tracking, and public SEO route machinery are excluded.
- The frontend uses typed feature services, route-level lazy loading, backend-driven UI i18n,
  centralized error handling, notifications, unsaved-change protection, accessible controls, and
  the centralized sanitized Markdown renderer/editor.
- Private photos and attachments are read through authenticated blob responses. Browser object URLs
  are short-lived and revoked on replacement, failure, navigation, and destruction.

## Localization

- RU and EN are the initial interface locales. The catalog shape must allow later interface locales
  without changing authored domain schemas.
- Knowledge strings are language-neutral user-authored content. The application does not create
  translation tables, parallel language fields, implicit fallback, or language validation for
  Knowledge content.
- Resume stores a document locale independent of the UI locale. RU and EN are initially supported
  because export templates own localized structural labels. A new document locale requires a
  complete export-template translation and its own verification.

## Infrastructure

Platform capabilities:

- PostgreSQL, Valkey, MinIO, TaskIQ worker and scheduler, Databasus, Sentry, and structured logging.
- Separate backend and frontend images behind nginx TLS termination.
- Private application networks, non-root application-owned containers, no Docker socket, and no
  unnecessary public service ports. The pinned Databasus root-entrypoint exception is bounded and
  documented in the threat model.
- WireGuard-bound MinIO and backup administration panels.
- Reproducible certificate management, blue/green application replacement, health gates, CI,
  dependency/security scanning, performance checks, and backup/restore procedures.

The implemented edge proxies `/api/*` to the active backend slot and all browser paths to the
active static CSR frontend slot. The frontend origin generates the per-response nonce, substitutes
it into HTML, and returns the matching CSP plus `Cache-Control: no-store`; the edge preserves that
response contract rather than generating a second policy. MinIO has no public API or object route.
Deployment preflights the target nginx configuration, arms rollback before the traffic switch,
records active-slot state atomically only after restart-policy and edge-health gates, and restores
and smoke-checks the previous slot on failure. A durable, fsynced transition marker records the
previous and target slots before target startup; the next run completes or rolls back an
interrupted deployment before starting another one. Target and rollback state writes fsync the
file and parent directory; successful rollback restores previous state, while first-deploy and
fail-closed paths remove stale state and fsync the directory. An unavailable rollback removes the
nginx container and verifies its absence fail-closed.
The workflow does not cancel an in-progress deployment, and every remote payload, TLS, or stack
start mutation holds the same durable host flock under `.deploy-state`.
Production environment files are atomically created mode `0600`, owned by the runtime user, parsed
as quoted data without shell evaluation, and excluded from root Docker build contexts. Blank
required credentials, unchanged example placeholders, and enabled Sentry without a nonempty DSN
are rejected before Compose secret materialization. Panel binds
must be private addresses assigned to the declared administratively active WireGuard link, verified
through unprivileged `ip` inspection without sudo or added capabilities.

Explicitly excluded capabilities:

- Agent REST routes, mTLS client PKI, Agent audit/client administration, local MCP bridge, and their
  certificate tooling, secrets, networks, edge routes, tests, and documentation.
- Public media delivery unless a later typed feature demonstrates a need separate from private
  Knowledge objects.

## Data Bootstrap

A new installation starts empty. No direct database dump, row copy, object-bucket copy, or
identifier compatibility contract is part of the application foundation. A future import requires
its own schema mapping, validation, backup, and rollback procedure.
