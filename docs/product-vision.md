# Product Vision

## Purpose

Personal Workspace is a self-hosted application for keeping private personal context in one place:
knowledge records, people, memorable dates, files, calendar projections, and structured resumes.
Its source code is open for anyone to inspect, deploy, modify, and redistribute under AGPL-3.0;
each installation remains controlled by one operator.

The project is extracted from private owner-only features that do not belong in the public product
story of `my-site`. It receives a fresh history and a product boundary of its own instead of
remaining an administrative annex of a public portfolio and article site.

## Audience

- A person who wants to run a private workspace on infrastructure they control.
- A maintainer who values explicit data models, exportable files, reproducible deployment, and
  operational documentation.
- An open-source contributor improving a single-operator product without turning it into a hosted
  multi-user service.

## Product Principles

1. **Single operator.** One configured login controls one installation. There are no user,
   account, role, team, registration, recovery, or author-ownership models.
2. **Private by default.** Product data is authenticated, excluded from indexing and SSR transfer,
   returned with restrictive cache policy, and never exposed through public object URLs.
3. **Self-hosted ownership.** PostgreSQL data, private object storage, secrets, backups, and runtime
   processes stay under the operator's control.
4. **Typed domains.** New knowledge types use explicit models and workflows rather than an EAV,
   arbitrary JSON-field, or universal dynamic-form system.
5. **Portable authored content.** Knowledge text is stored as written and is not coupled to the UI
   language. Import, export, and backup integrity are first-class roadmap concerns.
6. **Operational completeness.** A feature is not complete until its security, backup, restore,
   deployment, observability, documentation, and removal implications are checked.
7. **No speculative platform.** Multi-user SaaS, public knowledge publishing, and unused machine
   access contours are excluded unless a later explicit product redesign replaces this vision.

## Initial Functional Scope

- Login, session restoration, and logout for one configured operator.
- A private dashboard with calendar projections.
- Knowledge taxonomy and private files.
- People, birthdays, relationships, photos, and attachments.
- Memorable dates, People links, notes, tags, and attachments.
- Structured RU/EN resume documents with preview and PDF/DOCX export.
- RU and EN interface catalogs; authored knowledge may use any language.
- Reproducible self-hosting, backups, restoration, security checks, and documented operation.

## Non-goals

- Public knowledge items or public resume pages.
- Users, roles, teams, registration, password recovery, profiles, or per-author isolation.
- SaaS tenancy, billing, subscriptions, social features, or collaborative editing.
- Public articles, competency matrices, courses, SEO pages, or anonymous analytics.
- Angular SSR or hydration transfer for product pages.
- Agent REST APIs, remote MCP, certificate PKI, generic automation, or AI features without a new
  bounded design.
- Migration of existing production records or private objects from `my-site`; the first
  installation starts empty.

## Success Criteria

- A new operator can deploy the documented stack, configure credentials through secrets, log in,
  and use every initial feature without creating an account.
- A clean installation starts from one target-owned initial database schema and empty private
  bucket.
- Restart, backup, restore, logout, session expiry, and credential rotation have verified behavior.
- Private records and files never appear in public routes, SSR output, search discovery, transfer
  cache, public object storage, or unauthenticated API responses.
- `my-site` removes the extracted features only after the new product passes its documented parity
  gate.
