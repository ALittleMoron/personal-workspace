# Security Threat Model

It deliberately avoids secrets, exact private host details, production IP addresses, and exploit
playbooks. Operational runbooks remain in narrower deployment documents where needed.

## Method

References:

- [OWASP Threat Modeling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Threat_Modeling_Cheat_Sheet.html)
- [OWASP Application Security Verification Standard](https://owasp.org/www-project-application-security-verification-standard/)

## Scope

In scope:

Out of scope for this version:

- A separate enterprise risk register.
- Full incident-response and disaster-recovery runbooks.
- Browser or operating-system compromise on visitor devices.
- Advanced targeted attacks against GitHub, the hosting provider, or the maintainer's hardware.

## Trust Boundaries

```text
Public browser / crawler / bot
        |
        v
nginx edge: TLS, redirects, headers, CSP, rate limits, public routing
        |
        +--> Angular frontend SSR runtime
        |
        +--> Litestar backend API
        |       |
        |       +--> PostgreSQL
        |       +--> Valkey
        |       +--> MinIO API
        |       +--> TaskIQ workers/scheduler
        |
        +--> public MinIO object endpoint

Maintainer browser over WireGuard
        |
        v
VPN-bound nginx listeners
        |
        +--> MinIO Console
        +--> Databasus

Individually certified agent over WireGuard
        |
        v
nginx mTLS :18083 --> private Compose network --> main Litestar backend
                                              --> route-scoped Agent contour
        ^
        |
local five-tool stdio MCP bridge

GitHub protected production deploy
        |
        v
Host filesystem, rendered runtime env, Compose secrets, Docker Compose stack
```

Important boundaries:

## Maintenance Triggers

Update this threat model when any of these change:
