import { closeBrackets } from '@codemirror/autocomplete';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { bracketMatching, indentUnit, syntaxHighlighting } from '@codemirror/language';
import { highlightSelectionMatches, search, searchKeymap } from '@codemirror/search';
import { Compartment, EditorState, Extension } from '@codemirror/state';
import {
  EditorView,
  ViewUpdate,
  drawSelection,
  dropCursor,
  highlightActiveLine,
  highlightActiveLineGutter,
  keymap,
  lineNumbers,
} from '@codemirror/view';
import { classHighlighter } from '@lezer/highlight';

export const markdownEditorLanguage = markdown({ base: markdownLanguage });

export interface MarkdownEditorExtensionOptions {
  ariaLabel: string;
  cspNonce: string | null;
  editableCompartment: Compartment;
  editable: boolean;
  onUpdate: (update: ViewUpdate) => void;
}

export function markdownEditorExtensions(
  options: MarkdownEditorExtensionOptions,
): readonly Extension[] {
  return [
    EditorState.allowMultipleSelections.of(true),
    indentUnit.of('  '),
    markdownEditorLanguage,
    history(),
    lineNumbers(),
    dropCursor(),
    drawSelection(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    bracketMatching(),
    closeBrackets(),
    search({ top: true }),
    highlightSelectionMatches(),
    syntaxHighlighting(classHighlighter),
    keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
    EditorView.lineWrapping,
    options.editableCompartment.of(EditorView.editable.of(options.editable)),
    EditorView.contentAttributes.of({ 'aria-label': options.ariaLabel }),
    EditorView.updateListener.of(options.onUpdate),
    options.cspNonce === null ? [] : EditorView.cspNonce.of(options.cspNonce),
  ];
}
