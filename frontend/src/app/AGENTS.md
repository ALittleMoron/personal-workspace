# Frontend Architecture Instructions

These rules apply to every file under `frontend/src/app/`, including TypeScript, templates, styles,
tests, and app-specific supporting files.

## Layer Structure

```text
frontend/src/app/
├── core/          # App-wide infrastructure only
├── shared/        # Reusable UI primitives and framework-independent utilities
├── features/      # Feature modules — all domain code lives here
└── testing/       # Shared test-only helpers
```

## Strict Import Rules

Never violate these boundaries:

- `core/` must not import from `features/` or `shared/`.
- `features/<a>/` must not import from `features/<b>/`.
- `shared/` must not import from `features/` or application data/state services. Shared code may use
  Angular infrastructure and narrowly scoped cross-cutting i18n or rendering contracts when the
  component remains domain-independent.
- `testing/` is test-only and must not be imported by production code.
- Feature services must not inject `HttpClient` directly; use `ApiClient` from `core/http/`.
- When one feature needs data that is also used by another feature, do not import that other
  feature's service or model just for convenience. Add a small feature-owned service/model over the
  shared backend endpoint, or move a genuinely reusable primitive to an allowed shared layer.

## `core/` Responsibilities

- Keep only app-wide infrastructure and cross-cutting capabilities in `core/`, such as HTTP, i18n,
  rendering, routing, layout, privacy, notifications, uploads, and SEO.
- Do not move feature workflows, feature DTOs, or feature-owned state into `core/` merely to share
  them. Extract only a stable cross-cutting contract with multiple real consumers.
- Keep canonical contracts in their source modules instead of duplicating file inventories or type
  definitions in this instruction file.

## I18n

- Runtime i18n is loaded once on app startup from the backend: request available languages first,
  then request the selected language bundle.
- Public prefixed routes (`/ru/...` and `/en/...`) must initialize UI/content language from the URL.
  Keep legacy unprefixed routes only for compatibility/protected SPA access, not canonical SEO.
- Do not hardcode user-facing interface strings in Angular templates or components. Use
  `TranslatePipe` in templates and `I18nService.translate()` in TypeScript code.
- The public updates page is static authored content, not UI catalog content. Keep accumulating
  changelog entries in `features/updates/updates.timeline.ts` as typed objects with `id`, `month`,
  `order`, localized RU/EN `title` and `summary`, and finite `tagIds`. Do not add
  `updates.month.*` or `updates.entry.*` keys to backend i18n; backend i18n for updates stays
  limited to page chrome, SEO text, footer label, and finite tag labels. Do not add tests that pin
  exact milestone copy, dates, ordering, or tag assignments; tests may cover grouping/localization
  behavior and the structural content shape.
- For sufficiently large user-visible, architectural, security, operations, or delivery changes,
  ask whether they should be added to the public updates page. Skip routine refactors, small fixes,
  incidental cleanup, dependency churn, and implementation-only details; group related work under a
  larger milestone when that is more natural.
- Persist only supported language codes returned by the backend. Do not introduce frontend-only
  languages or language fallbacks that bypass the backend enum/catalog.
- Resume workspace content is single-language per resume. Forms must send required `language` plus
  one content shape, must not add resume-specific RU/EN controls, and must not validate whether the
  authored text matches the selected language. Editor chrome follows the current UI bundle; resume
  preview labels should render from the saved/selected resume language using backend i18n bundles.
- Do not localise other database/content text in this layer until the backend supports that content
  explicitly.

## `shared/ui/` Rules

- Add a component here only when 2+ features already use it.
- Keep shared components standalone and `OnPush`, with explicit inputs/outputs and UI-local logic.
  They may inject Angular infrastructure or a domain-independent cross-cutting i18n/rendering
  service, but never a feature service, domain workflow, or application data/state service.
