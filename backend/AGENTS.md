# Backend Instructions

These rules apply to all backend-owned code, configuration, tooling, documentation, and supporting
files under `backend/`. Keep shared cross-project configuration and common infrastructure outside
`backend/`.

## Code Style

- line-length: 100 (ruff + black)
- ruff: ALL rules, see ignores in `pyproject.toml`
- mypy: strict mode (`disallow_untyped_defs = true` etc.)
- No docstrings unless interface is non-obvious from types
- Comments: only for non-obvious WHY, never WHAT
- No Python class name may start with a leading underscore anywhere under `backend/`, including
  production code, tests, migrations, scripts, and performance tooling; there are no exceptions.
  Give every class a clear public name and control module exports through import/export boundaries
  rather than private class naming.
- Keep environment/configuration values, shared operational limits, and configurable policy values
  in `backend/src/infra/config/constants.py`. Domain invariants, parser-specific rules, adapter-local
  mappings, and other implementation constants belong with the domain, parser, or adapter that owns
  them. Core code must receive infrastructure-owned configuration through schemas, constructor
  parameters, or IOC wiring, while infra and entrypoint code may import `constants` directly when
  that layer owns the wiring.

## Tooling Boundaries

- Performance and test tooling may import reusable application contracts from `backend/src`, such
  as enums, schemas, factories, and public helpers, but tooling-specific infrastructure must live
  with that tooling. Do not create performance-only or test-only support modules under
  `backend/src`; keep performance support under `backend/performance/` and test support under
  `backend/tests/`.

## Operation Boundaries

- Do not model entity mutation methods as `upsert` when the behavior can create, update,
  delete, or otherwise mutate different state. Use explicit operation-specific names and methods
  such as `create_*`, `update_*`, `delete_*`, `publish_*`, or `set_*` so callers cannot
  accidentally trigger broader behavior than intended.

## Background Tasks

- TaskIQ entrypoints live under `backend/src/entrypoints/taskiq/`.
- Keep `backend/src/entrypoints/taskiq/broker.py` as the shared broker and
  `backend/src/entrypoints/taskiq/worker.py` as the worker/scheduler registry entrypoint.
- Put domain task wrappers in domain packages such as
  `backend/src/entrypoints/taskiq/cache_warm/tasks.py`; do not collect unrelated tasks in a
  top-level `tasks.py`.
- Background tasks are internal worker/scheduler processes, not HTTP handlers.
- Run exactly one TaskIQ scheduler process in deployment. Scale TaskIQ workers when more background
  execution capacity is needed.
- TaskIQ result metadata is operational and ephemeral in Valkey unless a future durable task
  history/auditing design explicitly chooses another backend.

## Persistence

- SQLAlchemy models and database storages live only under `backend/src/infra/postgresql/`.
- Database storages return domain schemas, not ORM models.
- Storages may `flush`, but must not `commit`; transaction ownership belongs to the DI/session provider.
- Every DB model change must include a matching Alembic migration.

## Performance

- For backend changes that can realistically affect PostgreSQL query shape, storage access patterns,
  indexes, migrations, or data-volume behavior, run `make query-plans-realistic` before the first
  implementation change and again after the task, then compare the generated reports.
- Skip the before/after query-plan workflow for changes outside the PostgreSQL performance contour,
  and for narrow documentation, formatting, test-only, typing-only, naming-only, or localized
  mechanical changes. If a pre-change run cannot be performed because the task starts from a broken
  state, record that in the final response and compare against the nearest available baseline/report.

## Dependency Injection

- Dishka providers are wiring only: no business logic, DB queries, or external side effects.
- Use `Scope.APP` only for stateless singleton-safe dependencies; use `Scope.REQUEST` for sessions, storages, and use cases.
