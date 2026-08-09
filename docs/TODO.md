# TODOs

This is the active roadmap for Personal Workspace. Product capabilities remain unchecked until
they are implemented and verified in this repository.

## Foundation verification

- [ ] Run backend and frontend quality, type, security, and test targets.
- [ ] Build and scan the backend, frontend, and nginx images.
- [ ] Start the complete stack and verify readiness, edge health, restart behavior, and shutdown.
- [ ] Exercise blue/green replacement and fail-closed rollback.
- [ ] Verify certificate issue/renewal and an isolated backup/restore cycle.

## Single-operator authentication

- [ ] Implement environment-backed operator credentials and Argon2id verification.
- [ ] Implement Valkey-backed opaque sessions, renewal, rotation, logout, and revocation.
- [ ] Add short-lived in-memory access tokens and protected backend/frontend routes.
- [ ] Verify CSRF, Fetch Metadata, rate limiting, cache policy, and privacy-safe audit events.

## Knowledge

- [ ] Implement the shared taxonomy, tags, private-file, and typed-item foundation.
- [ ] Add People with birthdays, relationships, photos, notes, tags, and attachments.
- [ ] Add memorable Dates with People links, notes, tags, and attachments.
- [ ] Add extended search across item types and fields.
- [ ] Design Books, Companies, Places, Projects, Recipes, Software, Techchecks, Techniques, and
  Technologies as explicit typed domains when needed.
- [ ] Add documented import/export workflows, including an optional Obsidian import.

## Calendar and dashboard

- [ ] Implement the dashboard calendar projection for birthdays and memorable dates.
- [ ] Add day, week, month, and year views.
- [ ] Design one-time and recurring Events as their own storage boundary.
- [ ] Add reminders only after delivery channels and their privacy model are approved.

## Resumes

- [ ] Implement private structured RU/EN resume CRUD.
- [ ] Add list, create, edit, preview, delete, and independent document-locale controls.
- [ ] Add accessible PDF and DOCX export with ATS-oriented verification.
- [ ] Add block ordering, visibility, and themes without weakening export portability.

## Markdown editor

- [ ] Add outline navigation and source-preserving folding for headings, lists, and code blocks.
- [ ] Add sanitized callouts, footnotes, templates/snippets, math, and diagrams.
- [ ] Add private attachment upload progress, cancellation, retry, metadata, and safe preview.
- [ ] Convert pasted rich HTML into sanitized portable Markdown.
- [ ] Make task-list checkboxes accessible and undoable.
- [ ] Add source-preserving highlights, private comments, and indentation guides.

## Operations

- [ ] Wire backend and frontend failures to Sentry without private content.
- [ ] Add privacy-safe slow-query timing with explicit deployment thresholds.
- [ ] Add status visibility for uptime, backups, restore tests, service health, and errors.
- [ ] Add PostgreSQL, nginx, host/container, Valkey, and MinIO metrics after approving an
  observability threat model and VPN boundary.
- [ ] Alert on latency, 5xx spikes, event-loop lag, certificate expiry, backup freshness, disk
  pressure, and container failure.
