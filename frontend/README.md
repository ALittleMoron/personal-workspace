# Personal Workspace Frontend

The public edge remains infrastructure-owned nginx:

- `/api/*` is proxied to Litestar.
- Browser navigation is proxied to the frontend Node static shell.
- TLS, public domain routing, MinIO routing and VPN-only panels belong to `infra/`.

The application is Angular CSR only. Angular builds browser assets; the Node/Express runtime serves
them, returns `/healthz`, caches versioned static assets, and serves `index.html` only for requests
that accept HTML and have no file extension. nginx supplies a per-request CSP nonce; the shell
validates it before replacing the `__CSP_NONCE__` placeholders in the HTML.

## Development and build

Use the Node version in `.nvmrc` for local commands. Make targets prepare dependencies when needed:

```bash
make test
make lint
make typecheck
make format-check
make build
```

The production browser build is under `dist/personal-workspace-frontend/browser`;
`tsconfig.runtime.json` compiles the small Node static runtime under
`dist/personal-workspace-frontend/runtime`. The runtime requires an explicit positive `PORT`, and
Compose provides `PORT=4000`.

## Lighthouse

Run the CSR quality gate with:

```bash
make lighthouse
```

It builds the application, uses the static server, and audits the anonymous login and authenticated
workspace routes for performance, accessibility, and best practices. Reports are written to
`performance/reports/lighthouse/`.

## Docker image

Build from this directory:

```bash
docker build -t "personal_workspace_frontend:${IMAGE_TAG:?set IMAGE_TAG}" .
```

The builder and runtime use the pinned Node Alpine image. The runtime installs production
dependencies, removes npm tooling/cache, runs as the non-root `node` user with a read-only root
filesystem supplied by Compose, and starts
`dist/personal-workspace-frontend/runtime/static-runtime.js`.

## Repository boundary

Frontend-owned files include Angular source, static assets, tests, the frontend Dockerfile and the
Node static shell. Do not move TLS, edge proxy, backend API, MinIO, VPN-panel routing or deployment
ownership into this directory.
