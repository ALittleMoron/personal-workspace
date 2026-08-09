# Personal Workspace

[🇺🇸 English version](./README.md)

| Категория | Технологии |
|----------|------------|
| Покрытие | ![coverage-backend](./badges/coverage-backend.svg) ![coverage-frontend](./badges/coverage-frontend.svg) |
| Backend | ![python](./badges/python.svg) ![litestar](./badges/litestar.svg) ![async](./badges/async.svg) ![pydantic](./badges/pydantic.svg) ![dishka](./badges/dishka.svg) ![taskiq](./badges/taskiq.svg) |
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
> Отчёты о покрытии backend и frontend формируются в отдельных CI job. До получения собственного
> baseline Personal Workspace бейджи остаются в статусе pending; исходные значения не используются.

`personal-workspace` — самостоятельно размещаемое рабочее пространство для одного оператора и
приватных данных. Репозиторий содержит backend на Python/Litestar, клиентский frontend на Angular и
ориентированную на production контейнерную инфраструктуру. Продуктовые домены добавляются поверх
этого переиспользуемого каркаса.

## Требования

- Docker Engine с плагином Compose
- Python 3.14 и [uv](https://docs.astral.sh/uv/)
- Node.js версии из `frontend/.nvmrc` и npm
- GNU Make
- Ruby для структурной проверки политик GitHub Actions в YAML

## Установка и локальный запуск

Установите зависимости обоих приложений:

```sh
make install
```

Запустите backend и frontend в отдельных терминалах:

```sh
make -C backend run-local
make -C frontend run
```

Backend также требует доступные локально PostgreSQL, Valkey и MinIO, настроенные через окружение.
Если нужен управляемый репозиторием стек зависимостей, используйте `make run`.

Backend доступен на `http://localhost:8000`. Angular доступен на `http://localhost:4200` и
проксирует same-origin-запросы `/api` в backend.

Для контейнерного стека скопируйте `.env.example` в `.env`, заполните все обязательные пустые
секреты и установите права `0600`. `SENTRY_DSN` может быть пустым только при `SENTRY_USE=false`.
Файл `.env.test` содержит детерминированные учётные данные только для тестов; их нельзя
использовать в других окружениях. До первого запуска стека настройте DNS и выпустите начальный
сертификат:

```sh
make certbot-issue
make run
make stop
```

Стек включает PostgreSQL, Valkey, приватный MinIO, Databasus, привязанные к слотам worker-процессы
TaskIQ с единственным активным scheduler, blue/green-слоты backend и frontend, а также
TLS-терминацию в nginx. nginx — единственная публичная точка входа приложения. Консоли MinIO и
Databasus доступны только через настроенный интерфейс WireGuard.

Для последующего обновления или повторной синхронизации сертификатов используйте:

```sh
make certbot-renew
make certbot-sync
```

## Проверки

Основные команды качества и безопасности:

```sh
make quality-backend
make quality-frontend
make security-backend
make security-frontend
make security-infra
make security
```

Проверки контейнеров доступны через `make lint-dockerfiles`, `make lint-docker-images` и
`make security-trivy-config`.

Команды запуска тестов:

```sh
make tests-fast
make tests
make tests-compose
make tests-coverage
make tests-coverage-frontend
make performance-lighthouse
```

Дополнительные точечные команды перечислены в корневом `Makefile` и Makefile-файлах backend и
frontend.

## Документация

- [Оглавление документации](../docs/README.md)
- [Развёртывание в production](../docs/production-deploy.md)
- [Внутренний доступ через WireGuard](../docs/wireguard-internal-access.md)
- [Модель угроз](../docs/security-threat-model.md)

## Политика данных

Новая установка начинает работу с пустой схемой приложения и приватным объектным хранилищем.
Импорт данных — отдельная, явно спроектированная операция. Нельзя использовать production-секреты,
сертификаты, файлы окружения, кеши, отчёты, данные покрытия, зависимости или результаты сборки как
входные данные для новой установки.

## Лицензия

Personal Workspace распространяется по лицензии
[GNU Affero General Public License v3.0](../LICENSE).
