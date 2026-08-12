from entrypoints.litestar.api.routers import api_router


def test_privileged_domain_routes_are_available_only_below_admin_prefix() -> None:
    route_paths = {route.path for route in api_router.routes}
    admin_paths = {
        "/api/admin/tools/cache",
        "/api/admin/calendar",
        "/api/admin/files",
        "/api/admin/resumes",
        "/api/admin/knowledge/people",
        "/api/admin/knowledge/dates",
        "/api/admin/wiki-links/targets",
    }

    assert admin_paths <= route_paths
    assert all(f"/api{path.removeprefix('/api/admin')}" not in route_paths for path in admin_paths)


def test_public_api_keeps_healthcheck_and_i18n_routes() -> None:
    route_paths = {route.path for route in api_router.routes}

    assert {
        "/api/healthcheck",
        "/api/healthcheck/ready",
        "/api/i18n/languages",
        "/api/i18n/bundles/{language:str}",
    } <= route_paths
