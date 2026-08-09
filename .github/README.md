# Personal Workspace

[Русская версия](README_RU.md)

`personal-workspace` is a self-hosted workspace for one operator and private data. The repository
contains a Python/Litestar backend, an Angular client-rendered frontend, and production-oriented
container infrastructure. Product domains are added on top of this reusable foundation.

## Prerequisites

- Docker Engine with the Compose plugin
- Python 3.14 and [uv](https://docs.astral.sh/uv/)
- Node.js version specified by `frontend/.nvmrc` and npm
- GNU Make
- Ruby for YAML-aware GitHub Actions policy validation

## Install and run locally

Install both application workspaces:

```sh
make install
```

Run the backend and frontend in separate terminals:

```sh
make -C backend run-local
make -C frontend run
```

The backend also requires locally reachable PostgreSQL, Valkey, and MinIO endpoints configured in
its environment. Use `make run` when you want the repository-managed dependency stack instead.

The backend listens on `http://localhost:8000`. Angular listens on `http://localhost:4200` and
proxies same-origin `/api` requests to the backend.

For the container stack, copy `.env.example` to `.env`, fill every required blank credential, and
set mode `0600`. `SENTRY_DSN` may be blank only when `SENTRY_USE=false`. The checked-in `.env.test`
contains deterministic test-only credentials and must not be used outside tests. Configure DNS and
issue the initial certificate before the first stack start:

```sh
make certbot-issue
make run
make stop
```

The stack includes PostgreSQL, Valkey, private MinIO, Databasus, slot-scoped TaskIQ workers with
exactly one active scheduler, blue/green backend and frontend slots, and nginx TLS termination.
nginx is the only public application entrypoint. The MinIO Console and Databasus are available only
through the configured WireGuard interface.

Renew or resynchronize certificates later with:

```sh
make certbot-renew
make certbot-sync
```

## Checks

Common quality and security entrypoints:

```sh
make quality-backend
make quality-frontend
make security-backend
make security-frontend
make security-infra
make security
```

Container checks are available through `make lint-dockerfiles`, `make lint-docker-images`, and
`make security-trivy-config`.

Test entrypoints:

```sh
make tests-fast
make tests
make tests-compose
make tests-coverage
make tests-coverage-frontend
make performance-lighthouse
```

Additional focused wrappers are listed in the root `Makefile` and the backend/frontend Makefiles.

## Documentation

- [Documentation index](../docs/README.md)
- [Production deployment](../docs/production-deploy.md)
- [WireGuard internal access](../docs/wireguard-internal-access.md)
- [Security threat model](../docs/security-threat-model.md)

## Data policy

A new installation starts with an empty application schema and private object storage. Data import
is a separate, explicitly designed operation. Never reuse production secrets, certificates,
environment files, caches, reports, coverage artifacts, dependencies, or build output as input to
a new installation.

## License

Personal Workspace is licensed under the
[GNU Affero General Public License v3.0](../LICENSE).
