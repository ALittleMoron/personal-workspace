from collections.abc import Mapping

from core.i18n.enums import LanguageEnum

LanguageMessages = Mapping[str, str]

MESSAGES: Mapping[LanguageEnum, LanguageMessages] = {
    LanguageEnum.RU: {
        "app.name": "Персональное рабочее пространство",
        "foundation.title": "Рабочее пространство готово",
        "foundation.description": "Базовая инфраструктура подключена.",
        "language.label": "Язык",
        "theme.toggle": "Сменить тему",
        "theme.light": "Светлая тема",
        "theme.dark": "Тёмная тема",
        "shared.close": "Закрыть",
        "shared.empty": "Ничего не найдено.",
        "shared.loading": "Загрузка",
        "shared.retry": "Повторить",
        "unsavedChanges.confirmDiscard": "Отменить несохранённые изменения?",
        "error.generic": "Произошла ошибка.",
        "error.notFound": "Страница не найдена.",
    },
    LanguageEnum.EN: {
        "app.name": "Personal Workspace",
        "foundation.title": "Workspace is ready",
        "foundation.description": "The foundation infrastructure is connected.",
        "language.label": "Language",
        "theme.toggle": "Toggle theme",
        "theme.light": "Light theme",
        "theme.dark": "Dark theme",
        "shared.close": "Close",
        "shared.empty": "Nothing found.",
        "shared.loading": "Loading",
        "shared.retry": "Retry",
        "unsavedChanges.confirmDiscard": "Discard unsaved changes?",
        "error.generic": "Something went wrong.",
        "error.notFound": "Page not found.",
    },
}

LANGUAGE_LABELS: Mapping[LanguageEnum, str] = {
    LanguageEnum.RU: "Русский",
    LanguageEnum.EN: "English",
}


def get_i18n_messages(*, language: LanguageEnum) -> LanguageMessages:
    return MESSAGES[language]


def get_language_label(*, language: LanguageEnum) -> str:
    return LANGUAGE_LABELS[language]
