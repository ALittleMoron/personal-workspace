# Personal Workspace Documentation

`personal-workspace` is a planned self-hosted, open-source, single-operator workspace for private
knowledge, people, dates, files, calendars, and resumes.

This repository is intentionally documentation-only. No application code, deployment
configuration, dependency manifest, asset, database, or user data belongs here until the matching
just-in-time design and implementation plan has been approved.

## Canonical Documents

- [Product vision](product-vision.md) defines the audience, scope, non-goals, and success criteria.
- [Target architecture](target-architecture.md) records the contracts future implementations must
  preserve.
- [Migration program](migration-program.md) defines the ordered work packages and their gates.
- [TODO](TODO.md) is the curated product and migration backlog.
- [Decisions](decisions/) contains accepted architecture decisions.
- [AGPL-3.0 license](LICENSE.md) applies to this documentation repository. A canonical root
  `LICENSE` will be added before application code enters the repository.

## Historical Inputs

The documents under [source-baseline](source-baseline/) describe the implementation being
extracted from `my-site`. They are evidence, not target contracts. In particular, references to
administrators, authors, `/admin` routes, Angular SSR, or the Agent contour do not override the
[target architecture](target-architecture.md).

## Delivery Workflow

Every work package follows the same sequence:

1. Inspect the current source and target repositories without mutation.
2. Write and approve one focused design under `docs/superpowers/specs/`.
3. Write one decision-complete implementation plan under `docs/superpowers/plans/`.
4. Execute the plan in a separate session with `superpowers:executing-plans`.
5. Run package-specific verification and review before starting the next package.

The repository contains only the documentation-control-plane plan today. Future plans are created
just in time so their paths, interfaces, commands, and acceptance evidence match the repository
that actually exists.
