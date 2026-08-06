# Personal Workspace Documentation Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Execute in one isolated session; subagents are not assumed.

**Goal:** Create the fresh docs-only `personal-workspace` repository and leave an auditable documentation handoff in `my-site` without transferring application artifacts.

**Architecture:** Build the complete repository in a unique temporary directory, verify its closed `docs/**` boundary, initialize and commit it there, then move the finished repository to the absent sibling target path. Treat copied Knowledge and Calendar documents plus the Resume description and TODO allocation as source evidence; accepted ADRs and the extraction design are authoritative for future implementation.

**Tech Stack:** Markdown, Git, POSIX shell checks, `rg`, `cmp`, and the canonical AGPL-3.0 text.

## Global Constraints

- Target path: `/Users/d.lunev/code/repositories/personal-workspace`.
- Initial branch: `main`; one initial commit; no remote.
- Every tracked path must begin with `docs/`.
- Canonical documentation is English.
- Do not copy code, configuration, dependency manifests, lock files, assets, databases, secrets, or user data.
- Preserve unrelated `my-site` changes and leave this package's `my-site` documentation edits unstaged and uncommitted.
- Do not change infrastructure, CI/CD, or any current `AGENTS.md` file.
- Do not create plans for later packages until each package has an approved JIT specification.
- Skip code tests and Make checks because this package changes documentation only and the new repository has no Make targets.

---

## File map

### New repository

- `docs/README.md` — documentation index, stage boundary, and workflow.
- `docs/product-vision.md` — audience, value, scope, non-goals, and success criteria.
- `docs/target-architecture.md` — target system, routes, trust boundary, data policy, and platform components.
- `docs/migration-program.md` — ordered work packages, gates, and JIT planning rules.
- `docs/TODO.md` — curated active backlog plus transferred checkbox history.
- `docs/LICENSE.md` — unchanged AGPL-3.0 license text.
- `docs/decisions/0001-single-operator-product.md` — single-operator ADR.
- `docs/decisions/0002-fresh-repository-history.md` — fresh history and empty-instance ADR.
- `docs/decisions/0003-valkey-backed-authentication.md` — authentication ADR.
- `docs/decisions/0004-private-csr-and-routing.md` — CSR and route ADR.
- `docs/decisions/0005-platform-infrastructure-without-agent.md` — retained/excluded infrastructure ADR.
- `docs/decisions/0006-localization-boundary.md` — UI/content/document locale ADR.
- `docs/decisions/0007-license.md` — AGPL-3.0 ADR.
- `docs/source-baseline/knowledge-database.md` — verbatim source Knowledge documentation.
- `docs/source-baseline/calendar.md` — verbatim source Calendar documentation.
- `docs/source-baseline/resume.md` — curated source Resume implementation baseline.
- `docs/source-baseline/todo-allocation.md` — allocation of all source TODO families.
- `docs/superpowers/specs/2026-08-06-personal-workspace-extraction-design.md` — approved extraction design.
- `docs/superpowers/plans/2026-08-06-documentation-control-plane.md` — this executable plan.

### Source repository

- `.github/README.md` — remove private Knowledge/Resume from English public positioning.
- `.github/README_RU.md` — remove private Knowledge/Resume from Russian public positioning.
- `docs/TODO.md` — remove moved active subsections and add a separate parity/cutover cleanup item.

---

### Task 1: Capture and protect source baselines

**Files:**
- Read: `/Users/d.lunev/code/repositories/my-site/docs/TODO.md`
- Read: `/Users/d.lunev/code/repositories/my-site/docs/knowledge-database.md`
- Read: `/Users/d.lunev/code/repositories/my-site/docs/calendar.md`
- Read: `/Users/d.lunev/code/repositories/my-site/.github/README.md`
- Read: `/Users/d.lunev/code/repositories/my-site/.github/README_RU.md`

**Interfaces:**
- Consumes: current `my-site` working tree and its repository instructions.
- Produces: exact source text and a verified clean baseline for the three source files this package will edit.

- [x] **Step 1: Confirm the target does not already exist**

Run:

