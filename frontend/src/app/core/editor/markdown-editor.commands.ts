import { EditorSelection, EditorState, TransactionSpec } from '@codemirror/state';

export function toggleInlineMarkTransaction(
  state: EditorState,
  mark: '**' | '_' | '~~' | '`',
): TransactionSpec {
  const selection = state.selection.main;
  if (selection.empty) {
    return {
      changes: { from: selection.from, insert: `${mark}${mark}` },
      selection: EditorSelection.cursor(selection.from + mark.length),
    };
  }

  const beforeFrom = selection.from - mark.length;
  const afterTo = selection.to + mark.length;
  const surrounded =
    beforeFrom >= 0 &&
    afterTo <= state.doc.length &&
    state.sliceDoc(beforeFrom, selection.from) === mark &&
    state.sliceDoc(selection.to, afterTo) === mark;

  if (surrounded) {
    return {
      changes: [
        { from: beforeFrom, to: selection.from },
        { from: selection.to, to: afterTo },
      ],
      selection: EditorSelection.range(beforeFrom, selection.to - mark.length),
    };
  }

  return {
    changes: [
      { from: selection.from, insert: mark },
      { from: selection.to, insert: mark },
    ],
    selection: EditorSelection.range(selection.from + mark.length, selection.to + mark.length),
  };
}
