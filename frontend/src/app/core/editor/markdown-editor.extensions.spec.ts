import { ensureSyntaxTree } from '@codemirror/language';
import { EditorState } from '@codemirror/state';
import { markdownEditorLanguage } from './markdown-editor.extensions';

describe('markdownEditorLanguage', () => {
  it('parses Markdown through the shared CodeMirror language extension', () => {
    const state = EditorState.create({ doc: '# Heading', extensions: [markdownEditorLanguage] });
    const tree = ensureSyntaxTree(state, state.doc.length, 1000);
    expect(tree?.toString()).toContain('ATXHeading1');
  });
});
