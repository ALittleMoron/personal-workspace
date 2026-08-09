from typing import Annotated

from pydantic import Field

from core.i18n.enums import LanguageEnum
from entrypoints.litestar.api.schemas import CamelCaseSchema


class LanguageResponseSchema(CamelCaseSchema):
    code: Annotated[LanguageEnum, Field(title="Language code")]
    label: Annotated[str, Field(title="Language name")]


class LanguagesResponseSchema(CamelCaseSchema):
    default_language: Annotated[LanguageEnum, Field(title="Default language")]
    languages: Annotated[list[LanguageResponseSchema], Field(title="Available languages")]


class I18nBundleResponseSchema(CamelCaseSchema):
    language: Annotated[LanguageEnum, Field(title="Language")]
    messages: Annotated[dict[str, str], Field(title="Translations")]
