# ADR 0004: Angular CSR and private route contours

- Status: Accepted
- Date: 2026-08-06

## Context

The application is an authenticated private workspace. Search indexing, public content rendering,
and server-side rendering are not product requirements.

## Decision

Use Angular as a client-side-rendered application only. The UI route contract is:

- `/login`
- `/dashboard`
- `/knowledge/*`
- `/resumes/*`

The API route contract is:

- `/api/auth/*`
- `/api/knowledge/*`
- `/api/resumes/*`
- `/api/calendar`

`/login` is the only anonymous application route. All workspace UI routes and all non-login API behavior require the operator session. There is no `/admin` or `/api/admin/*` contour.

## Consequences

- Angular SSR and public SEO machinery are excluded from the Personal Workspace frontend.
- Workspace components use ordinary product routes and language rather than an administrative
  contour.
- Nginx serves static CSR assets with history fallback and proxies only the documented API contours.
- Authorization remains enforced by the backend even though the entire workspace UI is protected.
