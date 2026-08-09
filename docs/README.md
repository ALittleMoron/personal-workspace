# Personal Workspace documentation

`personal-workspace` is a self-hosted, open-source workspace for one operator and private data.
The repository contains reusable backend, Angular CSR, infrastructure, CI, and deployment
foundations. Authentication and product domains are planned but not implemented yet.

## Canonical documents

- [Product vision](product-vision.md) defines the audience, scope, non-goals, and success criteria.
- [Target architecture](target-architecture.md) records current and future system contracts.
- [TODO](TODO.md) is the active product and engineering backlog.
- [Decisions](decisions/) contains accepted architecture decisions.
- [Production deployment](production-deploy.md), [WireGuard internal access](wireguard-internal-access.md),
  and the [security threat model](security-threat-model.md) describe the implemented operational
  foundation.

## Implemented foundation

The backend provides only infrastructure health, readiness, interface-catalog, and API-documentation
routes. The frontend is a standalone client-rendered Angular application with a foundation page,
backend-owned RU/EN interface strings, shared UI utilities, and centralized sanitized Markdown
rendering. nginx is the public TLS edge for same-origin browser and `/api` traffic; PostgreSQL,
Valkey, MinIO, TaskIQ, Databasus, backend, and frontend services remain private.

## License

Personal Workspace is licensed under the GNU Affero General Public License v3.0. The canonical
license text is the repository-root [`LICENSE`](../LICENSE).
