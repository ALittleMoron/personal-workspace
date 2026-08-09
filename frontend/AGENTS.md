# Frontend instructions

These rules apply to all files under `frontend/`.

- Keep Angular 22 packages and Angular tooling on the same major. The application is standalone,
  client-rendered, strict TypeScript; do not add an `NgModule`, server entrypoint, hydration,
  transfer cache, public discovery metadata, or server rendering.
- Keep components standalone and `OnPush`. Prefer `inject()`, typed forms, signals for local state,
  semantic HTML, accessible names, and backend-owned interface strings.
- Feature services use `ApiClient`, not `HttpClient` directly. Return `Observable<T>` and map DTOs
  explicitly when their transport and UI shapes differ.
- Render authored Markdown only through `MarkdownRendererService`; never bypass Angular
  sanitization or bind untrusted raw HTML.
- Keep transient notifications auto-dismissing. Persistent failures belong in stable inline or
  page state.
- Use Jest for focused behavior tests. Run checks through the frontend Make targets when the task
  permits execution; report checks intentionally skipped.
- The production image must remain non-root, listen on port 4000, expose `/healthz`, and use CSR
  history fallback.
