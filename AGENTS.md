# Personal Workspace agent guidance

## Project boundary

Personal Workspace is a self-hosted, single-operator workspace for private data. The monorepo
contains independently testable `backend`, `frontend`, and `infra` contours. Use
`personal-workspace`, `personal_workspace`, and `Personal Workspace` consistently for project
identifiers.

- Do not perform Git operations that change repository state unless the user explicitly requests
  them.
- Do not commit secrets, tokens, certificates, private keys, production environment values, or
  private data. Configuration is environment-backed; deterministic non-production credentials are
  permitted only in dedicated test configuration.
- Preserve the private-network baseline: no public service ports outside nginx, host networking,
  privileged containers, Docker socket mounts, broad capabilities, or root runtime users without
  an explicit, documented security decision.
- Keep PostgreSQL, Valkey, MinIO, TaskIQ, and internal operational panels private. Do not introduce
  public object URLs or a public media-delivery path.

## Engineering and quality

- For non-trivial work, make a focused implementation plan before editing. Follow explicit task
  constraints over this default.
- Implement normal behavior changes and bug fixes with focused tests when practical. Run relevant
  checks through existing Make targets before claiming success; report any intentionally skipped
  checks.
- Treat actionable warnings as failures. Keep documentation, infrastructure, CI, and applicable
  `AGENTS.md` files aligned with changes.
- Do not add production defaults where an explicit caller or environment value is required. Use
  `null` only when absence is semantically necessary.
- Prefer existing Make targets for installation, checks, migrations, and local runs. Keep Makefiles
  thin; shell and orchestration logic belongs in dedicated scripts.
- Do not modify dependency lock files unless dependencies intentionally changed.

## Architecture and security

- Every HTTP handler must be classified as public-authentication, protected-operator, or
  internal-operational before implementation. Enforce protected behavior in the backend, not only
  in the frontend.
- The frontend is an Angular client-rendered application. Do not introduce SSR, hydration,
  transfer-cache, sitemap, robots, canonical public SEO, or public-site routing.
- Interface localisation is backend-bundle driven. Keep user-facing UI strings in the interface
  catalog and do not invent implicit language fallbacks.
- Render authored Markdown or HTML only through the centralized sanitized renderer. Never bypass
  Angular sanitization or bind raw authored content to `[innerHTML]`.
- Do not add Agent REST/MCP/PKI, agent bridge settings, Locust, admin-panel, roles, tenants, or
  public content without a new approved design.

More specific rules belong in nested `AGENTS.md` files under `backend/`, `frontend/`, and `infra/`.
