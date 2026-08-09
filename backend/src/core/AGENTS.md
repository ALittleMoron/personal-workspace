# Core Layer Instructions

- `src/core/**` may import only the Python standard library and `core.*` modules.
- Keep core primitives independent of Litestar, Dishka, SQLAlchemy, S3, Valkey, logging, and
  environment configuration.
- Put framework and transport behavior in `src/infra` or `src/entrypoints` and pass values through
  explicit typed contracts.
- Keep exceptions transport-neutral and identifiers deterministic under injected generators.

