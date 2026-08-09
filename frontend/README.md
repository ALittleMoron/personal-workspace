# Personal Workspace frontend

Strict standalone Angular 22 client-rendered application for the private Personal Workspace.
Interface text is loaded from the backend `/api/i18n` endpoints. The application currently exposes
only the foundation page and the not-found route.

Use Node.js 24.16.0 for local commands:

```bash
make install
make run
```

The development server listens on `http://localhost:4200` and proxies same-origin `/api` requests
to the local backend on `http://localhost:8000`. Production keeps the same-origin `/api` contract
through the nginx edge; no production CORS exception is required. Quality targets include `test`,
`test-coverage`, `format`, `format-check`, `lint`, `security`, `typecheck`, `build`, `lighthouse`,
and `quality`.

The production image builds static browser assets and serves them as a non-root nginx process on
port 4000. `/healthz` returns an internal health response and browser routes fall back to
`index.html`.

For every HTML response, nginx substitutes its fresh request identifier into both the bootstrap
script nonce and Angular's `ngCspNonce`, and uses that exact value in the enforced
`Content-Security-Policy` response header. Any edge proxy introduced later must preserve both the
frontend HTML and its origin CSP header; rewriting either side would break the per-response nonce
equality contract used by Angular and CodeMirror. `index.html` is marked `no-store` so a cached HTML
body cannot be paired with a later response's fresh nonce.
