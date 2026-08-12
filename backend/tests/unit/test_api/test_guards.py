from dataclasses import dataclass
from typing import Any, cast

import pytest
from litestar.exceptions import NotAuthorizedException

from entrypoints.litestar.guards import require_verified_admin_identity
from entrypoints.litestar.identity import VerifiedAdminIdentity


@dataclass(frozen=True, slots=True, kw_only=True)
class UnverifiedIdentity:
    username: str


class FakeConnection:
    def __init__(self, *, identity: object | None) -> None:
        self.scope = {"user": identity}


class TestVerifiedAdminIdentityGuard:
    def test_allows_nonblank_verified_admin_identity(self) -> None:
        connection = FakeConnection(identity=VerifiedAdminIdentity(username="admin"))

        require_verified_admin_identity(
            cast("Any", connection),
            cast("Any", object()),
        )

    @pytest.mark.parametrize(
        "identity",
        [
            None,
            UnverifiedIdentity(username="admin"),
            VerifiedAdminIdentity(username=""),
            VerifiedAdminIdentity(username="   "),
        ],
    )
    def test_rejects_missing_unverified_or_blank_identity(self, identity: object | None) -> None:
        connection = FakeConnection(identity=identity)

        with pytest.raises(NotAuthorizedException):
            require_verified_admin_identity(
                cast("Any", connection),
                cast("Any", object()),
            )
