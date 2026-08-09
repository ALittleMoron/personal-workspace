# Infrastructure

.PHONY: run stop certbot-issue certbot-renew certbot-sync
run:
	bash infra/scripts/run.sh

stop:
	bash infra/scripts/stop.sh

certbot-issue:
	bash infra/scripts/tls.sh issue

certbot-renew:
	bash infra/scripts/tls.sh renew

certbot-sync:
	bash infra/scripts/tls.sh sync

# Backend

.PHONY: install-backend migrate downgrade revision
.PHONY: test-backend test-backend-unit test-backend-integration test-backend-compose
.PHONY: tests-coverage quality-backend security-backend taskiq-worker taskiq-scheduler
.PHONY: format-check-backend lint-backend types-backend bandit-backend pip-audit-backend
.PHONY: vulture-backend
install-backend:
	$(MAKE) -C backend install

migrate:
	$(MAKE) -C backend migrate

downgrade:
	$(MAKE) -C backend downgrade

revision:
	$(MAKE) -C backend revision

test-backend:
	$(MAKE) -C backend test

test-backend-unit:
	$(MAKE) -C backend test-unit

test-backend-integration:
	$(MAKE) -C backend test-integration

test-backend-compose:
	bash infra/scripts/tests_compose.sh backend

tests-coverage:
	$(MAKE) -C backend tests-coverage

quality-backend:
	$(MAKE) -C backend quality

format-check-backend:
	$(MAKE) -C backend format-check

lint-backend:
	$(MAKE) -C backend ruff-lint-check

types-backend:
	$(MAKE) -C backend types

bandit-backend:
	$(MAKE) -C backend security-bandit

pip-audit-backend:
	$(MAKE) -C backend security-pip-audit

vulture-backend:
	$(MAKE) -C backend vulture

security-backend:
	$(MAKE) -C backend security

taskiq-worker:
	$(MAKE) -C backend taskiq-worker

taskiq-scheduler:
	$(MAKE) -C backend taskiq-scheduler

# Frontend

.PHONY: install-frontend test-frontend tests-coverage-frontend
.PHONY: quality-frontend security-frontend build-frontend performance-lighthouse
.PHONY: format-check-frontend lint-frontend typecheck-frontend
install-frontend:
	$(MAKE) -C frontend install

test-frontend:
	$(MAKE) -C frontend test

tests-coverage-frontend:
	$(MAKE) -C frontend tests-coverage

quality-frontend:
	$(MAKE) -C frontend quality

format-check-frontend:
	$(MAKE) -C frontend format-check

lint-frontend:
	$(MAKE) -C frontend lint

typecheck-frontend:
	$(MAKE) -C frontend typecheck

security-frontend:
	$(MAKE) -C frontend security

build-frontend:
	$(MAKE) -C frontend build

performance-lighthouse:
	$(MAKE) -C frontend lighthouse

# Infrastructure security

.PHONY: lint-dockerfiles lint-docker-images security-trivy-config security-infra
.PHONY: security-backend-docker-image security-frontend-docker-image
.PHONY: security-nginx-docker-image security
lint-dockerfiles:
	bash infra/scripts/docker_lint.sh hadolint

lint-docker-images:
	bash infra/scripts/docker_lint.sh dockle $(DOCKLE_IMAGE_REFS)

TRIVY_IMAGE := docker.io/aquasec/trivy:0.70.0@sha256:be1190afcb28352bfddc4ddeb71470835d16462af68d310f9f4bca710961a41e

security-trivy-config:
	bash infra/scripts/trivy_scan.sh config "$(TRIVY_IMAGE)"

security-backend-docker-image:
	bash infra/scripts/docker_image_security.sh \
		personal_workspace_backend "$(IMAGE_TAG)" backend/Dockerfile backend "$(TRIVY_IMAGE)"

security-frontend-docker-image:
	bash infra/scripts/docker_image_security.sh \
		personal_workspace_frontend "$(IMAGE_TAG)" frontend/Dockerfile frontend "$(TRIVY_IMAGE)"

security-nginx-docker-image:
	bash infra/scripts/docker_image_security.sh \
		personal_workspace_nginx "$(IMAGE_TAG)" infra/nginx/Dockerfile . "$(TRIVY_IMAGE)"

security-infra:
	bash infra/scripts/security_check.sh

security: security-backend security-frontend security-infra

# Combined

.PHONY: install tests tests-fast tests-compose test-env-up test-env-down clean
install: install-backend install-frontend

tests: test-backend test-frontend

tests-fast: test-backend-unit test-frontend

tests-compose:
	bash infra/scripts/tests_compose.sh all

test-env-up:
	bash infra/scripts/test_env.sh up

test-env-down:
	bash infra/scripts/test_env.sh down

clean:
	$(MAKE) -C backend clean