```bash
test ! -e /Users/d.lunev/code/repositories/personal-workspace
```

Expected: exit status 0. Stop rather than merge with or overwrite an existing path.

- [x] **Step 2: Record current source status without changing it**

Run:

```bash
git -C /Users/d.lunev/code/repositories/my-site status --short
git -C /Users/d.lunev/code/repositories/my-site diff -- docs/TODO.md .github/README.md .github/README_RU.md
```

Expected: unrelated changes may be present; the second command is empty before this package's edits. If one of the three files already differs, stop and reconcile ownership before editing it.

- [x] **Step 3: Capture the exact TODO source block**

Run:

```bash
sed -n '403,477p' /Users/d.lunev/code/repositories/my-site/docs/TODO.md
```

Expected: output contains the Resume subsection, Calendar section, and Knowledge Database section including their original checkbox states and Knowledge V2/V3.

- [x] **Step 4: Create an isolated temporary staging directory**

Run:

```bash
mktemp -d /private/tmp/personal-workspace-stage.XXXXXX
```

Expected for this execution: `/private/tmp/personal-workspace-stage.h4aGtv`. Use that exact path for all new-repository steps.

### Task 2: Build the canonical documentation set

**Files:**
- Create: every new-repository path listed in the file map.

**Interfaces:**
- Consumes: the approved extraction design, source TODO block, Knowledge and Calendar documents, Resume implementation evidence, OWASP guidance links, GNU license choice, and the unique staging path from Task 1.
- Produces: a self-contained English documentation control plane whose accepted ADRs override inherited source terminology.

- [x] **Step 1: Create only documentation directories**

Run from the staging directory:

```bash
mkdir -p docs/decisions docs/source-baseline docs/superpowers/specs docs/superpowers/plans
```

Expected: the only top-level entry is `docs/`.

- [x] **Step 2: Add the canonical product and architecture documents**

Create `docs/README.md`, `docs/product-vision.md`, and `docs/target-architecture.md` with the exact product boundaries and route/authentication/localization/platform/data contracts from the approved design.

Expected: the documents say single operator, Angular CSR, no admin contour, no Agent contour, an empty initial instance, UI-only RU/EN localization, language-neutral Knowledge content, and RU/EN Resume document locale.

- [x] **Step 3: Add migration governance and curated backlog**

Create `docs/migration-program.md` with all eleven ordered work packages and create `docs/TODO.md` with the complete Resume, Calendar, and Knowledge core/V1 source history preserving wording and checkboxes. Exclude Knowledge V2/V3 from the active backlog. Add independently worded private-workspace editor, localization, and operational-parity tasks.

Expected: future package plans are described as JIT deliverables, not created as empty files.

- [x] **Step 4: Add the seven accepted ADRs**

Create ADRs 0001 through 0007 for single-operator scope, fresh history/empty instance, Valkey-backed authentication, CSR/routes, retained infrastructure without Agent, localization boundary, and AGPL-3.0.

Expected: every ADR has `Status: Accepted`, `Date: 2026-08-06`, context, decision, and consequences; no ADR contradicts the approved route or product boundary.

- [x] **Step 5: Preserve the source baselines and allocation**

Copy `docs/knowledge-database.md` and `docs/calendar.md` byte-for-byte into `docs/source-baseline/`. Create `resume.md` from inspected source models, endpoints, schemas, exporters, Angular models, service routes, and editor behavior. Create `todo-allocation.md` accounting for every source roadmap family as `moved`, `stays`, `adapted`, or `superseded`.

Expected: source baselines clearly state that inherited admin, author, user, SSR, and route language is evidence rather than a target contract.

- [x] **Step 6: Add the exact license and superpowers documents**

Fetch the canonical AGPL-3.0 text from SPDX's official license-list-data repository and preserve it unchanged as `docs/LICENSE.md`. Create the approved extraction spec and this decision-complete documentation-control-plane plan.

Run:

```bash
curl -fL https://raw.githubusercontent.com/spdx/license-list-data/main/text/AGPL-3.0-only.txt -o /private/tmp/personal-workspace-agpl-3.0.txt
cmp /private/tmp/personal-workspace-agpl-3.0.txt docs/LICENSE.md
```

