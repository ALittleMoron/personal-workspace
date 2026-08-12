from core.enums import PublishStatusEnum
from core.i18n.enums import LanguageEnum
from entrypoints.litestar.api.i18n.catalog import get_i18n_messages


class TestI18nCatalog:
    def test_supported_languages_have_identical_keys(self) -> None:
        russian_keys = set(get_i18n_messages(language=LanguageEnum.RU))
        english_keys = set(get_i18n_messages(language=LanguageEnum.EN))

        assert english_keys == russian_keys

    def test_publish_status_values_have_labels_in_every_language(self) -> None:
        for language in LanguageEnum:
            messages = get_i18n_messages(language=language)

            for status in PublishStatusEnum:
                assert messages[f"enum.publishStatus.{status.value}"]

    def test_retained_admin_workspaces_are_localized_in_both_languages(self) -> None:
        required_keys = {
            "adminPanel.section.dashboard",
            "adminPanel.section.resumes",
            "adminPanel.section.tools",
            "adminPanel.section.knowledge",
            "adminPanel.section.people",
            "adminPanel.section.dates",
            "knowledgePeople.relationshipTypes.manage",
            "knowledgePeople.attachmentDownloadError",
            "knowledgeDates.attachmentDownloadError",
            "adminTools.cache.title",
            "adminResumeWorkspace.title",
        }

        for language in LanguageEnum:
            messages = get_i18n_messages(language=language)
            assert required_keys <= messages.keys()
            assert all(messages[key].strip() for key in required_keys)

    def test_markdown_editor_accessibility_copy_is_localized(self) -> None:
        russian = get_i18n_messages(language=LanguageEnum.RU)
        english = get_i18n_messages(language=LanguageEnum.EN)

        assert russian["markdownEditor.toolbar.aria"] == "Действия Markdown-редактора"
        assert english["markdownEditor.toolbar.aria"] == "Markdown editor actions"
        assert "Escape" in russian["markdownEditor.shortcuts.tabEscape"]
        assert "Tab" in english["markdownEditor.shortcuts.tabEscape"]
