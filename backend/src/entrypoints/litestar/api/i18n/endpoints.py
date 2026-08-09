from dishka import FromDishka
from dishka.integrations.litestar import DishkaRouter
from litestar import Controller, get, status_codes

from core.i18n.enums import LanguageEnum
from entrypoints.litestar.api.i18n.catalog import get_i18n_messages, get_language_label
from entrypoints.litestar.api.i18n.schemas import (
    I18nBundleResponseSchema,
    LanguageResponseSchema,
    LanguagesResponseSchema,
)
from infra.config.settings import I18nSettings


class I18nApiController(Controller):
    path = "/i18n"
    tags = ["i18n"]

    @get("/languages", status_code=status_codes.HTTP_200_OK)
    async def list_languages(
        self,
        i18n_settings: FromDishka[I18nSettings],
    ) -> LanguagesResponseSchema:
        return LanguagesResponseSchema(
            default_language=i18n_settings.default_language,
            languages=[
                LanguageResponseSchema(
                    code=language,
                    label=get_language_label(language=language),
                )
                for language in LanguageEnum
            ],
        )

    @get("/bundles/{language:str}", status_code=status_codes.HTTP_200_OK)
    async def get_bundle(self, language: LanguageEnum) -> I18nBundleResponseSchema:
        return I18nBundleResponseSchema(
            language=language,
            messages=dict(get_i18n_messages(language=language)),
        )


api_router = DishkaRouter("", route_handlers=[I18nApiController])