Expected: `cmp` exits 0. No later-package plan exists.

### Task 3: Apply the source documentation handoff

**Files:**
- Modify: `/Users/d.lunev/code/repositories/my-site/docs/TODO.md`
- Modify: `/Users/d.lunev/code/repositories/my-site/.github/README.md`
- Modify: `/Users/d.lunev/code/repositories/my-site/.github/README_RU.md`

**Interfaces:**
- Consumes: exact baseline captured in Task 1 and the moved/superseded allocation in Task 2.
- Produces: public positioning without private Knowledge/Resume claims and a source roadmap that keeps only source-owned active work plus a separate deferred cleanup item.

- [x] **Step 1: Remove only the moved source backlog blocks**

From `my-site/docs/TODO.md`, remove the Resume subsection under Workspace and the complete Calendar and Knowledge Database sections. Preserve Workspace Operational tools, Workspace Team, and every unrelated item unchanged.

Expected: the exact transferred Resume/Calendar/Knowledge text remains available in the new repository's curated TODO, and Knowledge V2/V3 remain accounted for in the allocation map as superseded.

- [x] **Step 2: Add a separate cutover task**

Add this unfinished item under `### Other tasks` without changing the existing repository-split item:

```markdown
- [ ] Remove private Knowledge, Calendar, and Resume from `my-site` after `personal-workspace` passes its documented parity gate.
```

Expected: cleanup is not implied before parity and is not folded into an existing TODO's scope.

- [x] **Step 3: Narrow public README positioning in both languages**

In `.github/README.md` and `.github/README_RU.md`, remove the private Knowledge documentation link and private Knowledge/Resume feature claims. Retain accurate public-site, protected content-panel, authentication, operations, and Agent descriptions that still belong to `my-site`.

Expected: neither README advertises private Knowledge or Resume as part of the public site's product positioning.

- [x] **Step 4: Keep runtime and security documentation in place**

Run:

```bash
test -f docs/knowledge-database.md
test -f docs/calendar.md
find docs -maxdepth 1 -type f \( -iname '*production*' -o -iname '*security*' \) -print
```

Expected: Knowledge and Calendar documents still exist in `my-site`; production/security documentation is not removed or copied by this package.

### Task 4: Verify both repositories independently

**Files:**
- Verify: all staged new-repository documentation.
- Verify: the three modified `my-site` documentation files.

**Interfaces:**
- Consumes: Tasks 1–3 outputs.
- Produces: evidence that content, scope, links, terminology, provenance, and Git boundaries satisfy the design before any commit.

- [x] **Step 1: Verify the new repository's closed file boundary**

Run from the staging directory before Git initialization:

```bash
find . -mindepth 1 -maxdepth 1 ! -name docs -print
find docs -type f -print | sort
```

Expected: the first command has no output; the second lists only the documented Markdown files. No source, config, manifest, lock, asset, database, secret, or user-data file appears.

- [x] **Step 2: Verify source document and license identity**

Run:

```bash
cmp /Users/d.lunev/code/repositories/my-site/docs/knowledge-database.md docs/source-baseline/knowledge-database.md
cmp /Users/d.lunev/code/repositories/my-site/docs/calendar.md docs/source-baseline/calendar.md
cmp /private/tmp/personal-workspace-agpl-3.0.txt docs/LICENSE.md
```

Expected: all three comparisons exit 0.

- [x] **Step 3: Verify TODO wording and checkbox history**

Compare the transferred Resume, Calendar, and Knowledge core/V1 lines with the Task 1 baseline. Confirm every source checkbox has the same `[ ]` or `[x]` state in the target. Confirm the V2/V3 text appears verbatim under `docs/source-baseline/todo-allocation.md` and does not appear in the active `docs/TODO.md` backlog.

Expected: no moved text or status changed, and all source items have an explicit allocation.

- [x] **Step 4: Check links, headings, placeholders, and contradictions**

Run from the staging directory:

