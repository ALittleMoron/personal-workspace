# ADR 0005: Preserve the platform infrastructure without Agent access

- Status: Accepted
- Date: 2026-08-06

## Context

The private workspace needs a complete self-hosting, operations, and delivery foundation. A
machine-access Agent API or local MCP bridge would create a separate trust boundary outside the
product's purpose.

## Decision

Operate PostgreSQL, Valkey, MinIO, TaskIQ, Databasus, nginx/TLS, WireGuard, Sentry, blue/green
deployment, and CI as the platform foundation.

Exclude the Agent REST API, local MCP bridge, Agent-specific PKI, machine identities, scopes, audit model, routing, and certificates. No generic replacement machine interface is introduced.

## Consequences

- Infrastructure is reviewed against the private route and trust model.
- Agent configuration, certificates, services, tests, documentation, and operational procedures
  remain excluded.
- New machine-access capabilities require a dedicated architecture and threat-model decision.
- Deployment configuration is documented alongside the implemented infrastructure.
