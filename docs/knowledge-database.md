# Knowledge Database

Knowledge is a private administrator workspace. Its current typed item workspaces are People and
Dates. It is not a public content API; all of its browser UI is Angular CSR.

## Model and boundaries

The clean `0001_initial_schema.py` migration creates the current schema for a fresh deployment.
`KnowledgeItem` owns common identity, type, author username, display name, description, tags and
timestamps. `PersonDetails` and `KnowledgeDateDetails` are required typed one-to-one extensions.
Dates own their links to People; People expose the resulting `relatedDates` backlinks. Person
relationships and their types are normalized, author-scoped records.

`FileModel` is the canonical metadata record for every stored file. `KnowledgeItemFileModel` links
it to its Knowledge owner and records the Knowledge file kind and processing provenance. The
association foreign keys use `RESTRICT`; deletion locks the canonical row, removes the association,
checks registered uses and removes metadata and object bytes only when no use remains. Namespace
checks prevent a `knowledge-private` row from being handled by public `media` storage.

Code follows the same ownership split in `core/knowledge/{items,files,people,dates}`,
`entrypoints/litestar/api/knowledge/{items,files,people,dates}`, and the matching PostgreSQL
models, storages and providers. A future item type needs its own typed extension and feature facade;
do not substitute a JSON/EAV field bag or a universal dynamic form.

## Access and API

Knowledge controllers live below `/api/admin/knowledge/*`, are excluded from OpenAPI and send
`Cache-Control: no-store`. The whole `/api/admin/*` router currently requires a verified
request-scope `VerifiedAdminIdentity`; absent or malformed identity is rejected. The planned
authenticator will configure one administrator through the environment and will not introduce
account or team tables.

| Area | Current API |
| --- | --- |
| People | CRUD at `/people`, relationship-type CRUD at `/people/relationship-types`, protected photo replacement/removal at `/people/{personId}/photo`. |
| Dates | CRUD at `/dates`; list supports search, AND-tag and related-Person filters and calendar/update/name ordering. |
| Tags | List/search and create at `/tags`; rename/delete at `/tags/{tagId}`. |
| Files | Attachments at `/items/{itemId}/attachments`, normalized Markdown images at `/items/{itemId}/editor-images`, and protected streaming at `/files/{fileId}/content`. |

Every use case receives the verified identity's username. IDs, links, taxonomy and file operations
are author-scoped; an unknown and a foreign-owned ID share the same not-found behavior.

## Private files and Markdown images

Private objects are kept only in the `knowledge-private` MinIO bucket through the backend's
authenticated internal S3 client. Initialization creates the bucket when missing and removes bucket
policy and CORS. The public `s3.<APP_DOMAIN>` nginx listener returns `404` for both the exact bucket
path and its prefix. APIs return a protected backend `contentPath`, never an S3 or presigned URL.

Photos and editor images accept JPEG, PNG or WebP up to 5 MiB. The backend decodes and validates
the bytes, rejects animated and decompression-bomb images, applies orientation, bounds dimensions,
and writes normalized WebP. Attachments accept arbitrary MIME types up to 20 MiB and are sent as
downloads. An editor image is an ordinary attachment whose persisted
`normalizedRasterImage` provenance permits inline image serving; raw attachments remain downloads.

The editor-image endpoint is the only supported inline-upload route for private Knowledge Markdown.
The Angular workspace fetches protected content as a blob, uses short-lived object URLs for previews
and revokes them after replacement, errors, navigation and destruction. Removing a Markdown
reference does not delete its attachment.

Object replacement/deletion is transaction-owned: obsolete object names are cleanup actions only
after commit, while newly uploaded objects are registered for rollback/commit-failure cleanup. That
cleanup is best effort; a failed cleanup can leave an orphan for operations follow-up but must not
hide the original request or transaction failure.

## Workspace and calendar

Protected CSR routes are `/admin-panel/knowledge/people`,
`/admin-panel/knowledge/people/:id`, `/admin-panel/knowledge/dates`, and
`/admin-panel/knowledge/dates/:id`. They use explicit typed forms rather than a schema-driven form
renderer. `/admin-panel/dashboard` composes its Calendar and operational-tools widgets without
owning their business logic; see [Calendar](calendar.md).

## Operations and recovery

`make run` starts a one-shot backend initializer that creates the public `media` and private
`knowledge-private` buckets. After a deploy or restore:

1. Check backend readiness and successful bucket initialization.
2. In the VPN-only MinIO Console, verify that `knowledge-private` has neither anonymous policy nor
   bucket CORS.
3. From a public network, verify that `https://s3.<APP_DOMAIN>/knowledge-private` and a child path
   return `404`.
4. Once authentication is available, exercise a protected photo, attachment and editor image;
   confirm the image has a Blob preview and remains an attachment after its Markdown reference is
   removed.
5. Confirm Knowledge controllers remain absent from `/api/docs/openapi.json` and responses use
   `no-store`.

PostgreSQL and `knowledge-private` form one recovery set because database records contain object
paths. Back up both with the same recovery-point identifier; keep backups encrypted,
access-controlled and non-public. Restore to an isolated environment first, then run normal
migrations and bucket initialization, reconcile metadata against objects, sample authorized reads,
and repeat the public exact/prefix `404` checks. Record the recovery point, duration, integrity
findings and cleanup exceptions. Automated private-bucket backup/restore and recurring restore
exercises remain roadmap work; a backup is not proven recoverable until an isolated restore passes.

Run `make security-infra`, `make query-plans-realistic`, and the relevant backend/frontend Make
targets after changing this contour. The query-plan gate covers retained Knowledge and Resume
storage queries.