```bash
rg -n 'T''BD|FIX''ME|implement la''ter|fill in det''ails|Similar to Ta''sk' docs
rg -n '/api/admin|/admin-panel|Angular SSR|multi-user|registration|author scoping|Agent API|MCP' docs --glob '!source-baseline/**'
```

Expected: the placeholder scan has no findings. Every terminology-scan finding is an explicit exclusion, source-history explanation, cleanup instruction, or contradiction check—not a target requirement. Manually follow every relative Markdown link and confirm linked local paths exist.

- [x] **Step 5: Review the `my-site` diff without staging it**

Run:

```bash
git -C /Users/d.lunev/code/repositories/my-site diff --check -- docs/TODO.md .github/README.md .github/README_RU.md
git -C /Users/d.lunev/code/repositories/my-site diff -- docs/TODO.md .github/README.md .github/README_RU.md
git -C /Users/d.lunev/code/repositories/my-site diff --cached -- docs/TODO.md .github/README.md .github/README_RU.md
```

Expected: the first command succeeds, the second contains only the agreed handoff/positioning edits, and the cached diff is empty.

- [x] **Step 6: Perform the required consistency review**

Search related terms in `my-site/docs/`, `.github/`, root README-style files, and nested `AGENTS.md` files. Confirm infrastructure, CI/CD, and current instructions need no change in this docs-only package. Confirm the public timeline and RU/EN case-study cleanup is explicitly deferred to package 10 and no new transfer milestone is planned.

Expected: no additional current-file edits are needed. Do not run code tests or Make checks for this documentation-only package.

### Task 5: Create and install the fresh repository

**Files:**
- Track: every file under the staging directory's `docs/`.
- Create through Git: staging directory `.git/` metadata.
- Move: complete staging directory to `/Users/d.lunev/code/repositories/personal-workspace`.

**Interfaces:**
- Consumes: verified documentation from Task 4 and an absent target path.
- Produces: a fresh local `main` repository with one initial documentation commit, no remote, and a clean worktree.

- [x] **Step 1: Initialize Git on `main` and stage only documentation**

Run from the staging directory:

```bash
git init -b main
git add docs
```

Expected: Git initializes successfully and `git diff --cached --name-only` lists only paths beginning with `docs/`.

- [x] **Step 2: Re-run the tracked-path and content checks**

Run:

```bash
test -z "$(git diff --cached --name-only | awk '$0 !~ /^docs\// { print }')"
git diff --cached --check
git status --short
```

Expected: the boundary check and diff check succeed; status contains only added `docs/**` files.

- [x] **Step 3: Create the initial commit**

Run:

```bash
git commit -m "docs: define personal workspace migration"
```

Expected: one root commit is created on `main`.

- [x] **Step 4: Move the finished repository into place**

After confirming the target is still absent, move the exact staging directory:

```bash
test ! -e /Users/d.lunev/code/repositories/personal-workspace
mv /private/tmp/personal-workspace-stage.h4aGtv /Users/d.lunev/code/repositories/personal-workspace
```

Do not overwrite an existing path.

Expected: the source staging path is absent and the complete repository exists at the target path.

- [x] **Step 5: Verify final repository state**

Run:

```bash
git -C /Users/d.lunev/code/repositories/personal-workspace branch --show-current
git -C /Users/d.lunev/code/repositories/personal-workspace rev-list --count HEAD
git -C /Users/d.lunev/code/repositories/personal-workspace status --short
git -C /Users/d.lunev/code/repositories/personal-workspace remote -v
git -C /Users/d.lunev/code/repositories/personal-workspace ls-files
```

Expected: branch is `main`; commit count is `1`; status and remote output are empty; every listed path begins with `docs/`.

- [x] **Step 6: Leave source edits uncommitted and unstaged**

Run:

```bash
git -C /Users/d.lunev/code/repositories/my-site status --short -- docs/TODO.md .github/README.md .github/README_RU.md
git -C /Users/d.lunev/code/repositories/my-site diff --cached -- docs/TODO.md .github/README.md .github/README_RU.md
```

Expected: the three source files are modified in the working tree and the cached diff is empty.
