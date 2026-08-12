# WireGuard internal access

WireGuard provides host-level access to maintainer-only web panels without publishing them on public
HTTPS subdomains. The current panels are MinIO Console and Databasus.

## Runtime contract

Public ingress is `80/tcp`, `443/tcp` and one chosen WireGuard UDP port. nginx binds the panels to
`VPN_BIND_ADDRESS` only:

- MinIO Console: `http://<VPN_BIND_ADDRESS>:18081`
- Databasus: `http://<VPN_BIND_ADDRESS>:18082`

For production, `VPN_BIND_ADDRESS` is the server address on `wg0`; `.env.example` uses
`127.0.0.1` so local development remains safe without WireGuard. No application service publishes a
Docker port directly.

## Host setup

Install WireGuard and generate keys outside the repository:

```bash
sudo apt update
sudo apt install wireguard
umask 077
wg genkey | tee server.private | wg pubkey > server.public
wg genkey | tee maintainer-laptop.private | wg pubkey > maintainer-laptop.public
```

Create `/etc/wireguard/wg0.conf` on the server, adapting addresses and port:

```ini
[Interface]
Address = 10.77.0.1/24
ListenPort = 51820
PrivateKey = <server private key>
SaveConfig = false

[Peer]
PublicKey = <maintainer laptop public key>
AllowedIPs = 10.77.0.2/32
```

Protect and enable it:

```bash
sudo chown root:root /etc/wireguard/wg0.conf
sudo chmod 600 /etc/wireguard/wg0.conf
sudo systemctl enable --now wg-quick@wg0
sudo wg show
```

On the maintainer device, use a peer configuration whose `AllowedIPs` includes only the server VPN
address. Do not route the full internet connection, Docker subnet, PostgreSQL or Valkey through this
VPN unless a separately reviewed network design requires it.

## Firewall and deployment

Keep a rule for the chosen SSH access path before enabling a restrictive firewall. For UFW, adapt
the addresses and port:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from <trusted admin IP> to any port 22 proto tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 51820/udp
sudo ufw allow in on wg0 to 10.77.0.1 port 18081 proto tcp
sudo ufw allow in on wg0 to 10.77.0.1 port 18082 proto tcp
sudo ufw enable
sudo ufw status verbose
```

Set the GitHub `production` Environment variable `VPN_BIND_ADDRESS` to the server `wg0` address.
After deployment inspect bindings:

```bash
docker compose ps nginx
sudo ss -lntp | grep -E ':(80|443|18081|18082)\b'
```

`80` and `443` should be public; `18081` and `18082` must bind only to the VPN address. Because
Docker installs host NAT/firewall rules, test from a network that is not on WireGuard. If a panel is
reachable publicly, add explicit public-interface drops before Docker's accept path (for example
through host-managed UFW or `DOCKER-USER` policy) and re-test.

## Revocation and acceptance checks

To revoke a device, remove its peer from `/etc/wireguard/wg0.conf`, remove it from the live
interface, then verify it cannot reach either panel:

```bash
sudo wg set wg0 peer <revoked peer public key> remove
sudo wg show
```

From a public network without WireGuard, both must fail to connect:

```bash
curl --connect-timeout 3 http://<server public IP>:18081
curl --connect-timeout 3 http://<server public IP>:18082
```

From a connected maintainer device, the corresponding VPN-address requests should reach the panel
login surfaces. Panel authentication remains necessary; WireGuard is network access control, not an
application identity substitute.

## References

- [WireGuard Quick Start](https://www.wireguard.com/quickstart/)
- [Docker port publishing](https://docs.docker.com/engine/network/port-publishing/)
- [UFW documentation](https://help.ubuntu.com/community/UFW)
