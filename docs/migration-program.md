# Migration Program

## Strategy

The extraction uses staged platform construction, not a full-history fork or a snapshot-and-prune
copy. Each work package leaves the target repository independently understandable and verifiable.
Late plans are created just in time so they use real paths and interfaces rather than assumptions.

No existing data is migrated. The source application remains authoritative until operational
parity is demonstrated.

## Work Packages

### 1. Documentation control plane

Create the fresh local repository, accepted decisions, source inventory, curated TODO allocation,
and this program. Update only the approved `my-site` documentation and leave those source changes
unstaged and uncommitted.

**Exit gate:** the new repository contains only `docs/`, one initial commit, no remote, no
placeholders, and no copied code/configuration/data.

### 2. Backend foundation

Introduce a clean Litestar backend skeleton with settings, logging, Dishka, PostgreSQL/Alembic,
Valkey, S3, TaskIQ, health, backend-driven UI i18n, and Make-backed checks. Do not copy product
domains, accounts/roles, public content, or Agent code.

**Exit gate:** the backend installs and passes its complete initial Make-backed quality suite
without a product database schema.

### 3. Angular CSR foundation

Introduce an Angular client-rendered shell with the shared theme, API/error/notification
primitives, backend-driven RU/EN interface localization, responsive protected layout, and
Make-backed test/lint/type/build checks. Do not copy SSR/SEO or source product features.

**Exit gate:** the CSR shell builds and its focused UX/route tests pass without SSR tooling.

### 4. Infrastructure and delivery foundation

Wire backend/frontend images, PostgreSQL, Valkey, MinIO, Databasus, TaskIQ, nginx/TLS, VPN-only
panels, Sentry, blue/green delivery, and CI/security/deployment checks. Exclude the Agent contour.
Move the AGPL text to canonical root `LICENSE` when code enters the repository.

**Exit gate:** an empty stack starts, passes health and security invariants, restarts safely, and
cleans up only resources it started.

### 5. Single-operator authentication

Implement configured credentials, Argon2id verification, Valkey session lifecycle, PASETO access,
CSRF/Fetch Metadata checks, rate limiting, and the login/restore/logout UI. Protect the application
without users, roles, accounts, or author scoping.

**Exit gate:** authentication, expiry, rotation, logout, credential rotation, brute-force limits,
CSRF, XSS token-storage boundaries, and inaccessible protected routes have automated coverage.

### 6. People + shared Knowledge, tags, and private files

Build the shared Knowledge item/tag/private-file foundation and the complete People workflow:
relationships, birthdays, Markdown, photos, attachments, search, filters, and responsive UX. Use a
clean single-operator schema and non-admin routes.

**Exit gate:** People works end to end against PostgreSQL and MinIO with IDOR assumptions removed,
private-file invariants preserved, and query plans verified.

### 7. Dates + Calendar/Dashboard

Build memorable Dates, Person links/backlinks, attachments, recurring-date validation, and the
dashboard Calendar composition. Keep Calendar separate from Knowledge Dates and leave an explicit
future boundary for Events and reminders.

**Exit gate:** Dates and Calendar work end to end with stable sorting, private data handling,
responsive UX, and query-plan coverage.

### 8. Resume CRUD + PDF/DOCX export

Build author-less structured Resume CRUD, independent RU/EN document locale, validation, preview,
and PDF/DOCX export on non-admin routes.

**Exit gate:** create/edit/delete/preview/export flows pass behavioral, accessibility, and document
verification without public pages or SEO.

### 9. Operational parity: security, UX, backup/restore, performance, and deployment

Run the full security, UX, backup/restore, performance, query-plan, deployment, restart, logging,
and documentation review on a clean installation.

**Exit gate:** every acceptance row has fresh evidence and no actionable warning remains.

### 10. `my-site` cleanup after parity

After parity, remove Knowledge, Dates/Calendar, Resume, their frontend/backend wiring, i18n, tests,
query scenarios, and private-file infrastructure from `my-site`. Generate a dedicated schema
removal migration. Take a fresh backup and obtain separate confirmation before deleting tables or
the old private bucket.

Delete the `private-people-knowledge-base` public update milestone, remove Resume from the
`admin-workspaces` milestone, update timeline tests, and remove private Knowledge claims from the
RU/EN public case study. Do not add a replacement split milestone.

**Exit gate:** `my-site` passes its full practical suite, publishes only its public-site story, and
contains no live dependency on the extracted product.

### 11. Public GitHub publication and first self-hosted release

Review secrets, provenance, license placement, setup documentation, security expectations, and
release artifacts. Create public `ALittleMoron/personal-workspace`, push the fresh history, and
publish the first documented self-hosted release.

**Exit gate:** a third party can deploy the released version from public documentation without
private source-repository context.

## Planning and Execution Gate

Before packages 2-11 start:

1. Inspect the then-current repositories.
2. Write and approve one focused design document.
3. Run its ambiguity, consistency, scope, and placeholder review.
4. Write one complete `superpowers:writing-plans` implementation plan with exact files,
   interfaces, tests, expected failures/passes, and commits.
5. Execute in a separate session with `superpowers:executing-plans` unless the user explicitly
   requests subagent-driven execution.

No empty or speculative plan files reserve future names.
