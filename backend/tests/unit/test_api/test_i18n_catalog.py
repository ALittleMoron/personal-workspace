from core.i18n.enums import LanguageEnum
from entrypoints.litestar.api.i18n.catalog import LANGUAGE_LABELS, MESSAGES


def test_catalogs_have_matching_keys() -> None:
    message_key_sets = {frozenset(messages) for messages in MESSAGES.values()}

    assert len(message_key_sets) == 1
    assert set(LANGUAGE_LABELS) == set(MESSAGES)


def test_catalogs_include_theme_control_messages() -> None:
    assert MESSAGES[LanguageEnum.RU]["theme.toggle"] == "Сменить тему"
    assert MESSAGES[LanguageEnum.RU]["theme.light"] == "Светлая тема"
    assert MESSAGES[LanguageEnum.RU]["theme.dark"] == "Тёмная тема"
    assert MESSAGES[LanguageEnum.EN]["theme.toggle"] == "Toggle theme"
    assert MESSAGES[LanguageEnum.EN]["theme.light"] == "Light theme"
    assert MESSAGES[LanguageEnum.EN]["theme.dark"] == "Dark theme"
