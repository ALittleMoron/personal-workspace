import { TestBed } from '@angular/core/testing';
import { MarkdownEditorComponent } from './markdown-editor.component';

describe('MarkdownEditorComponent', () => {
  it('mounts CodeMirror and renders preview only through the sanitized renderer', async () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    await TestBed.configureTestingModule({ imports: [MarkdownEditorComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MarkdownEditorComponent);
    fixture.componentRef.setInput('ariaLabel', 'Markdown');
    fixture.componentRef.setInput('boldLabel', 'Bold');
    fixture.componentRef.setInput('editLabel', 'Edit');
    fixture.componentRef.setInput('previewLabel', 'Preview');
    fixture.componentRef.setInput('value', '# Safe\n<img src=x onerror="alert(1)">');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.cm-editor')).not.toBeNull();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    (buttons[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    const preview = fixture.nativeElement.querySelector('.markdown-editor-preview') as HTMLElement;
    expect(preview.querySelector('h1')?.textContent).toBe('Safe');
    expect(preview.innerHTML).not.toContain('onerror');
  });

  it('reconfigures CodeMirror when disabled changes after mount', async () => {
    await TestBed.configureTestingModule({ imports: [MarkdownEditorComponent] }).compileComponents();
    const fixture = TestBed.createComponent(MarkdownEditorComponent);
    fixture.componentRef.setInput('ariaLabel', 'Markdown');
    fixture.componentRef.setInput('boldLabel', 'Bold');
    fixture.componentRef.setInput('editLabel', 'Edit');
    fixture.componentRef.setInput('previewLabel', 'Preview');
    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();

    const content = () =>
      fixture.nativeElement.querySelector('.cm-content') as HTMLElement | null;
    const boldButton = () =>
      (fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)[2];
    expect(content()?.getAttribute('contenteditable')).toBe('true');
    expect(boldButton().disabled).toBe(false);

    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    expect(content()?.getAttribute('contenteditable')).toBe('false');
    expect(boldButton().disabled).toBe(true);

    fixture.componentRef.setInput('disabled', false);
    fixture.detectChanges();
    expect(content()?.getAttribute('contenteditable')).toBe('true');
    expect(boldButton().disabled).toBe(false);
  });
});
