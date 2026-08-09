import {
  AfterViewInit,
  CSP_NONCE,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { Compartment, EditorSelection, EditorState, Transaction } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { MarkdownRendererService } from '../markdown/markdown-renderer.service';
import { toggleInlineMarkTransaction } from './markdown-editor.commands';
import { markdownEditorExtensions } from './markdown-editor.extensions';

type MarkdownEditorMode = 'edit' | 'preview';

@Component({
  selector: 'app-markdown-editor',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './markdown-editor.component.html',
  styleUrl: './markdown-editor.component.scss',
})
export class MarkdownEditorComponent implements AfterViewInit, OnDestroy {
  private readonly renderer = inject(MarkdownRendererService);
  private readonly cspNonce = inject(CSP_NONCE, { optional: true });
  private readonly editableCompartment = new Compartment();
  private editorView: EditorView | null = null;
  private syncingInput = false;

  @ViewChild('editorHost', { static: true }) private readonly editorHost!: ElementRef<HTMLElement>;

  readonly value = input('');
  readonly disabled = input(false);
  readonly ariaLabel = input.required<string>();
  readonly boldLabel = input.required<string>();
  readonly editLabel = input.required<string>();
  readonly previewLabel = input.required<string>();
  readonly valueChange = output<string>();
  readonly mode = signal<MarkdownEditorMode>('edit');
  private readonly documentValue = signal('');
  readonly previewHtml = computed(() => this.renderer.render(this.documentValue()));

  constructor() {
    effect(() => {
      const value = this.value();
      this.documentValue.set(value);
      const view = this.editorView;
      if (view === null || view.state.doc.toString() === value) return;
      this.syncingInput = true;
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: value },
        annotations: Transaction.addToHistory.of(false),
      });
      this.syncingInput = false;
    });

    effect(() => {
      const editable = !this.disabled();
      const view = this.editorView;
      if (view === null) return;
      view.dispatch({
        effects: this.editableCompartment.reconfigure(EditorView.editable.of(editable)),
      });
    });
  }

  ngAfterViewInit(): void {
    this.editorView = new EditorView({
      parent: this.editorHost.nativeElement,
      state: EditorState.create({
        doc: this.value(),
        selection: EditorSelection.cursor(0),
        extensions: markdownEditorExtensions({
          ariaLabel: this.ariaLabel(),
          cspNonce: this.cspNonce,
          editableCompartment: this.editableCompartment,
          editable: !this.disabled(),
          onUpdate: (update) => {
            if (update.docChanged && !this.syncingInput) {
              const value = update.state.doc.toString();
              this.documentValue.set(value);
              this.valueChange.emit(value);
            }
          },
        }),
      }),
    });
  }

  ngOnDestroy(): void {
    this.editorView?.destroy();
    this.editorView = null;
  }

  showEditor(): void {
    this.mode.set('edit');
  }

  showPreview(): void {
    this.mode.set('preview');
  }

  toggleBold(): void {
    if (this.disabled() || this.editorView === null) return;
    this.editorView.dispatch(toggleInlineMarkTransaction(this.editorView.state, '**'));
    this.editorView.focus();
  }
}
