# Personal Workspace Extraction Design

- Status: Approved
- Date: 2026-08-06
- Product name: `personal-workspace`

## Summary

Extract private Knowledge, Calendar, and Resume capabilities from the public `my-site` product into a separate self-hosted open-source application. The new repository starts with documentation only. Code, configuration, dependencies, lock files, assets, databases, secrets, and user data are not part of this work package.

The new application will reuse selected architectural experience and, through later work packages, a reviewed frontend/backend/infrastructure skeleton. It is not a fork of the public site's product model: it has a single operator, private CSR routes, a smaller API contour, fresh history, and an empty initial schema.

## Product boundary

### Included

- A private Knowledge workspace with people, shared tags, relations, and private files.
- A Calendar and Dashboard for dates derived from workspace data.
- Structured Resume CRUD with preview and PDF/DOCX export.
- Single-operator authentication.
- Self-hosted operations using the retained platform foundation.
- Russian and English interface strings.

### Excluded

- Public articles, public portfolio pages, Matrix, Roadmaps, Courses, Flashcards, and Team administration.
- Users, accounts, roles, registration, recovery, teams, memberships, author scoping, and tenant scoping.
- Public Knowledge publication, multi-user collaboration, and user-facing sharing.
- Angular SSR, public SEO routes, `/admin`, and `/api/admin/*`.
- Agent REST API, MCP bridge, Agent PKI, machine identities, scopes, and Agent audit workflows.
- Migration of existing database rows, files, object-storage buckets, or schema history.

## Repository and history

- Repository path: `/Users/d.lunev/code/repositories/personal-workspace`.
- Initial branch: `main`.
- No remote until the publication work package.
- The first commit contains only `docs/**`.
- Canonical documentation is English.
- The repository begins with fresh Git history.
- A root `LICENSE` containing the selected license text is added before the first code transfer, not during this documentation-only package.

## Operator and authentication contract

The application has one operator and no account lifecycle. Login credentials are supplied through environment-backed secrets. Only an Argon2id password hash is stored; plaintext credentials do not enter the repository or persistent application data.

Authentication uses:

- a cryptographically random opaque session stored in Valkey;
- a short-lived bearer PASETO access token for ordinary API calls;
- a `Secure`, `HttpOnly`, `SameSite` cookie scoped to refresh and logout under `/api/auth/*`;
- server-side session expiration, credential rotation, and revocation;
- an explicit CSRF guard plus Fetch Metadata checks for cookie-authenticated state changes;
- rate limiting for login and renewal paths.

Argon2id parameters and session handling follow the current OWASP Password Storage and Session Management guidance when the authentication work package is designed. Exact timeouts, token claims, cookie paths, rotation transitions, error contracts, and secret names belong in that JIT specification.

## Route contract

### UI

- `/login`
- `/dashboard`
- `/knowledge/*`
- `/resumes/*`

Angular is CSR-only. `/login` is anonymous; every workspace route is protected. There is no admin UI contour.

### API

- `/api/auth/*`
- `/api/knowledge/*`
- `/api/resumes/*`
- `/api/calendar`

Authentication is cross-cutting under `/api/auth/*`. All domain routes are private single-operator routes. There is no `/api/admin/*` contour.

## Domain design

### People, Knowledge, tags, and files

People and Knowledge share a single private knowledge model and tag vocabulary. Knowledge content is user-authored text that may use any language. The product must support safe rich-text/Markdown rendering, explicit relations, tag filtering, private file upload and retrieval, and MinIO-backed object storage. The domain design must remove inherited author and visibility scopes.

### Dates, Calendar, and Dashboard

Dates attached to supported workspace records feed a unified Calendar. The Dashboard presents private operational summaries and upcoming dates; it is not a cross-role admin composition page. Calendar view modes, events, reminders, and further scheduling behavior are future backlog families with independent JIT designs.

### Resume

Resume records are structured documents with CRUD, preview, PDF export, and DOCX export. Resume document locale is independent of UI locale and initially restricted to RU or EN. The JIT Resume design decides which source sections and exporter behavior to preserve and removes author/admin coupling.

