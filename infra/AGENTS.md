# Infrastructure Instructions

These rules apply to infrastructure owned by the whole deployment under `infra/**`. Configuration
that belongs only to the backend or frontend must stay with that application; shared edge, network,
deployment, and cross-service infrastructure belongs here or in the root Docker Compose files.

## Container Security

- Do not add public service ports, `network_mode: host`, `privileged: true`, Docker socket mounts,
  broad `cap_add`, or root runtime users unless the task explicitly requires them and documents the
  security tradeoff.
- Keep backend, frontend, PostgreSQL, Valkey, MinIO, and internal panels on private networks with
  only the intended nginx or VPN-bound entrypoint exposed.