- Use `LocalizedDatePickerComponent` for calendar-date fields because native date-picker popovers
  cannot be themed consistently with the site. Keep values as ISO `YYYY-MM-DD`, pass all labels
  from backend i18n, and use `controlSize="small"` when the picker sits beside compact inline
  controls. Preserve its modal dialog/grid semantics, roving focus, keyboard navigation, Angular
  Forms validation, and stylesheet-owned positioning; do not replace the native dialog top layer
  with runtime inline positioning that would weaken the strict CSP.
- Use `SiteSelectComponent` for single-select controls that need the site's controlled popover
  visuals or interaction behavior that a native `<select>` cannot provide; otherwise keep the
  native control. Feature owners must build localized `readonly SiteSelectOption[]` values and
  preserve transport/query values exactly; the shared component must not inject `I18nService` or
  know feature enums. Keep its select-only combobox/listbox ARIA contract, native-like
  keyboard/typeahead commit and cancel behavior, Angular Forms/CVA integration, top-layer popover,
  and stylesheet-owned anchor positioning. Do not add runtime inline positioning, visible search,
  or a separate mobile modal.

## Feature Structure

Each feature owns its routes, models, endpoint services, pages, and feature-local components. Add
subdirectories when they clarify a real boundary; do not force empty or one-file layers merely to
match a template.

- Page components coordinate feature state, services, and loading/error/empty states.
- Presentational components receive feature data and actions through inputs/outputs and must not
  depend on feature data/state services. They may use domain-independent cross-cutting i18n or
  rendering services when passing all derived presentation through inputs would obscure the UI
  contract.
- Feature models must separate backend DTOs from UI models when their shapes differ.
- Feature services own endpoint calls and DTO-to-UI mapping; components should not depend on backend DTO shape.

## Routing

- Keep `app.routes.ts` limited to top-level route contours. It may lazy-load feature route arrays
  with `loadChildren` so adding a feature sub-route does not change the root route table.
- `/` redirects to the localized site-build case study using the initialized backend-driven UI
  language; keep shared public-home URL construction in `core/routing/`.
- Public canonical routes are language-prefixed. Keep SEO-facing public detail/content routes in the
  server-route configuration when they require SSR, and render internal wiki links with the active
  language prefix.
- Admin CSR routes such as `/admin-panel` stay unprefixed and use runtime i18n state.
- Feature route files own their sub-routes and lazy-load routed standalone pages with
  `loadComponent`. Nested route arrays may use `loadChildren` when they introduce a real sub-feature
  boundary.

## `app.config.ts`

Keep browser/app-wide providers, interceptors, initializers, hydration, title strategy, and global
error handling in `app.config.ts`; keep server-only providers in `app.config.server.ts`.

- Keep hydration transfer cache limited to safe public GETs only. Do not transfer
  analytics, uploads, file-management, or other private/side-effect endpoints.

No `AppModule`. No `NgModule` anywhere.

## `app.config.server.ts` / SSR

- Server-only providers belong in `app.config.server.ts`.
- SSR API calls must rewrite relative `/api/*` URLs through the required `SSR_API_ORIGIN`
  environment variable.
- Public origin for canonical/transfer-cache mapping must come from explicit `SSR_PUBLIC_ORIGIN` or
  required `APP_URL_SCHEMA` + `APP_DOMAIN`.
- Browser-only features such as downloads, storage-backed preferences, and content authoring
  interactions must not run during SSR.
- Browser-only access should go through injected Angular platform/document abstractions or narrowly
  scoped helpers. Do not read browser globals at module scope, and do not make public SSR routes
  depend on browser APIs being present.

## API Error Contract

- Treat `core/models/api-error.model.ts` as the canonical frontend API-error contract. Keep HTTP
  error mapping and consumers aligned with that model and the backend error response; do not copy
  the interface into instruction or feature files.

## What Not to Introduce

- NgRx or any global state library (unless proven necessary)
- Repository classes that only proxy `ApiClient`
- Abstract base components
- Facades over services
- Additional global state services unless 2+ features already need them
- Premature generic abstractions
