from dataclasses import dataclass
from typing import Any

from httpx import Response
from litestar.testing import TestClient


@dataclass(kw_only=True, frozen=True, slots=True)
class APIHelper:
    client: TestClient

    @staticmethod
    def _entity_id(value: int | str) -> str:
        if isinstance(value, str):
            return value
        return f"{value:032x}"

    def get_health(self) -> Response:
        return self.client.get("/api/healthcheck")

    def get_health_ready(self) -> Response:
        return self.client.get("/api/healthcheck/ready")

    def get_i18n_languages(self) -> Response:
        return self.client.get("/api/i18n/languages")

    def get_i18n_bundle(self, language: str) -> Response:
        return self.client.get(f"/api/i18n/bundles/{language}")

    def get_admin_people(
        self,
        *,
        page: int | None = 1,
        page_size: int | None = 20,
        sort: str | None = "updatedNewest",
        search_query: str | None = None,
        tag_ids: list[str] | None = None,
    ) -> Response:
        params: dict[str, str | int | list[str]] = {
            key: value
            for key, value in (
                ("page", page),
                ("pageSize", page_size),
                ("sort", sort),
                ("searchQuery", search_query),
                ("tagIds", tag_ids),
            )
            if value is not None
        }
        return self.client.get("/api/admin/knowledge/people", params=params)

    def get_admin_calendar(self, *, reference_date: str | None, window: str | None) -> Response:
        params = {
            key: value
            for key, value in (("referenceDate", reference_date), ("window", window))
            if value is not None
        }
        return self.client.get("/api/admin/calendar", params=params)

    def post_admin_person(self, *, data: dict[str, Any]) -> Response:
        return self.client.post("/api/admin/knowledge/people", json=data)

    def get_admin_person(self, *, person_id: int | str) -> Response:
        return self.client.get(f"/api/admin/knowledge/people/{self._entity_id(person_id)}")

    def put_admin_person(self, *, person_id: int | str, data: dict[str, Any]) -> Response:
        return self.client.put(
            f"/api/admin/knowledge/people/{self._entity_id(person_id)}", json=data
        )

    def delete_admin_person(self, *, person_id: int | str) -> Response:
        return self.client.delete(f"/api/admin/knowledge/people/{self._entity_id(person_id)}")

    def get_admin_knowledge_dates(
        self,
        *,
        page: int | None = 1,
        page_size: int | None = 20,
        sort: str | None = "dateAsc",
        search_query: str | None = None,
        tag_ids: list[str] | None = None,
        related_person_id: str | None = None,
    ) -> Response:
        params: dict[str, str | int | list[str]] = {
            key: value
            for key, value in (
                ("page", page),
                ("pageSize", page_size),
                ("sort", sort),
                ("searchQuery", search_query),
                ("tagIds", tag_ids),
                ("relatedPersonId", related_person_id),
            )
            if value is not None
        }
        return self.client.get("/api/admin/knowledge/dates", params=params)

    def post_admin_knowledge_date(self, *, data: dict[str, Any]) -> Response:
        return self.client.post("/api/admin/knowledge/dates", json=data)

    def get_admin_knowledge_date(self, *, date_id: int | str) -> Response:
        return self.client.get(f"/api/admin/knowledge/dates/{self._entity_id(date_id)}")

    def put_admin_knowledge_date(self, *, date_id: int | str, data: dict[str, Any]) -> Response:
        return self.client.put(f"/api/admin/knowledge/dates/{self._entity_id(date_id)}", json=data)

    def delete_admin_knowledge_date(self, *, date_id: int | str) -> Response:
        return self.client.delete(f"/api/admin/knowledge/dates/{self._entity_id(date_id)}")

    def get_admin_knowledge_tags(self, *, search_query: str | None = None) -> Response:
        params = {"searchQuery": search_query} if search_query is not None else None
        return self.client.get("/api/admin/knowledge/tags", params=params)

    def post_admin_knowledge_tag(self, *, data: dict[str, Any]) -> Response:
        return self.client.post("/api/admin/knowledge/tags", json=data)

    def put_admin_knowledge_tag(self, *, tag_id: int | str, data: dict[str, Any]) -> Response:
        return self.client.put(f"/api/admin/knowledge/tags/{self._entity_id(tag_id)}", json=data)

    def delete_admin_knowledge_tag(self, *, tag_id: int | str) -> Response:
        return self.client.delete(f"/api/admin/knowledge/tags/{self._entity_id(tag_id)}")

    def get_admin_person_relationship_types(self) -> Response:
        return self.client.get("/api/admin/knowledge/people/relationship-types")

    def post_admin_person_relationship_type(self, *, data: dict[str, Any]) -> Response:
        return self.client.post("/api/admin/knowledge/people/relationship-types", json=data)

    def put_admin_person_relationship_type(
        self, *, relationship_type_id: int | str, data: dict[str, Any]
    ) -> Response:
        return self.client.put(
            f"/api/admin/knowledge/people/relationship-types/{self._entity_id(relationship_type_id)}",
            json=data,
        )

    def delete_admin_person_relationship_type(self, *, relationship_type_id: int | str) -> Response:
        return self.client.delete(
            f"/api/admin/knowledge/people/relationship-types/{self._entity_id(relationship_type_id)}"
        )

    def get_admin_tools_cache(self) -> Response:
        return self.client.get("/api/admin/tools/cache")

    def post_admin_tools_cache_clear(self) -> Response:
        return self.client.post("/api/admin/tools/cache/clear")

    def post_admin_tools_cache_warm(self) -> Response:
        return self.client.post("/api/admin/tools/cache/warm")

    def get_admin_tools_cache_warm_operation(self, *, operation_id: str) -> Response:
        return self.client.get(f"/api/admin/tools/cache/warm/{operation_id}")

    def get_wiki_link_targets(self, language: str | None = "ru") -> Response:
        params: dict[str, str] = {}
        if language is not None:
            params["language"] = language
        return self.client.get("/api/admin/wiki-links/targets", params=params)

    def get_admin_resumes(self, page: int | None = 1, page_size: int | None = 20) -> Response:
        params: dict[str, int] = {
            key: value
            for key, value in (("page", page), ("pageSize", page_size))
            if value is not None
        }
        return self.client.get("/api/admin/resumes", params=params)

    def post_create_resume(self, data: dict[str, Any]) -> Response:
        return self.client.post("/api/admin/resumes", json=data)

    def get_admin_resume(self, resume_id: int | str) -> Response:
        return self.client.get(f"/api/admin/resumes/{self._entity_id(resume_id)}")

    def put_update_resume(self, resume_id: int | str, data: dict[str, Any]) -> Response:
        return self.client.put(f"/api/admin/resumes/{self._entity_id(resume_id)}", json=data)

    def post_export_resume(self, resume_id: int | str, data: dict[str, Any]) -> Response:
        return self.client.post(
            f"/api/admin/resumes/{self._entity_id(resume_id)}/export", json=data
        )

    def delete_resume(self, resume_id: int | str) -> Response:
        return self.client.delete(f"/api/admin/resumes/{self._entity_id(resume_id)}")

    def post_admin_file(
        self, *, purpose: str, name: str, filename: str, content: bytes, content_type: str
    ) -> Response:
        return self.client.post(
            "/api/admin/files",
            data={"purpose": purpose, "name": name},
            files={"file": (filename, content, content_type)},
        )

    def get_admin_files(self, *, purpose: str) -> Response:
        return self.client.get("/api/admin/files", params={"purpose": purpose})

    def get_admin_file(self, *, file_id: str) -> Response:
        return self.client.get(f"/api/admin/files/{file_id}")

    def put_admin_file(self, *, file_id: str, name: str) -> Response:
        return self.client.put(f"/api/admin/files/{file_id}", json={"name": name})

    def delete_admin_file(self, *, file_id: str) -> Response:
        return self.client.delete(f"/api/admin/files/{file_id}")
