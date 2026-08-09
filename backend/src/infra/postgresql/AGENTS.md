# PostgreSQL Instructions

- Keep SQLAlchemy and Alembic ownership inside this directory.
- The repository migration history starts at `0001_initial_schema.py`.
- Every future model change requires a matching migration and upgrade/downgrade coverage.
- Keep session transaction ownership in the Dishka provider. Never hide commits in adapters.
- Preserve guarded test-database names and isolated xdist database creation.
- Keep query logging privacy-safe: normalized/truncated SQL only, never parameters.
