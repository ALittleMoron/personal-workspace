from collections.abc import Iterable

from dishka import Provider
from dishka.integrations.litestar import LitestarProvider

from infra.ioc.providers.infrastructure import InfrastructureProvider


def get_providers() -> Iterable[Provider]:
    return (InfrastructureProvider(), LitestarProvider())
