# Resume source baseline

## Purpose

This document records the Resume implementation that exists in `my-site` before extraction. It is provenance and planning evidence, not a promise to preserve inherited admin, author, or SSR contracts.

Baseline date: 2026-08-06.

## Backend baseline

The source stores each resume as a PostgreSQL record with:

- title;
- RU/EN document language;
- structured JSON content;
- author username;
- creation and update timestamps.

The structured document includes profile/contact data, summary, skills, work experience and projects, education, languages, certifications, and additional sections. Source endpoints provide list, get, create, update, delete, PDF export, and DOCX export through the admin API and a team-manager authorization guard.

PDF generation uses ReportLab and embedded Noto fonts. DOCX generation uses `python-docx`. Both exporters choose fixed labels from the resume's RU/EN document locale.

## Frontend baseline

The source frontend exposes Resume as an admin workspace at `/admin-panel/workspace/resumes` and calls `/api/admin/resumes`. Its Angular UI includes:

- a resume list and CRUD workflow;
- a structured editor for all supported sections;
- preview behavior;
- PDF and DOCX downloads;
- RU/EN resume-language selection.

## Contracts to preserve conceptually

- Structured Resume CRUD.
- Explicit RU/EN document locale independent from UI locale.
- Preview plus PDF and DOCX export.
- The current structured section family as an input to the Resume work-package design.

## Contracts to remove or redesign

- Admin URLs and admin terminology.
- Role guards and account-derived author identity.
- Author fields, author indexes, and author filtering.
- Any dependency on the public site's SSR, navigation, or dashboard composition.
- Historical schema migrations and existing resume records.

The target implementation starts from an empty clean schema and is defined by the JIT Resume specification and plan, not by automatic copying of these source details.
