# Personal Workspace

[🇷🇺 Russian version](./README_RU.md)

| Category | Technologies |
| --- | --- |
| Coverage | ![coverage-backend](./badges/coverage-backend.svg) ![coverage-frontend](./badges/coverage-frontend.svg) |
| Backend | ![python](./badges/python.svg) ![litestar](./badges/litestar.svg) ![async](./badges/async.svg) ![pydantic](./badges/pydantic.svg) ![dishka](./badges/dishka.svg) ![taskiq](./badges/taskiq.svg) ![paseto](./badges/paseto.svg) ![argon2](./badges/argon2.svg) |
| Database | ![postgresql](./badges/postgresql.svg) ![sqlalchemy](./badges/sqlalchemy.svg) ![alembic](./badges/alembic.svg) |
| Cache | ![valkey](./badges/valkey.svg) |
| Frontend | ![angular](./badges/angular.svg) ![typescript](./badges/typescript.svg) ![bootstrap](./badges/bootstrap.svg) |
| Testing | ![pytest](./badges/pytest.svg) ![jest](./badges/jest.svg) ![lhci](./badges/lhci.svg) |
| DevOps | ![docker](./badges/docker.svg) ![nginx](./badges/nginx.svg) ![minio](./badges/minio.svg) ![docker-compose](./badges/docker-compose.svg) |
| Quality | ![ruff](./badges/ruff.svg) ![mypy](./badges/mypy.svg) ![bandit](./badges/bandit.svg) ![pip-audit](./badges/pip-audit.svg) ![trivy](./badges/trivy.svg) ![hadolint](./badges/hadolint.svg) ![dockle](./badges/dockle.svg) ![vulture](./badges/vulture.svg) ![eslint](./badges/eslint.svg) ![prettier](./badges/prettier.svg) |

Portfolio site with a localized public case study and updates, plus a private administrator
workspace for resumes and the Knowledge database. The environment-configured authenticated owner
uses an encrypted session to access `/api/admin/*`; domain access remains author-scoped for a future
multi-user model.

## Documentation

- [Knowledge database](../docs/knowledge-database.md)
- [Calendar](../docs/calendar.md)
- [Production deployment](../docs/production-deploy.md)
- [Security threat model](../docs/security-threat-model.md)
- [WireGuard internal access](../docs/wireguard-internal-access.md)
- [Roadmap](../docs/TODO.md)

## Project structure

```text
personal-workspace/
├── backend/        # Litestar API, async domain/application code, tests and query-plan gates
├── frontend/       # Angular CSR application and Node static shell with per-request CSP nonce
├── infra/          # nginx edge, MinIO wrapper, deployment, TLS and security scripts
├── docs/           # domain, operations, security and roadmap documentation
├── docker-compose.yml
└── .env.example
```

nginx is the TLS edge. It proxies `/api/*` to Litestar and all browser navigation to the Node
static shell. The shell serves Angular's browser build, caches versioned assets, injects the nginx
CSP nonce into `index.html`, exposes `/healthz`, and returns the SPA shell only for HTML navigation.

## Quick start

1. Clone the repository and create local configuration:

   ```bash
   cp .env.example .env
   ```

2. Set every value in `.env`. `IMAGE_TAG` is required by Compose; local development may use an
   explicit throwaway tag. Keep actual secrets out of Git.

3. Provide local TLS certificate files under `infra/nginx/certs/` when using the HTTPS edge. The
   nginx container needs read access to them. For production, use the documented Let’s Encrypt flow.

4. Start the stack:

   ```bash
   make run
   ```

## Endpoints

The local nginx edge redirects HTTP to HTTPS.

- Frontend: `https://localhost`
- API: `https://localhost/api`
- Liveness: `https://localhost/api/healthcheck`
- Readiness: `https://localhost/api/healthcheck/ready`
- API documentation: `https://localhost/api/docs`
- OpenAPI document: `https://localhost/api/docs/openapi.json`

MinIO Console and Databasus are not public. nginx binds them only to `VPN_BIND_ADDRESS` on ports
`18081` and `18082`; see [WireGuard internal access](../docs/wireguard-internal-access.md).

## Quality gates

Use Make targets rather than invoking the underlying tools directly:

```bash
make tests
make security
make query-plans-realistic
make performance-lighthouse
```

The query-plan gate exercises current Knowledge and Resume storage queries. Lighthouse evaluates
the CSR routes for performance, accessibility and best practices.
