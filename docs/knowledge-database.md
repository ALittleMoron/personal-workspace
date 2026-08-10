# Knowledge Database

The knowledge database is a private owner/admin workspace. Its first typed item workspaces are
People and Dates. The common item, taxonomy, file, and access boundaries remain reusable for future
knowledge types. It is not a public content API and is not part of Angular SSR.

## Architecture

The model uses a typed extension pattern:

Knowledge code is physically partitioned by ownership:

- `core/knowledge/{items,files,people,dates}` contains the matching domain enums, schemas, contracts,
  services, and use cases.
- `entrypoints/litestar/api/knowledge/{items,files,people,dates}` contains transport schemas and
  controllers; `knowledge/router.py` only composes those controllers.
- `infra/postgresql/{models,storages}/knowledge/{items,files,people,dates}` and
  `infra/ioc/prodivers/knowledge/` mirror the same boundaries.

Future item types should add their own typed one-to-one extension and feature facade. A universal
JSON/EAV field bag or a universal dynamic form renderer would discard database constraints,
searchability, type safety, and explicit product behavior, so it is not the extension mechanism.

## PostgreSQL Model

Migrations `0014_add_knowledge_people_and_private_files.py`,
`0015_add_knowledge_dates.py`, and `0016_add_people_birthday_calendar_index.py` add:

## Admin API

People:

Person detail responses also include required `relatedDates` backlinks. Link mutations remain
Date-owned.

Dates:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/knowledge/dates` | Paginated search, AND-tag and Person filters, plus calendar/update/name sorting. |
| `POST` | `/api/admin/knowledge/dates` | Quick-create from a display name and annual date. |
| `GET` | `/api/admin/knowledge/dates/{dateId}` | Full date, tags, related People, private attachments, and timestamps. |
| `PUT` | `/api/admin/knowledge/dates/{dateId}` | Replace the date, description, tags, and People links. |
| `DELETE` | `/api/admin/knowledge/dates/{dateId}` | Delete the Date graph and schedule attachment cleanup after commit. |

Taxonomy and private files:

The API returns a protected `contentPath` for file reads, never an S3 URL or presigned URL.

## Private Files

Photos accept JPEG, PNG, or WebP up to 5 MiB. Pillow fully decodes the supplied bytes, verifies that
the detected type matches the declared MIME type, rejects animated images and decompression-bomb
warnings/errors, applies EXIF orientation, bounds the image to 2048×2048, and always writes WebP.
Attachments accept arbitrary MIME types up to 20 MiB and are served as downloads rather than
trusted active content. Each upload route has a request-body limit equal to its advertised file
limit plus bounded multipart overhead, and the backend reads at most the file limit plus one byte
before applying the core size rule. Persisted original names and MIME types are capped at 255
characters.

Database deletion is transaction-owned. Replaced/deleted object names are registered as
post-commit cleanup actions, so rollback cannot remove still-referenced data. Cleanup is best
effort and logs only bucket-level outcome/counts, not private object content. Newly uploaded objects
are separately registered for request rollback and commit-failure cleanup, while successful commit
discards those rollback actions. A failed cleanup can still leave an orphan and needs operational
follow-up; it must not replace the original request/commit error or turn a committed database
mutation into a misleading client failure.

## Angular Workspaces And Dashboard

The lazy CSR routes are:

Knowledge file sizes use the smallest meaningful localized unit: bytes below 1 KiB, kilobytes below
1 MiB, then megabytes, gigabytes, and terabytes.

The workspace uses explicit typed forms and feature models. It does not render a schema-driven
universal form. Protected photos are fetched as blobs and displayed through short-lived browser
object URLs; old URLs are revoked on replacement, navigation, errors, and component destruction.
The shared Markdown editor has image uploads disabled for People and Dates descriptions, because
inline images would bypass the private knowledge-file workflow. A shared locale-aware annual-date
formatter renders day/month values with or without the optional year in both workspaces.

## Operations

`make run` invokes backend initialization, which initializes both the public `media` bucket and the
private `knowledge-private` bucket. After a deployment:

1. Confirm backend readiness and that initialization completed without an S3 error.
2. In the VPN-only MinIO Console, confirm `knowledge-private` exists and has no anonymous policy
   and no bucket CORS configuration.
3. From the public side, confirm both
   `https://s3.<APP_DOMAIN>/knowledge-private` and a path below it return `404`.
4. As an owner/admin, upload and download a small photo and attachment through the People UI and an
   attachment through Dates. Confirm replacement/deletion removes obsolete objects only after the
   request commits.
5. Confirm the knowledge controllers are absent from `/api/docs/openapi.json` and private responses
   carry `no-store`.

## Backup And Restore

For recovery, restore to an isolated environment first:

Automated private-bucket backup/restore and recurring restore tests remain roadmap work. Until a
restore exercise passes, the existence of backups is not a recovery guarantee.
