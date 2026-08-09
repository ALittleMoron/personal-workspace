# ADR 0003: Valkey-backed single-operator authentication

- Status: Accepted
- Date: 2026-08-06

## Context

The application is private but browser-accessible, so a static long-lived browser credential is not
sufficient. The solution must support server-side revocation, bounded sessions, safe renewal, and
protection for cookie-authenticated state changes without introducing account management.

## Decision

Operator login material is supplied through environment-backed secrets. The password is stored only as an Argon2id hash and verified server-side.

Successful login creates a cryptographically random opaque session in Valkey. The server issues a short-lived bearer PASETO access token and uses a `Secure`, `HttpOnly`, `SameSite` cookie only for refresh and logout under `/api/auth/*`. Refresh rotates the server-side session and credentials; logout revokes the session. Cookie-authenticated state changes require an explicit CSRF guard and Fetch Metadata validation. Login and renewal endpoints are rate-limited.

Argon2id parameters, session expiration, idle expiration, and rotation details must follow current
OWASP guidance when authentication is designed:

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)

## Consequences

- Valkey is security-critical state, not only a cache or task transport.
- Access tokens remain short-lived and are not used as refresh credentials.
- There is no registration, recovery, user profile, role claim, or account administration surface.
- Exact settings, lifetimes, rotation rules, and failure behavior are deferred to the authentication specification rather than frozen in this architecture ADR.
