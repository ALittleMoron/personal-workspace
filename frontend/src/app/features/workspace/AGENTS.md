# Workspace Instructions

These rules apply to every file under `frontend/src/app/features/workspace/`.

## Knowledge People

- Keep People under the CSR routes
  `/knowledge/people` and `/knowledge/people/:id`.
- Use explicit typed People forms/models for person details, birthday, tags, relationships, photo,
  and attachments. Do not introduce a schema-driven universal knowledge form renderer; future
  knowledge types should own their typed feature facade and interaction design.
- Read private photos/downloads only through protected blob responses and revoke every object URL
  when it is replaced or no longer displayed. People descriptions may use the shared sanitized
  Markdown editor, but image paste/drop/picker uploads must remain disabled because inline public
  media would bypass the private knowledge-file workflow.
