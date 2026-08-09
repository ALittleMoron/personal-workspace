# Backend Test Instructions

- Keep unit tests isolated from PostgreSQL, Valkey, MinIO, and network services.
- Integration and migration tests may use only deterministic test configuration and explicitly
  guarded database names ending in `_test` or their generated worker/template variants.
- Prefer compact foundation fixtures and test doubles over product factories or providers.
- Cover architecture import boundaries, registered routes, configuration, logging, readiness,
  transports, TaskIQ wiring, clean migrations, and an empty-app HTTP smoke.
