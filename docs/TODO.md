# Roadmap

This roadmap contains the active backlog plus transferred completed capability history for Resume,
Calendar, and the Knowledge database. Checked history records what the product already supports;
unchecked entries remain active work unless a later product decision supersedes them.

## Resume

- [x] Resume
  - [x] Store private structured ATS-oriented resume documents outside the knowledge database.
  - [x] Store each resume as a single-language document with required saved RU/EN language.
  - [x] Add protected backend CRUD API under `/api/resumes`.
  - [x] Scope resume CRUD to the authenticated author so users only list and mutate their own resumes.
  - [x] Add workspace navigation and routes at `/resumes` and `/resumes/:id`.
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

Each knowledge item has its own subfolder in the Knowledge section of the workspace sidebar.

- [ ] Workspace
  - [ ] Main page
    - [ ] Important info (in-dashboard CRUD – only text oneline items)
    - [x] Dates and birthdays (current and next month)
    - [ ] Recently changed files
    - [ ] Statistics
      - [ ] Files per category count - badge next to folder name with amount of files.
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

## Refactoring

- [x] Remove obsolete product prefixes; the workspace has no separate management panel.
- [x] Serve the protected workspace dashboard directly at `/` and protected product APIs at
  `/api/<domain>`.
- [x] Remove the inherited how-this-site-is-built, updates, sitemap, robots, SEO, and SSR artifacts.
