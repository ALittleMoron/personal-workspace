# Roadmap

This roadmap contains the active backlog plus transferred completed capability history for Resume,
Calendar, and the Knowledge database. Checked history records what the product already supports;
unchecked entries remain active work unless a later product decision supersedes them.

## Authentication

- [x] Add environment-backed single-owner authentication without account, team, role, or session
  persistence tables.
- [ ] Add server-side session storage, session management, individual revocation, and expiry tools.
- [ ] Replace the single-owner authenticator with a users table and multi-user authentication.
- [ ] Activate the retained per-user author/access model when multi-user authentication arrives.
- [ ] Add revocation for copied stateless session cookies and document/automate owner credential
  rotation; password-hash rotation alone must not imply existing cookie revocation.

## Operations and resilience

- [ ] Establish encrypted, access-controlled coordinated backups for PostgreSQL and both required
  MinIO data sets, including `knowledge-private`.
- [ ] Perform and record an isolated restore exercise that reconciles private Knowledge metadata and
  object bytes, then repeat it on a schedule.
- [ ] Add maintainer monitoring for production health, errors, backup freshness and restore status.

## Quality and performance

- [ ] Review query-plan baselines after intentional schema or query changes and keep them focused on
  retained Knowledge and Resume storage paths.
- [ ] Keep CSR Lighthouse budgets and accessibility/performance/best-practice gates meaningful as
  private login/workspace flows and bundles evolve.
- [ ] Define production slow-query monitoring and an actionable response process after a concrete
  service-level target is chosen.

## Resume

- [x] Resume
  - [x] Store private structured ATS-oriented resume documents outside the knowledge database.
  - [x] Store each resume as a single-language document with required saved RU/EN language.
  - [x] Add owner/admin backend CRUD API under `/api/admin/resumes`.
  - [x] Scope resume CRUD to the authenticated author so users only list and mutate their own resumes.
  - [x] Add owner/admin Workspace navigation and routes under `/admin-panel/workspace/resumes`.
  - [x] Add list, create with language selection, detail edit, language badge, selected-language preview, and delete UI.
  - [x] Keep resumes private: no public pages, sitemap entries, SEO, or themes in v1.
  - [x] Fix resume multilines fields: text with \\n to array.
  - [ ] Resume customization
    - [ ] Blocks order (Title, Photo, Summary, Experience, etc.)
    - [ ] Blocks visibility
    - [ ] Themes
  - [x] Resume export
    - [x] To PDF
    - [x] To DOCX
    - [x] Step-by-step maximize resume export ATS score.
    - [x] Fix readability of exported resume

- [ ] Improve resume and Knowledge editing ergonomics based on real single-administrator use, while
  preserving sanitized Markdown rendering and protected file delivery.

## Calendar

- [x] Base calendar view in dashboard.
- [ ] Add day, week, and year views alongside the dashboard calendar month view.
- [ ] Add calendar creation flows for Person birthdays, memorable Dates, and one-time or recurring Events.

## Knowledge database

Each knowledge item has its own subfolder in "knowledge database" folder on side-panel in admin panel.

- [ ] Workspace
  - [ ] Main page
    - [ ] Important info (in-dashboard CRUD – only text oneline items)
    - [x] Dates and birthdays (current and next month)
    - [ ] Recently changed files
    - [ ] Statistics
      - [ ] Files per category count - badge next to folder name with amount of files.
  - [ ] Access
    - [x] V1: Owner/admin only, per-account knowledge items (users can see only their own items)
- [ ] Knowledge item
  - [ ] Books
    - [ ] All books page
    - [ ] All read books page
    - [ ] Books to buy page
    - [ ] Books by categories page
    - [ ] Books to reread page
  - [ ] Companies
  - [x] Dates
  - [x] People
  - [ ] Places
  - [ ] Projects
  - [ ] Recipes
  - [ ] Software
  - [ ] Techchecks
  - [ ] Techniques
  - [ ] Technologies
- [ ] Export Obsidian vault to knowledge database
- [ ] Add general knowledge database import/export workflows beyond the planned Obsidian vault transfer.
- [ ] Add reminders for knowledge dates and birthdays.
- [ ] Add extended knowledge database search across item types and fields.
- [ ] Automate and test backup/restore for the private knowledge object bucket.
- [ ] Add future Knowledge item types only with typed persistence extensions, use cases and explicit
  workspace UX.

## Refactoring

- [ ] Remove all admin prefixes. There will be no separated admin panels in project.
- [ ] Remove `/admin-panel` and `/api/admin` prefixes when `/` becomes the workspace.
- [x] Remove the inherited how-this-site-is-built, updates, sitemap, robots, SEO, and SSR artifacts.
