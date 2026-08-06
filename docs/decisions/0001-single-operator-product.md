# ADR 0001: Single-operator product

- Status: Accepted
- Date: 2026-08-06

## Context

`personal-workspace` extracts private Knowledge, Calendar, and Resume workflows from a public site. The extracted product is operated by one person and does not need the identity and authorization model of `my-site`.

## Decision

The product has exactly one operator. It will not introduce users, accounts, roles, registration, account recovery, teams, memberships, ownership transfer, or author scoping.

Authentication proves that the current client is the operator. Domain records do not carry an author or tenant identifier. Any future multi-user capability requires a new architecture decision and a deliberate data-model redesign.

## Consequences

- Private routes can use one operator authorization policy.
- Queries, indexes, DTOs, and UI controls do not preserve inherited author or role concepts.
- `my-site` multi-user contracts are source evidence, not defaults for the new product.
- Collaboration and public sharing are non-goals until explicitly redesigned.
