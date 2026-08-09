TEST_ENV_FILE ?= ../.env.test
TEST_ENV_OVERRIDES ?=

.PHONY: install run run-local taskiq-worker taskiq-scheduler revision migrate downgrade shell clean
.PHONY: types mypy bandit security-bandit security-pip-audit security vulture fix format format-check
.PHONY: lint-file ruff-check ruff-lint-check lint-check test test-unit test-integration
.PHONY: tests-coverage quality

install:
	bash scripts/install.sh install

run:
	bash scripts/app.sh run

run-local:
	bash scripts/app.sh run-local

taskiq-worker:
	bash scripts/app.sh taskiq-worker

taskiq-scheduler:
	bash scripts/app.sh taskiq-scheduler

revision:
	bash scripts/alembic.sh revision "$(message)"

migrate:
	bash scripts/alembic.sh migrate

downgrade:
	bash scripts/alembic.sh downgrade

shell:
	bash scripts/app.sh shell

clean:
	bash scripts/quality.sh clean

types:
	bash scripts/quality.sh types

mypy: types

bandit:
	bash scripts/quality.sh bandit

security-bandit:
	bash scripts/security.sh bandit

security-pip-audit:
	bash scripts/security.sh pip-audit

security:
	bash scripts/security.sh security

vulture:
	bash scripts/quality.sh vulture

fix:
	bash scripts/quality.sh fix

format:
	bash scripts/quality.sh format

format-check:
	bash scripts/quality.sh format-check

lint-file:
	bash scripts/quality.sh lint-file "$(file)"

ruff-check:
	bash scripts/quality.sh ruff-check

ruff-lint-check:
	bash scripts/quality.sh ruff-lint-check

lint-check:
	bash scripts/quality.sh lint-check

test:
	bash scripts/test.sh test "$(TEST_ENV_FILE)" "$(TEST_ENV_OVERRIDES)"

test-unit:
	bash scripts/test.sh test-unit "$(TEST_ENV_FILE)" "$(TEST_ENV_OVERRIDES)"

test-integration:
	bash scripts/test.sh test-integration "$(TEST_ENV_FILE)" "$(TEST_ENV_OVERRIDES)"

tests-coverage:
	bash scripts/test.sh tests-coverage "$(TEST_ENV_FILE)" "$(TEST_ENV_OVERRIDES)"

quality:
	bash scripts/quality.sh quality "$(TEST_ENV_FILE)" "$(TEST_ENV_OVERRIDES)"
