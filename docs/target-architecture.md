# Target Architecture

## Status

This document defines the target contracts for future work packages. It does not claim that an
implementation exists. Historical source documents under `source-baseline/` are subordinate to
this target.

## System Boundary

Personal Workspace is one self-hosted deployment for one operator. The application may be exposed
through public HTTPS, but all product routes and data require authentication. PostgreSQL, Valkey,
MinIO, TaskIQ, backup services, and internal web panels remain on private networks. WireGuard gates
the internal panels.

The repository remains a monorepo containing independently testable `backend`, `frontend`, and
`infra` contours when code arrives.

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
- Refresh and logout preserve the existing narrow CSRF boundary with a required CSRF header, Fetch
  Metadata validation, same-origin checks, restrictive cookie policy, and server-side tests.
- Logout deletes the Valkey session and expires the cookie. Credential or session-key rotation
  invalidates all existing sessions.
- Protected responses use `Cache-Control: no-store`. Authentication events are privacy-safe and do
  not log credentials, raw tokens, raw session IDs, or private content.

The detailed setting names, timeout values, and key-rotation interface belong to the dedicated
authentication design; this foundation deliberately does not invent them before backend settings
exist.

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

- Python, Litestar, Dishka, PostgreSQL, async SQLAlchemy, and Alembic retain the source project's
  clean layer boundaries.
- A clean initial migration contains only target-owned platform, Knowledge, Calendar-supporting,
  and Resume tables. It does not replay `my-site` migration history.
- Domain and persistence contracts remove `author_username`, account foreign keys, role checks,
  and ownership predicates. There is only one data namespace per installation.
- Knowledge uses a common typed item/taxonomy/file foundation plus explicit one-to-one extensions
  and workflows for each item kind.
- Resume remains a separate structured domain rather than a Knowledge item.
- Calendar remains a read/composition domain over People and Dates; future Events require their own
  design and storage boundary.

## Frontend

- Angular runs as a client-rendered application. SSR, hydration, transfer cache, sitemap, robots,
  canonical metadata, public view tracking, and public SEO route machinery are excluded.
- The frontend retains typed feature services, route-level lazy loading, backend-driven UI i18n,
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

Retained platform capabilities:

- PostgreSQL, Valkey, MinIO, TaskIQ worker and scheduler, Databasus, Sentry, and structured logging.
- Separate backend and frontend images behind nginx TLS termination.
- Private application networks, non-root containers, no Docker socket, and no unnecessary public
  service ports.
- WireGuard-bound MinIO and backup administration panels.
- Reproducible certificate management, blue/green application replacement, health gates, CI,
  dependency/security scanning, performance checks, and backup/restore procedures.

Explicitly excluded capabilities:

- Agent REST routes, mTLS client PKI, Agent audit/client administration, local MCP bridge, and their
  certificate tooling, secrets, networks, edge routes, tests, and documentation.
- Public media delivery unless a later typed feature demonstrates a need separate from private
  Knowledge objects.

## Data and Cutover

The target starts empty. No direct database dump, row copy, object-bucket copy, or identifier
compatibility contract is required. Removal from `my-site` still requires a fresh backup and an
explicit destructive-action confirmation before tables or private objects are deleted.