## Localization contract

Only interface strings are localized, initially to RU and EN. Knowledge content is language-neutral in the schema and remains authored in any language without implicit fallback or parallel RU/EN fields. Resume document locale is an explicit finite value, initially RU or EN, and controls document labels/export rendering independently from the active interface locale.

## Platform boundary

Later work packages preserve and adapt:

- PostgreSQL;
- Valkey;
- MinIO;
- TaskIQ;
- Databasus;
- nginx and TLS;
- WireGuard;
- Sentry;
- blue/green deployment;
- CI.

The frontend becomes an Angular CSR build served behind nginx. The backend remains a Litestar application using SQLAlchemy async, Alembic, Dishka, structured logging, and environment-backed settings unless a later approved design changes those choices.

Agent-specific infrastructure is excluded in full. Copied infrastructure must be audited for accidental Agent services, listeners, routes, certificates, environment variables, tests, and documentation.

## Data and migration policy

The new instance starts empty. It receives one clean initial schema rather than copied historical migrations. Existing PostgreSQL rows and MinIO objects remain in `my-site`; no automatic transfer or one-off data migration belongs to this extraction program.

Source documents and TODO history are preserved only as planning baselines. Before the later destructive cleanup of source tables, migrations, or buckets, the operator must create and verify a fresh backup and give separate confirmation for the exact destructive scope.

## Licensing

The project uses AGPL-3.0. During the documentation-only stage the unchanged text is stored in `docs/LICENSE.md`. A conventional root `LICENSE` with the unchanged text is mandatory before any code is transferred or the repository is published.

## Migration program

Work is split into these JIT packages:

1. Documentation control plane.
2. Backend foundation.
3. Angular CSR foundation.
4. Infrastructure and delivery foundation.
5. Single-operator authentication.
6. People plus shared Knowledge, tags, and private files.
7. Dates plus Calendar and Dashboard.
8. Resume CRUD plus PDF/DOCX export.
9. Operational parity: security, UX, backup/restore, performance, and deployment.
10. `my-site` cleanup after parity.
11. Public GitHub publication and first self-hosted release.

Only package 1 receives a plan now. Before each later package starts, write its own approved design spec and decision-complete implementation plan. Execute plans in separate sessions with `superpowers:executing-plans`; subagents are not assumed.

Future backlog families each require their own JIT spec and plan: Resume customization, Knowledge dashboard, every new typed Knowledge item, calendar views, events, reminders, import/export, search, additional UI locales, editor improvements, and monitoring improvements.

## Source handoff and cleanup

Until feature and operational parity are proven, Knowledge, Calendar, Resume, production, and security code and documentation stay operational in `my-site`.

The source roadmap gets a separate unfinished parity/cutover cleanup item without changing the existing repository-split TODO. Public GitHub positioning stops advertising private Knowledge and Resume during this documentation package.

After the target parity gate, package 10 must:

- remove the `private-people-knowledge-base` updates milestone;
- remove Resume from the `admin-workspaces` milestone;
- update timeline tests for the resulting public milestone set;
- remove private Knowledge claims from the RU and EN public case-study content;
- remove source code and schemas only after a fresh verified backup and separate destructive confirmation.

It must not add a public milestone about the repository split.

## Documentation control-plane acceptance criteria

- A fresh local repository exists on `main` with one initial commit and no remote.
- Every tracked path begins with `docs/`.
- The repository contains no source code, runtime configuration, dependency manifest, lock file, asset, database, secret, or copied user data.
- Canonical English product, architecture, migration, ADR, source-baseline, roadmap, license, spec, and plan documents exist.
- Resume, Calendar, and Knowledge source TODO wording and checkbox history are preserved; Knowledge V2/V3 are accounted for only as superseded non-goals.
- Every source TODO family has a `moved`, `stays`, `adapted`, or `superseded` allocation.
- `my-site` retains runtime documentation and receives only the agreed source roadmap and public-positioning documentation edits, left unstaged and uncommitted.
- Markdown links, terminology, routes, and ADRs are consistent, with no unresolved planning placeholders or conflicting target requirements.
