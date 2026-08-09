# Backend Instructions

These rules apply to all files under `backend/`.

- Keep the foundation limited to infrastructure routes, configuration, persistence plumbing,
  object storage, Valkey, TaskIQ, and shared framework-independent primitives.
- Classify every HTTP handler as public-authentication, protected-operator, or
  internal-operational before implementation. The foundation health and interface-catalog routes
  are internal-operational and expose no private data.
- Keep environment-owned values typed and required. Never add production secret defaults.
- Use Dishka for application and request dependency lifetimes. Persistence adapters may flush but
  transaction/session providers own commit and rollback.
- Keep structured logs free of request bodies, query strings, headers, credentials, and private
  data. Propagate an opaque request ID for correlation.
- Use Ruff with a 100-character line length and strict mypy. Do not add leading underscores to
  Python class names.
- Add focused tests for ordinary behavior changes, and use the existing Make targets for checks
  unless a task explicitly prohibits running tests.
- Do not introduce contours outside the approved private single-operator architecture.
