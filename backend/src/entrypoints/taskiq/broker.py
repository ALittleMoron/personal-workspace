from taskiq_redis import RedisAsyncResultBackend, RedisStreamBroker

from infra.config.constants import constants
from infra.config.settings import settings

broker_url = (
    settings.valkey.get_url(
        database=constants.valkey_databases.taskiq_broker,
    )
    .get_secret_value()
    .replace("valkey://", "redis://", 1)
)
result_url = (
    settings.valkey.get_url(
        database=constants.valkey_databases.taskiq_results,
    )
    .get_secret_value()
    .replace("valkey://", "redis://", 1)
)

broker = RedisStreamBroker(
    url=broker_url,
    queue_name=constants.taskiq.queue_name,
    consumer_group_name=constants.taskiq.consumer_group_name,
).with_result_backend(
    RedisAsyncResultBackend(
        redis_url=result_url,
        keep_results=True,
        result_ex_time=settings.taskiq.result_expire_seconds,
        prefix_str=constants.taskiq.result_prefix,
    ),
)
