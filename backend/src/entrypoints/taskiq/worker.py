from dishka.integrations.taskiq import setup_dishka
from taskiq import TaskiqScheduler
from taskiq.schedule_sources import LabelScheduleSource

from entrypoints.taskiq.broker import broker
from infra.ioc.container import create_container

setup_dishka(container=create_container(), broker=broker)

scheduler = TaskiqScheduler(
    broker=broker,
    sources=[LabelScheduleSource(broker)],
)

__all__ = ["broker", "scheduler"]
