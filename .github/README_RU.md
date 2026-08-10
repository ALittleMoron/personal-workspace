# Мой сайт

[🇺🇸 English version](./README.md)

| Категория | Технологии |
|----------|------------|
| Покрытие | ![coverage-backend](./badges/coverage-backend.svg) ![coverage-frontend](./badges/coverage-frontend.svg) |
| Backend | ![python](./badges/python.svg) ![litestar](./badges/litestar.svg) ![async](./badges/async.svg) ![pydantic](./badges/pydantic.svg) ![dishka](./badges/dishka.svg) ![taskiq](./badges/taskiq.svg) ![paseto](./badges/paseto.svg) ![argon2](./badges/argon2.svg) ![mcp](./badges/mcp.svg) |
| База данных | ![postgresql](./badges/postgresql.svg) ![sqlalchemy](./badges/sqlalchemy.svg) ![alembic](./badges/alembic.svg) |
| Кэш | ![valkey](./badges/valkey.svg) |
| Frontend | ![angular](./badges/angular.svg) ![typescript](./badges/typescript.svg) ![bootstrap](./badges/bootstrap.svg) |
| Тестирование | ![pytest](./badges/pytest.svg) ![jest](./badges/jest.svg) ![lhci](./badges/lhci.svg) |
| DevOps | ![docker](./badges/docker.svg) ![nginx](./badges/nginx.svg) ![minio](./badges/minio.svg) ![docker-compose](./badges/docker-compose.svg) |
| Качество | ![ruff](./badges/ruff.svg) ![mypy](./badges/mypy.svg) ![bandit](./badges/bandit.svg) ![pip-audit](./badges/pip-audit.svg) ![trivy](./badges/trivy.svg) ![hadolint](./badges/hadolint.svg) ![dockle](./badges/dockle.svg) ![vulture](./badges/vulture.svg) ![eslint](./badges/eslint.svg) ![prettier](./badges/prettier.svg) |
| Логирование | ![structlog](./badges/structlog.svg) ![ecs-logging](./badges/ecs-logging.svg) ![sentry](./badges/sentry.svg) |
| Архитектура | ![clean-architecture](./badges/clean-architecture.svg) ![type-safe](./badges/type-safe.svg) |
| Инструменты | ![uv](./badges/uv.svg) ![granian](./badges/granian.svg) ![node](./badges/node.svg) ![npm](./badges/npm.svg) |
| CI/CD | ![github-actions](./badges/github-actions.svg) ![dependabot](./badges/dependabot.svg) |

> [!NOTE]
> Backend coverage — pytest (Python). Frontend coverage — Jest (TypeScript). Оба генерируются в отдельных CI job-ах.

Инженерный сайт с публичной case-study страницей, обновлениями, матрицей компетенций,
локализованными статьями и защищёнными рабочими областями для управления контентом.

## 📖 Документация

## 📂 Структура проекта

```
my-site/
├── infra/          # nginx reverse proxy, скрипты запуска
├── frontend/       # Angular 22 hybrid SSR/CSR (собственный Node.js-образ)
├── backend/        # Litestar API + доменная логика
│   ├── src/        # Исходный код приложения
│   ├── tests/      # Backend-тесты (pytest)
│   └── performance/ # сценарии и отчёты проверки планов PostgreSQL
├── .env.example    # Пример переменных окружения
├── .env.test       # Безопасные переменные для тестового окружения
├── docker-compose.test.yml
└── docker-compose.yml
```

## ✨ Возможности

## 🚀 Запуск

1. Клонировать репозиторий:
```bash
git clone git@github.com:ALittleMoron/my-site.git
cd my-site
```

2. Создать файл `.env`:
```bash
cp .env.example .env
```

3. Сгенерировать сертификаты для `nginx` (опционально для локального запуска):

Контейнер nginx запускается с UID/GID `101:101`, поэтому смонтированные сертификат и приватный ключ
должны быть читаемы этим пользователем. Для локальных файлов `mkcert`
достаточно `chmod 644 ./infra/nginx/certs/<file>`; для production лучше настроить
owner/group-права так, чтобы доступ на чтение был только у nginx.
Production выпуск и renewal Let's Encrypt сертификатов идут через compose-backed
targets `make certbot-issue`, `make certbot-renew` и `make certbot-sync`. Подробнее:
[Production Deploy](../docs/production-deploy.md).

4. Обновить переменные в `.env`.

5. Запустить через `Makefile`:
```bash
make run
```

## Локальный MCP bridge

## ⚙️ Важные ссылки

Локальный edge nginx перенаправляет HTTP на HTTPS, поэтому в браузере используйте HTTPS-ссылки.

- Frontend: `https://localhost`
- API: `https://localhost/api`
- API liveness: `https://localhost/api/healthcheck`
- API readiness: `https://localhost/api/healthcheck/ready`
- Документация API: `https://localhost/api/docs`
- OpenAPI спецификация: `https://localhost/api/docs/openapi.json`

Внутренние web-панели доступны только через host-level WireGuard и nginx-порты,
привязанные к `VPN_BIND_ADDRESS`:

Production firewall baseline: `80/tcp`, `443/tcp` и выбранный WireGuard UDP
port. Подробнее: [WireGuard internal access](../docs/wireguard-internal-access.md).

Другие сервисы — в [docker-compose.yml](../docker-compose.yml).

## 🧪 Тесты

Backend pytest targets запускаются с явным числом pytest-xdist воркеров по физическим CPU-ядрам,
без `-n auto`. Для serial-режима задайте `BACKEND_PYTEST_WORKERS=0` или `1`; любое значение больше
`1` принудительно задаёт точное число воркеров. Unit-тесты идут без test DB; integration-тесты
клонируют мигрированную template DB текущего запуска в отдельные PostgreSQL базы на worker, а
Alembic migration-тесты остаются serial на базовой test DB.
