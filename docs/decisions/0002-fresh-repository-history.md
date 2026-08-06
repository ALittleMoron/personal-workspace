# ADR 0002: Fresh repository history and empty instance

- Status: Accepted
- Date: 2026-08-06

## Context

The new product reuses selected architectural experience and will later copy a code skeleton, but it is not a continuation of the public site's product history. Existing private records are not part of this documentation package or the planned initial deployment.

## Decision

Create a fresh repository with its own history. The documentation-control-plane commit is the initial commit. The first application release will use a clean initial database schema and empty object storage; no existing database rows, files, buckets, or migration history are transferred.

Code and infrastructure may be copied only in later work packages after their own decision-complete specifications and plans exist.

## Consequences

- The repository has no inherited commits or remote during the documentation stage.
- Historical migrations are replaced by a new initial schema.
- Source baselines record provenance without pretending that source behavior is a target requirement.
- Any future data import is a separately designed feature, not part of extraction or deployment.
