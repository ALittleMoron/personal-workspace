from litestar.connection import ASGIConnection
from litestar.exceptions import NotAuthorizedException
from litestar.handlers.base import BaseRouteHandler

from entrypoints.litestar.identity import VerifiedAdminIdentity


def require_verified_admin_identity(
    connection: ASGIConnection,
    _route_handler: BaseRouteHandler,
) -> None:
    identity = connection.scope.get("user")
    if not isinstance(identity, VerifiedAdminIdentity) or not identity.username.strip():
        raise NotAuthorizedException
