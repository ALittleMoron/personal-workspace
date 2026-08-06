# TODOs

This is the curated roadmap for Personal Workspace. Checked capability-history entries were copied
verbatim from `my-site` and document what can be extracted; they do not override the target
single-operator architecture. Every unchecked product family receives its own just-in-time design
and implementation plan when selected.

## Migration Program

- [x] Documentation control plane
  - [x] Define the product vision, architecture, decisions, and work-package gates.
  - [x] Preserve the Knowledge, Calendar, and Resume source baselines.
  - [x] Allocate source TODOs without copying public or multi-user goals into the active backlog.
- [ ] Backend foundation
- [ ] Angular CSR foundation
- [ ] Infrastructure and delivery foundation
- [ ] Single-operator authentication
- [ ] People + shared Knowledge/tags/private files
- [ ] Dates + Calendar/Dashboard
- [ ] Resume CRUD + PDF/DOCX export
- [ ] Operational parity: security, UX, backup/restore, performance, and deployment
- [ ] Remove extracted functionality from `my-site` after parity
- [ ] Publish the first public self-hosted release

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

## Adapted Private-workspace Backlog

### Interface Localization

- [ ] Add interface locales beyond RU and EN without adding localized Knowledge fields.
- [ ] Require a complete translated export template and verification before enabling a new Resume document locale.

### Markdown Editor

- [ ] Design a single-operator editor profile for shortcuts, appearance, and behavior without a user/account model.
- [ ] Add outline navigation and source-preserving folding for headings, lists, and code blocks.
- [ ] Add sanitized callouts, footnotes, templates/snippets, math, and diagrams.
- [ ] Complete private attachment upload progress, cancellation, retry, metadata, and safe media preview.
- [ ] Convert pasted rich HTML into sanitized portable Markdown.
- [ ] Make task-list checkboxes interactive through accessible undoable editor transactions.
- [ ] Add source-preserving highlights and private author comments.
- [ ] Add theme-aware indentation guides for nested Markdown structures.

### Operations

- [ ] Enable privacy-safe slow-query timing with explicit deployment thresholds.
- [ ] Wire backend and frontend runtime failures to Sentry without private content.
- [ ] Add status visibility for uptime, backups, restore tests, service health, and production errors.
- [ ] Add PostgreSQL, nginx, host/container, Valkey, and MinIO metrics only after an observability threat model and VPN boundary are approved.
- [ ] Add actionable alerts for latency, 5xx spikes, event-loop lag, certificate expiry, backup freshness, disk pressure, and container failure.

## Superseded Non-goals

The source roadmap's public/shared Knowledge V2 and multi-user public/private V3 are preserved in
`source-baseline/todo-allocation.md` for history. They are not active tasks. Users, roles,
registration, recovery, profiles, teams, public Knowledge, SSR, and the Agent contour likewise
require a new product-level design before they may enter this backlog.
