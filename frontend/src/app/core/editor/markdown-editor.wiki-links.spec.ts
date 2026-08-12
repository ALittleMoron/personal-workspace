import { CompletionContext } from '@codemirror/autocomplete';
import { EditorSelection, EditorState } from '@codemirror/state';
import { createWikiLinkTargetRegistry } from '../wiki-links/wiki-links';
import { markdownEditorLanguage } from './markdown-editor.extensions';
import {
  markdownEditorWikiLinks,
  setWikiLinkCompletionData,
  wikiLinkCompletionSource,
} from './markdown-editor.wiki-links';

describe('Markdown editor wiki-link completions', () => {
  it('offers no removed target domains after the opening delimiters', () => {
    const state = configuredState('[[');
    const result = wikiLinkCompletionSource(new CompletionContext(state, 2, false));

    expect(result?.options).toEqual([]);
  });

  it.each(['[[articles:', '[[matrix:'])('does not complete removed syntax %s', (document) => {
    const state = configuredState(document);

    expect(
      wikiLinkCompletionSource(new CompletionContext(state, state.selection.main.head, false)),
    ).toBeNull();
  });

  it('does not complete an ordinary Markdown link', () => {
    const state = configuredState('[label](target)');

    expect(
      wikiLinkCompletionSource(new CompletionContext(state, state.selection.main.head, false)),
    ).toBeNull();
  });
});

function configuredState(document: string): EditorState {
  const state = EditorState.create({
    doc: document,
    selection: EditorSelection.cursor(document.length),
    extensions: [markdownEditorLanguage, markdownEditorWikiLinks],
  });
  return state.update({
    effects: setWikiLinkCompletionData.of({
      registry: createWikiLinkTargetRegistry([]),
      publishStatusLabels: {
        Draft: 'Черновик',
        Published: 'Опубликовано',
      },
    }),
  }).state;
}
