# WireGuard internal access

The MinIO Console and Databasus panel are maintainer-only surfaces. Docker publishes them through
nginx only on `VPN_BIND_ADDRESS`:

- MinIO Console: `http://<VPN_BIND_ADDRESS>:18081`
- Databasus: `http://<VPN_BIND_ADDRESS>:18082`

PostgreSQL, Valkey, backend, frontend, MinIO API, TaskIQ, and Databasus do not publish direct host
ports. Public ingress is limited to nginx on TCP 80/443 plus the host's chosen WireGuard UDP port.

## Host setup outline

1. Install WireGuard on the host and operator device.
2. Create distinct host and peer keys; keep private keys out of the repository and deployment
   environment.
3. Assign a private subnet, for example `10.77.0.0/24`, and set the host's address on `wg0`.
4. Set `VPN_INTERFACE` to that WireGuard interface and `VPN_BIND_ADDRESS` to its exact private IPv4
   address. There is no loopback or wildcard fallback.
5. Restrict the host firewall to public 80/443, the chosen WireGuard UDP port, and established
   traffic. Do not open 18081/18082 on the public interface.
6. Start the stack and verify the two listeners with `docker ps` and host socket inspection.

Before invoking Compose, `make run` uses unprivileged `ip -json -details` inspection to require
`VPN_INTERFACE` to be a WireGuard link with its administrative `UP` flag. It rejects wildcard,
loopback, link-local, multicast, non-private, and malformed addresses, then confirms through `ip`
that the exact address is assigned to that interface. The check needs neither sudo nor
`CAP_NET_ADMIN`; a complete container-stack start still requires an active WireGuard contour.

Docker-published ports can interact with host firewall rules in platform-specific ways. Verify from
both a VPN peer and a genuinely external network: panels must work through the peer and fail from
the public network. Keep panel-native authentication enabled, revoke lost peer keys promptly, and
do not treat VPN reachability as authorization for private data.
