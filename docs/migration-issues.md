# Migration issues

## Critical

- [x] Fix `infra/scripts/security_check.sh`: unmatched `fi`, an incomplete `openssl verify`, orphaned
  command arguments, and use of an uninitialized nginx image tag.
- [x] Remove imports of deleted `core.articles` and `core.competency_matrix` modules from the
  retained `wiki_links` core use case and DI provider; keep the use case dependency-free and return
  empty targets until Knowledge and Resumes become its sources.
- [ ] Remove the dangling `this.imageUpload` reference from the retained Markdown editor path.
- [ ] Resolve the missing `FilesDatabaseStorage.file_has_usages` implementation while the method
  remains abstract in `FileStorage`.
- [ ] Undo the rewritten Alembic history: the existing `0001` migration was changed and
  `0014.down_revision` was changed from `0013` to `0005`.
- [ ] Remove dangling test infrastructure references:
  - [ ] Missing `clear_tables` fixture in `backend/tests/integration/conftest.py`.
  - [ ] Deleted `test_0014` imported by `backend/tests/migrations/test_0015.py`.
  - [ ] Migration fixtures targeting deleted revisions `0002` and `0006`–`0013`.

## Other confirmed issues

- [ ] Remove replacement logic added instead of deletion-only changes in:
  - [ ] `backend/src/infra/ioc/prodivers/files_provider.py`.
  - [ ] `backend/src/entrypoints/litestar/public/discovery.py`.
  - [ ] `frontend/src/app/features/admin-panel/pages/admin-panel-page/admin-panel-page.component.ts`.
  - [ ] `frontend/src/app/features/admin-panel/pages/dashboard-page.component.ts`.
- [ ] Remove the stale `agent.${APP_DOMAIN}` certificate name from `infra/scripts/tls.sh`.
- [ ] Remove dependencies left from deleted domains in `backend/pyproject.toml`: `pyseto`,
  `itsdangerous`, `pem`, `argon2-cffi`, `openpyxl`, `mcp`, `ua-parser`, and possibly
  `cryptography`.
- [ ] Restore the retained parts of the query-plan framework, CI workflows, and Make targets; delete
  only forbidden-domain scenarios.
- [ ] Restore retained test coverage deleted together with forbidden-domain tests, including shared
  i18n, SEO, interceptors, Markdown editor, updates, cache tools, and knowledge storage coverage.
- [ ] Restore shared Markdown preview formatting removed with the `articles-markdown` class.
- [ ] Restore the unrelated frontend architecture block removed from the public “How this site is
  built” page.
- [ ] Restore the domain-neutral content removed from `.github/README.md`,
  `.github/README_RU.md`, `docs/TODO.md`, `docs/knowledge-database.md`, `docs/calendar.md`,
  `docs/production-deploy.md`, `docs/security-threat-model.md`, and
  `docs/wireguard-internal-access.md`.
- [ ] Remove stale Agent/MCP/Paseto/Argon2/port `18083` references left in documentation and
  certificate configuration.

## Scope conflicts

- [x] Keep the `wiki_links` API and dependency-free core use case, returning empty targets until its
  source implementation is rebuilt on Knowledge and Resumes.
- [ ] Decide what should remain from knowledge/resume HTTP handlers that still require
  `request.user` after auth removal.
