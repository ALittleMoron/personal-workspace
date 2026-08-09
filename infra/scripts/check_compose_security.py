#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any


PRODUCTION_SERVICES = {
    "backend-blue",
    "backend-green",
    "backend-init",
    "taskiq-worker-blue",
    "taskiq-worker-green",
    "taskiq-scheduler-blue",
    "taskiq-scheduler-green",
    "frontend-blue",
    "frontend-green",
    "valkey",
    "postgres",
    "minio",
    "databasus",
    "nginx",
    "certbot",
    "cert-sync",
}
HARDENED_SERVICES = PRODUCTION_SERVICES - {"certbot", "cert-sync"}
EXPLICIT_NON_ROOT_SERVICES = HARDENED_SERVICES - {"databasus"}
READ_ONLY_SERVICES = {
    "backend-blue",
    "backend-green",
    "backend-init",
    "taskiq-worker-blue",
    "taskiq-worker-green",
    "taskiq-scheduler-blue",
    "taskiq-scheduler-green",
    "frontend-blue",
    "frontend-green",
    "valkey",
    "nginx",
}
BACKEND_SERVICES = {
    "backend-blue",
    "backend-green",
    "backend-init",
    "taskiq-worker-blue",
    "taskiq-worker-green",
    "taskiq-scheduler-blue",
    "taskiq-scheduler-green",
}
BACKEND_ENVIRONMENT = {
    "APP_DEBUG",
    "APP_DOMAIN",
    "APP_URL_SCHEMA",
    "DB_DRIVER",
    "DB_EXPIRE_ON_COMMIT",
    "DB_HOST",
    "DB_LOG_QUERY_METRICS",
    "DB_MAX_OVERFLOW",
    "DB_NAME",
    "DB_PASSWORD_FILE",
    "DB_POOL_PRE_PING",
    "DB_POOL_SIZE",
    "DB_PORT",
    "DB_SLOW_QUERY_LOG_STATEMENT_MAX_LENGTH",
    "DB_SLOW_QUERY_LOG_THRESHOLD_MS",
    "DB_USER",
    "I18N_DEFAULT_LANGUAGE",
    "MINIO_ACCESS_KEY_FILE",
    "MINIO_HOST",
    "MINIO_PORT",
    "MINIO_REGION",
    "MINIO_SECRET_KEY_FILE",
    "MINIO_SECURE",
    "SENTRY_DSN_FILE",
    "SENTRY_USE",
    "TASKIQ_RESULT_EXPIRE_SECONDS",
    "VALKEY_HOST",
    "VALKEY_PORT",
}
BACKEND_SECRETS = {
    ("db_password", "db_password"),
    ("minio_access_key", "minio_access_key"),
    ("minio_secret_key", "minio_secret_key"),
    ("sentry_dsn", "sentry_dsn"),
}
EXPECTED_ENVIRONMENTS = {name: BACKEND_ENVIRONMENT for name in BACKEND_SERVICES}
EXPECTED_ENVIRONMENTS.update(
    {
        "postgres": {"POSTGRES_DB", "POSTGRES_PASSWORD_FILE", "POSTGRES_USER"},
        "nginx": {
            "ACTIVE_BACKEND_SLOT",
            "ACTIVE_FRONTEND_SLOT",
            "APP_DOMAIN",
            "NGINX_LIVENESS_FAILURE_LIMIT",
            "SSL_CERT",
            "SSL_KEY",
        },
        "cert-sync": {"APP_DOMAIN"},
    }
)
EXPECTED_SECRETS = {name: BACKEND_SECRETS for name in BACKEND_SERVICES}
EXPECTED_SECRETS.update(
    {
        "postgres": {("db_password", "db_password")},
        "minio": {
            ("minio_access_key", "minio_access_key"),
            ("minio_secret_key", "minio_secret_key"),
        },
    }
)
EXPECTED_VOLUMES = {
    "valkey": {("valkey_data", "/data", False)},
    "postgres": {("postgres_data", "/var/lib/postgresql", False)},
    "minio": {("minio_data", "/data", False)},
    "databasus": {("databasus_data", "/databasus-data", False)},
    "nginx": {
        ("nginx-certs", "/certs", True),
        ("certbot-www", "/var/www/certbot", True),
    },
    "certbot": {
        ("letsencrypt", "/etc/letsencrypt", False),
        ("certbot-www", "/var/www/certbot", False),
    },
    "cert-sync": {
        ("letsencrypt", "/etc/letsencrypt", True),
        ("nginx-certs", "/certs", False),
    },
}
SECRET_FILE_ENVIRONMENT = {
    "DB_PASSWORD_FILE": "/run/secrets/db_password",
    "MINIO_ACCESS_KEY_FILE": "/run/secrets/minio_access_key",
    "MINIO_SECRET_KEY_FILE": "/run/secrets/minio_secret_key",
    "SENTRY_DSN_FILE": "/run/secrets/sentry_dsn",
    "POSTGRES_PASSWORD_FILE": "/run/secrets/db_password",
}
EXPECTED_TOP_LEVEL_VOLUMES = {
    "certbot-www": "personal_workspace_certbot_www",
    "databasus_data": "personal_workspace_databasus_data",
    "letsencrypt": "personal_workspace_letsencrypt",
    "minio_data": "personal_workspace_minio_data",
    "nginx-certs": "personal_workspace_nginx_certs",
    "postgres_data": "personal_workspace_postgres_data",
    "valkey_data": "personal_workspace_valkey_data",
}
EXPECTED_TOP_LEVEL_SECRETS = {
    "db_password": "personal_workspace_db_password",
    "minio_access_key": "personal_workspace_minio_access_key",
    "minio_secret_key": "personal_workspace_minio_secret_key",
    "sentry_dsn": "personal_workspace_sentry_dsn",
}
EXPECTED_TOP_LEVEL_NETWORKS = {
    "app-network": {
        "name": "personal_workspace_app_network",
        "driver": "bridge",
        "ipam": {},
        "internal": True,
    },
    "edge-network": {
        "name": "personal_workspace_edge_network",
        "driver": "bridge",
        "ipam": {},
    },
    "egress-network": {
        "name": "personal_workspace_egress_network",
        "driver": "bridge",
        "ipam": {},
    },
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise ValueError(message)


def load_document(path: Path) -> dict[str, Any]:
    document = json.loads(path.read_text(encoding="utf-8"))
    require(isinstance(document, dict), "Rendered Compose document must be an object.")
    return document


def service_map(document: dict[str, Any]) -> dict[str, dict[str, Any]]:
    raw_services = document.get("services")
    require(isinstance(raw_services, dict), "Rendered Compose document has no services object.")
    require(
        all(
            isinstance(name, str) and isinstance(service, dict)
            for name, service in raw_services.items()
        ),
        "Rendered Compose services must be objects.",
    )
    return raw_services


def assert_common_service_safety(name: str, service: dict[str, Any]) -> None:
    image = service.get("image")
    require(
        isinstance(image, str) and not image.endswith(":latest"),
        f"{name} must use an explicit non-latest image reference.",
    )
    require(service.get("privileged") is not True, f"{name} must not be privileged.")
    require(service.get("network_mode") != "host", f"{name} must not use host networking.")
    require(service.get("pid") != "host", f"{name} must not use the host PID namespace.")
    require(service.get("ipc") != "host", f"{name} must not use the host IPC namespace.")
    require(not service.get("cap_add"), f"{name} must not add Linux capabilities.")
    require(not service.get("devices"), f"{name} must not mount host devices.")
    volumes = service.get("volumes", [])
    require(isinstance(volumes, list), f"{name} volumes must be a list.")
    require(
        all(isinstance(volume, dict) for volume in volumes),
        f"{name} rendered volumes must be objects.",
    )


def assert_hardened(name: str, service: dict[str, Any]) -> None:
    cap_drop = service.get("cap_drop")
    security_opt = service.get("security_opt")
    require(isinstance(cap_drop, list) and "ALL" in cap_drop, f"{name} must drop all capabilities.")
    require(
        isinstance(security_opt, list) and "no-new-privileges:true" in security_opt,
        f"{name} must enable no-new-privileges.",
    )


def assert_non_root(name: str, service: dict[str, Any]) -> None:
    user = service.get("user")
    require(isinstance(user, str) and user != "", f"{name} must declare a runtime user.")
    raw_uid = user.split(":", maxsplit=1)[0]
    require(raw_uid.isdigit() and int(raw_uid) > 0, f"{name} must declare a numeric non-root UID.")


def assert_databasus_exception(service: dict[str, Any]) -> None:
    require(
        service.get("image") == "databasus/databasus:v3.47.1",
        "The Databasus root-entrypoint exception is approved only for pinned v3.47.1.",
    )
    require(not service.get("user"), "Databasus user override would break its root entrypoint.")


def assert_exact_service_contract(name: str, service: dict[str, Any]) -> None:
    environment = service.get("environment", {})
    require(isinstance(environment, dict), f"{name} environment must be an object.")
    require(
        set(environment) == EXPECTED_ENVIRONMENTS.get(name, set()),
        f"{name} has an unexpected environment contract.",
    )
    for variable_name, expected_path in SECRET_FILE_ENVIRONMENT.items():
        if variable_name not in environment:
            continue
        require(
            environment[variable_name] == expected_path,
            f"{name}.{variable_name} must point to {expected_path}.",
        )

    secrets = service.get("secrets", [])
    require(isinstance(secrets, list), f"{name} secrets must be a list.")
    secret_bindings = set()
    for secret in secrets:
        require(isinstance(secret, dict), f"{name} rendered secret must be an object.")
        secret_bindings.add((str(secret.get("source", "")), str(secret.get("target", ""))))
    require(
        secret_bindings == EXPECTED_SECRETS.get(name, set()),
        f"{name} has an unexpected Compose secret contract.",
    )

    volumes = service.get("volumes", [])
    volume_bindings = {
        (
            str(volume.get("source", "")),
            str(volume.get("target", "")),
            bool(volume.get("read_only", False)),
        )
        for volume in volumes
    }
    require(
        all(volume.get("type") == "volume" for volume in volumes),
        f"{name} may use only named volumes; bind mounts are forbidden.",
    )
    require(
        volume_bindings == EXPECTED_VOLUMES.get(name, set()),
        f"{name} has an unexpected volume contract.",
    )


def assert_production_ports(services: dict[str, dict[str, Any]]) -> None:
    for name, service in services.items():
        ports = service.get("ports", [])
        require(isinstance(ports, list), f"{name} ports must be a list.")
        if name not in {"nginx", "certbot"}:
            require(
                not ports,
                f"Only nginx and certbot may publish production ports; found {name}.",
            )
            continue
        for port in ports:
            require(isinstance(port, dict), f"{name} rendered port must be an object.")
            target = port.get("target")
            published = str(port.get("published"))
            if name == "certbot":
                require(target == 80 and published == "80", "Certbot may publish only port 80.")
            elif target in {18081, 18082}:
                host_ip = port.get("host_ip")
                require(
                    isinstance(host_ip, str) and host_ip not in {"", "0.0.0.0", "::"},
                    f"nginx panel port {target} must bind to an explicit private host address.",
                )
                require(
                    published == str(target),
                    f"nginx panel port {target} must retain its number.",
                )
            else:
                require(
                    (target, published) in {(8080, "80"), (8443, "443")},
                    f"Unexpected nginx published port: {published}:{target}.",
                )
                require(
                    port.get("host_ip") in {None, "", "0.0.0.0", "::"},
                    f"nginx public port {published} must not bind to a private "
                    "or loopback address.",
                )


def assert_top_level_storage(
    document: dict[str, Any],
    expected_secret_files: dict[str, Path],
) -> None:
    volumes = document.get("volumes")
    require(isinstance(volumes, dict), "Rendered Compose document has no volumes object.")
    require(set(volumes) == set(EXPECTED_TOP_LEVEL_VOLUMES), "Volume inventory changed.")
    for volume_name, expected_name in EXPECTED_TOP_LEVEL_VOLUMES.items():
        volume = volumes[volume_name]
        require(isinstance(volume, dict), f"Volume {volume_name} must be an object.")
        require(
            volume == {"name": expected_name},
            f"Volume {volume_name} must remain a project-owned named volume.",
        )

    secrets = document.get("secrets")
    require(isinstance(secrets, dict), "Rendered Compose document has no secrets object.")
    require(set(secrets) == set(EXPECTED_TOP_LEVEL_SECRETS), "Secret inventory changed.")
    for secret_name, expected_name in EXPECTED_TOP_LEVEL_SECRETS.items():
        secret = secrets[secret_name]
        require(isinstance(secret, dict), f"Secret {secret_name} must be an object.")
        require(
            set(secret) == {"name", "file"} and secret.get("name") == expected_name,
            f"Secret {secret_name} must remain a file-backed project secret.",
        )
        secret_file = secret.get("file")
        require(
            isinstance(secret_file, str)
            and secret_file == str(expected_secret_files[secret_name]),
            f"Secret {secret_name} must use its prepared source file.",
        )


def check_production(
    document: dict[str, Any],
    expected_secret_files: dict[str, Path],
) -> None:
    services = service_map(document)
    require(set(services) == PRODUCTION_SERVICES, "Production Compose service inventory changed.")
    for name, service in services.items():
        assert_common_service_safety(name, service)
        assert_exact_service_contract(name, service)
        if name in HARDENED_SERVICES:
            assert_hardened(name, service)
        if name in EXPLICIT_NON_ROOT_SERVICES:
            assert_non_root(name, service)
        if name in READ_ONLY_SERVICES:
            require(
                service.get("read_only") is True,
                f"{name} must use a read-only root filesystem.",
            )
    assert_databasus_exception(services["databasus"])
    assert_top_level_storage(document, expected_secret_files)

    networks = document.get("networks")
    require(isinstance(networks, dict), "Rendered Compose document has no networks object.")
    require(
        networks == EXPECTED_TOP_LEVEL_NETWORKS,
        "Production Compose top-level network contract changed.",
    )
    app_network = networks.get("app-network")
    require(isinstance(app_network, dict), "Rendered Compose document has no app-network.")
    require(app_network.get("internal") is True, "app-network must remain internal.")
    expected_networks = {
        "backend-blue": {"app-network", "egress-network"},
        "backend-green": {"app-network", "egress-network"},
        "backend-init": {"app-network", "egress-network"},
        "taskiq-worker-blue": {"app-network", "egress-network"},
        "taskiq-worker-green": {"app-network", "egress-network"},
        "taskiq-scheduler-blue": {"app-network", "egress-network"},
        "taskiq-scheduler-green": {"app-network", "egress-network"},
        "frontend-blue": {"app-network"},
        "frontend-green": {"app-network"},
        "valkey": {"app-network"},
        "postgres": {"app-network"},
        "minio": {"app-network"},
        "databasus": {"app-network", "egress-network"},
        "nginx": {"app-network", "edge-network"},
        "certbot": {"edge-network"},
        "cert-sync": set(),
    }
    for name, service in services.items():
        service_networks = service.get("networks", {})
        require(isinstance(service_networks, dict), f"{name} networks must be an object.")
        require(
            set(service_networks) == expected_networks[name],
            f"{name} has an unexpected network topology.",
        )
    require(services["cert-sync"].get("network_mode") == "none", "cert-sync must have no network.")
    assert_production_ports(services)


def check_test(document: dict[str, Any]) -> None:
    services = service_map(document)
    require(set(services) == {"postgres-test"}, "Test Compose must contain only postgres-test.")
    service = services["postgres-test"]
    assert_common_service_safety("postgres-test", service)
    assert_hardened("postgres-test", service)
    assert_non_root("postgres-test", service)
    environment = service.get("environment")
    require(
        isinstance(environment, dict)
        and set(environment) == {"POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB"},
        "postgres-test has an unexpected environment contract.",
    )
    require(not service.get("secrets"), "postgres-test must not mount Compose secrets.")
    require(not service.get("volumes"), "postgres-test must not mount persistent or bind volumes.")
    require(not document.get("secrets"), "Test Compose must not define top-level secrets.")
    require(not document.get("volumes"), "Test Compose must not define top-level volumes.")
    require(
        document.get("networks")
        == {"default": {"name": "personal_workspace_test_default", "ipam": {}}},
        "Test Compose network contract changed.",
    )
    require("container_name" not in service, "postgres-test must not use a fixed container name.")
    ports = service.get("ports")
    require(isinstance(ports, list) and len(ports) == 1, "postgres-test must publish one port.")
    port = ports[0]
    require(isinstance(port, dict), "postgres-test rendered port must be an object.")
    require(port.get("target") == 5432, "postgres-test may publish only PostgreSQL port 5432.")
    require(port.get("host_ip") == "127.0.0.1", "postgres-test must bind only to loopback.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate rendered Compose security invariants.")
    parser.add_argument("--compose-json", required=True, type=Path)
    parser.add_argument("--mode", required=True, choices=("production", "test"))
    parser.add_argument("--db-password-file", type=Path)
    parser.add_argument("--minio-access-key-file", type=Path)
    parser.add_argument("--minio-secret-key-file", type=Path)
    parser.add_argument("--sentry-dsn-file", type=Path)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        document = load_document(args.compose_json)
        if args.mode == "production":
            expected_secret_files = {
                "db_password": args.db_password_file,
                "minio_access_key": args.minio_access_key_file,
                "minio_secret_key": args.minio_secret_key_file,
                "sentry_dsn": args.sentry_dsn_file,
            }
            require(
                all(
                    isinstance(path, Path) and path.is_absolute()
                    for path in expected_secret_files.values()
                ),
                "Production secret file arguments must be absolute paths.",
            )
            check_production(document, expected_secret_files)
        else:
            check_test(document)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"check_compose_security.py: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
