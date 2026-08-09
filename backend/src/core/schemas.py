from dataclasses import dataclass


@dataclass(kw_only=False, frozen=True, slots=True)
class Secret[T]:
    __value: T

    def get_secret_value(self) -> T:
        return self.__value

    def __str__(self) -> str:
        return "**********"

    def __repr__(self) -> str:
        return 'Secret("**********")'
