# ADR 0005: Preserve the platform infrastructure without Agent access

- Status: Accepted
- Date: 2026-08-06

## Context

`my-site` already embodies useful self-hosting, operations, and delivery practices. Most of that foundation applies to a private workspace, while its Agent API and local MCP bridge are a separate machine-access product contour that is outside this project's purpose.

## Decision

Preserve and adapt PostgreSQL, Valkey, MinIO, TaskIQ, Databasus, nginx/TLS, WireGuard, Sentry, blue/green deployment, and CI in later work packages.

Exclude the Agent REST API, local MCP bridge, Agent-specific PKI, machine identities, scopes, audit model, routing, and certificates. No generic replacement machine interface is introduced.

## Consequences

- Infrastructure is copied selectively and reviewed against the smaller route and trust model.
- Agent configuration, certificates, services, tests, documentation, and operational procedures are not transferred.
- The infrastructure and delivery work package must prove that excluded contours have not survived through shared configuration.
- Exact deployment configuration is documented only when that package is designed.
