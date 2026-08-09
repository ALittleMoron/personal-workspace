# ADR 0006: Separate interface localization from authored content

- Status: Accepted
- Date: 2026-08-06

## Context

The workspace UI needs Russian and English, but Knowledge entries are private authored material whose language is not constrained by the interface. Resume documents need an explicit document language because labels and export templates depend on it.

## Decision

Initially localize UI strings in Russian and English only. Knowledge content remains language-neutral user-authored text and may use any language; it is not duplicated into RU/EN translation fields and receives no implicit translation fallback.

Resume document locale is independent of UI locale and is initially restricted to RU or EN. It controls document labels and export behavior, not the surrounding interface language.

## Consequences

- Core Knowledge read and write models do not contain parallel language fields.
- A future additional UI locale does not imply content migration.
- A future additional Resume document locale requires its own typed-template design.
- Localization changes must be evaluated against this boundary.
