from dishka import AsyncContainer, make_async_container

from infra.ioc.registry import get_providers


def create_container() -> AsyncContainer:
    return make_async_container(*get_providers())
