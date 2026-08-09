# ADR 0001: Single-operator product

- Status: Accepted
- Date: 2026-08-06

## Context

Personal Workspace is a private self-hosted application operated by one person. Hosted multi-user
identity, collaboration, and authorization models are outside its product boundary.

## Decision

The product has exactly one operator. It will not introduce users, accounts, roles, registration, account recovery, teams, memberships, ownership transfer, or author scoping.

Authentication proves that the current client is the operator. Domain records do not carry an author or tenant identifier. Any future multi-user capability requires a new architecture decision and a deliberate data-model redesign.

## Consequences

- Private routes can use one operator authorization policy.
- Queries, indexes, DTOs, and UI controls do not preserve inherited author or role concepts.
- Multi-user contracts are not implicit extension points for the product.
- Collaboration and public sharing are non-goals until explicitly redesigned.
