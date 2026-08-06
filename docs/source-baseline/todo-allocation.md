# Source TODO allocation map

## Purpose and rules

This map accounts for the roadmap in `my-site/docs/TODO.md` at the 2026-08-06 extraction baseline. The allocation terms are:

- **moved** — copied into the active `personal-workspace` backlog with wording and checkbox history preserved;
- **stays** — remains a `my-site` concern and is not copied into the active backlog;
- **adapted** — remains in `my-site`, while a separately worded private-workspace task captures only an applicable target requirement;
- **superseded** — recorded as provenance but deliberately excluded from the active backlog because it contradicts the target product.

Completed source items may appear in the target TODO as historical context. Their inherited admin, author, user, or SSR language describes the source state; the accepted ADRs control the target architecture.

Every nested checkbox inherits its row's allocation unless an explicit exception is listed. This inheritance accounts for completed history and unchecked descendants individually without duplicating the entire source roadmap.

## Section allocation

| Source TODO family | Allocation | Target treatment |
| --- | --- | --- |
| Minimum Viable Product (MVP) | stays | Public-site delivery history remains in `my-site`. |
| MVP Improvements | stays | Public-site delivery history remains in `my-site`. |
| Security and infrastructure | stays / adapted | Original work remains in `my-site`; the target has separate operational-parity tasks for its smaller private attack surface and retained platform. |
| Tracing and Monitoring | stays / adapted | Original monitoring work remains in `my-site`; target monitoring outcomes are separately scoped to private data and retained services. |
| Frontend | stays | Public navigation, SSR, SEO, accessibility, and site-wide frontend work remain source concerns unless a later target spec independently adopts them. |
| Articles | stays | Public article workflows are not part of the private workspace. |
| Workspace: Operational tools | stays | Operational pages remain part of `my-site`. |
| Workspace: Resume | moved | The full subsection is copied with source wording and checkbox history. |
| Workspace: Team | stays | Public-site team management is unrelated to the single-operator target. |
| Calendar | moved | The full section is copied with source wording and checkbox history. |
| Knowledge Database core and V1 | moved | The full source history is copied with source wording and checkbox history. |
| Knowledge Database V2 and V3 | superseded | Preserved below as rejected public/multi-user evolution; absent from the active backlog. |
| Users and authentication | stays / superseded | Source tasks remain in `my-site`; registration, recovery, roles, account management, and user scoping are target non-goals. Authentication is redesigned by ADR 0003. |
| Flashcards | stays | This public-site domain is not extracted. |
| Competency Matrix Improvements | stays | This public-site domain is not extracted. |
| Competency roadmaps | stays | This public-site domain is not extracted. |
| Courses | stays | This public-site domain is not extracted. |
| Editor platform | stays / adapted | Shared editor work remains in `my-site`; target TODOs cover only editor behavior required by private Knowledge and Resume workflows. |
| Other tasks | stays / adapted | Source maintenance remains in place. Applicable target outcomes are reconsidered rather than copied mechanically. |
| Bugs | stays | Source defects remain owned by `my-site`; later target defects are recorded independently. |
| Refactoring | stays | Source refactoring remains owned by `my-site`; later target refactoring is recorded independently. |

## Superseded Knowledge items

These source items remain visible here so every original Knowledge TODO has an allocation. They are not active `personal-workspace` work:

```text
    - [ ] V2: Public knowledge items, users access to shared dashboard
    - [ ] V3: All users public and private items, per user dashboard
```

They are superseded by the single-operator, private-only product decision. Reintroducing public sharing, collaboration, user ownership, or multi-user access requires an explicit architecture redesign.

## Adapted target backlog

The target `docs/TODO.md` creates new wording instead of claiming to move these source tasks:

- UI localization for the target's RU/EN interface boundary;
- private-workspace editor safety and usability;
- security, monitoring, backup/restore, performance, deployment, and UX parity for retained services and target routes;
- removal of inherited admin, author, SSR, and Agent assumptions during each applicable work package.

## Source-side handoff

While code remains in `my-site`, its Knowledge, Calendar, production, security, and other operational documentation remains authoritative for the running source application. The source TODO receives a separate unfinished parity/cutover cleanup item. Existing repository-split TODO wording is not expanded.
