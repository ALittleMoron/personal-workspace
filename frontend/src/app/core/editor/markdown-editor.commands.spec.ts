import { EditorSelection, EditorState } from '@codemirror/state';
import { toggleInlineMarkTransaction } from './markdown-editor.commands';

describe('toggleInlineMarkTransaction', () => {
  it('wraps and unwraps the selected Markdown without replacing unrelated source', () => {
    const initial = EditorState.create({
      doc: 'before selected after',
      selection: EditorSelection.range(7, 15),
    });
    const wrapped = initial.update(toggleInlineMarkTransaction(initial, '**')).state;
    expect(wrapped.doc.toString()).toBe('before **selected** after');
    expect(wrapped.sliceDoc(wrapped.selection.main.from, wrapped.selection.main.to)).toBe(
      'selected',
    );

    const unwrapped = wrapped.update(toggleInlineMarkTransaction(wrapped, '**')).state;
    expect(unwrapped.doc.toString()).toBe('before selected after');
  });

  it('places the caret between an empty marker pair', () => {
    const initial = EditorState.create({ doc: 'text', selection: EditorSelection.cursor(4) });
    const next = initial.update(toggleInlineMarkTransaction(initial, '`')).state;
    expect(next.doc.toString()).toBe('text``');
    expect(next.selection.main.head).toBe(5);
  });
});
