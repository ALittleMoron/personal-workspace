# Frontend application architecture

- `core/` owns application-wide infrastructure; it must not import `features/` or `shared/`.
- `shared/` owns domain-independent UI and utilities; it must not import feature code or application
  data services. `testing/` is test-only.
- `features/` owns routed product slices. Different features must not import one another.
- Keep root routing declarative and lazy-load substantial product slices.
- Load available languages and the selected bundle from `/api/i18n` at startup. Persist only codes
  returned by the backend and do not invent interface-language fallbacks.
- The backend-unavailable startup screen may use only the explicit minimal RU/EN bootstrap catalog;
  normal application UI remains backend-catalog owned.
- Keep shared controls standalone and `OnPush`, with explicit inputs/outputs and native-grade
  accessibility, keyboard behavior, forms integration, and CSP-compatible styling.
- Keep `app.config.ts` limited to browser-wide router, HTTP, error, i18n, notification, and theme
  providers. Do not add authentication, authorization, privileged workspace, or public-site
  composition without an approved design.
