# Markdown editor instructions

- Markdown source is canonical. Apply local CodeMirror transactions and preserve selection and
  history; do not create a second document model.
- Use direct modular CodeMirror 6 packages and public extension points. Keep Angular integration
  focused on lifecycle, accessibility, i18n labels, and CSP nonce propagation.
- Render previews only through `MarkdownRendererService` and retain security regressions for script
  elements, event-handler attributes, and unsafe URL schemes.
- Inline image paste, drop, picker, and upload controls remain disabled until a private generic file
  workflow is approved. Do not introduce public URLs or anonymous upload behavior.
- Do not add typed internal-link syntax or route resolution until a generic private navigation
  contract exists.
