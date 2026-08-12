# Roadmap

This roadmap lists retained work only. Completed migration cleanup, deleted domains and obsolete
runtime approaches are intentionally not tracked here.

## Authorization

- [ ] Implement the environment-configured single-administrator authenticator that supplies a
  verified request-scope identity to the existing fail-closed `/api/admin/*` guard.
- [ ] Add end-to-end authorization, session-expiry and protected-blob tests without introducing
  account or team tables.

## Operations and resilience

- [ ] Establish encrypted, access-controlled coordinated backups for PostgreSQL and both required
  MinIO data sets, including `knowledge-private`.
- [ ] Perform and record an isolated restore exercise that reconciles private Knowledge metadata and
  object bytes, then repeat it on a schedule.
- [ ] Add maintainer monitoring for production health, errors, backup freshness and restore status.

## Quality and performance

- [ ] Review query-plan baselines after intentional schema or query changes and keep them focused on
  retained Knowledge and Resume storage paths.
- [ ] Keep CSR Lighthouse budgets and accessibility/performance/best-practice gates meaningful as
  public content and bundles evolve.
- [ ] Define production slow-query monitoring and an actionable response process after a concrete
  service-level target is chosen.

## Knowledge and resumes

- [ ] Add future Knowledge item types only with typed persistence extensions, use cases and explicit
  workspace UX.
- [ ] Improve resume and Knowledge editing ergonomics based on real single-administrator use, while
  preserving sanitized Markdown rendering and protected file delivery.
