import { CSP_NONCE } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { provideI18nTesting } from '../../testing/i18n-testing';
import { ModalPageScrollLockService } from '../layout/modal-page-scroll-lock.service';
import { WikiLinkTargetsService } from '../wiki-links/wiki-link-targets.service';
import { createWikiLinkTargetRegistry } from '../wiki-links/wiki-links';
import {
  MarkdownEditorComponent,
  MarkdownEditorImageCapability,
} from './markdown-editor.component';

const FIRST_MARKDOWN_URL =
  '/api/admin/knowledge/files/11111111111111111111111111111111/content#fileId=11111111111111111111111111111111';
const SECOND_MARKDOWN_URL =
  '/api/admin/knowledge/files/22222222222222222222222222222222/content#fileId=22222222222222222222222222222222';
const ACCEPTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

describe('MarkdownEditorComponent image capability', () => {
  let fixture: ComponentFixture<MarkdownEditorComponent>;
  let createObjectUrlDescriptor: PropertyDescriptor | undefined;
  let revokeObjectUrlDescriptor: PropertyDescriptor | undefined;

  beforeEach(async () => {
    createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(window.URL, 'createObjectURL');
    revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(window.URL, 'revokeObjectURL');
    await TestBed.configureTestingModule({
      imports: [MarkdownEditorComponent],
      providers: [
        provideI18nTesting(),
        { provide: CSP_NONCE, useValue: null },
        {
          provide: WikiLinkTargetsService,
          useValue: { getTargets: () => of(createWikiLinkTargetRegistry([])) },
        },
        {
          provide: ModalPageScrollLockService,
          useValue: { acquire: () => (): void => undefined },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    fixture?.destroy();
    restoreUrlMethod('createObjectURL', createObjectUrlDescriptor);
    restoreUrlMethod('revokeObjectURL', revokeObjectUrlDescriptor);
    jest.restoreAllMocks();
  });

  it('hides picker and image commands and leaves image paste alone when capability is null', () => {
    createFixture(null);
    const paste = imagePasteEvent(new File(['image'], 'disabled.png', { type: 'image/png' }));

    editorContent().dispatchEvent(paste);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-markdown-command="image"]')).toBeNull();
    expect(editorContent().textContent).toBe('');
  });

  it('queues picker files in stable order and inserts their Markdown at the captured position', () => {
    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    const capability = capabilityWithUploads([FIRST_MARKDOWN_URL, SECOND_MARKDOWN_URL]);
    const values: string[] = [];
    createFixture(capability, 'tail');
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));
    const imageButton = fixture.nativeElement.querySelector(
      '[data-markdown-command="image"]',
    ) as HTMLButtonElement;
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const click = jest.spyOn(input, 'click').mockImplementation();

    imageButton.click();
    setInputFiles(input, [first, second]);
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(click).toHaveBeenCalledTimes(1);
    expect(capability.upload).toHaveBeenNthCalledWith(1, first);
    expect(capability.upload).toHaveBeenNthCalledWith(2, second);
    expect(values.at(-1)).toBe(
      `![first.png](${FIRST_MARKDOWN_URL})![second.png](${SECOND_MARKDOWN_URL})tail`,
    );
  });

  it('reports a pending upload until its Markdown has been inserted', () => {
    const upload = new Subject<{ markdownUrl: string }>();
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => upload),
      loadPreview: jest.fn(() => throwError(() => new Error('not used'))),
    };
    const pending: boolean[] = [];
    const values: string[] = [];
    createFixture(capability);
    fixture.componentInstance.imageUploadPendingChange.subscribe((value) => pending.push(value));
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    setInputFiles(input, [new File(['image'], 'pending.png', { type: 'image/png' })]);
    input.dispatchEvent(new Event('change'));

    expect(pending).toEqual([true]);
    upload.next({ markdownUrl: FIRST_MARKDOWN_URL });

    expect(values.at(-1)).toBe(`![pending.png](${FIRST_MARKDOWN_URL})`);
    expect(pending).toEqual([true, false]);
  });

  it('uses the capability MIME contract and rejects an unsupported image without retry', () => {
    const capability = capabilityWithUploads([FIRST_MARKDOWN_URL]);
    createFixture(capability);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const paste = imagePasteEvent(new File(['gif'], 'animated.gif', { type: 'image/gif' }));

    expect(input.accept).toBe('image/jpeg,image/png,image/webp');
    editorContent().dispatchEvent(paste);
    fixture.detectChanges();

    expect(paste.defaultPrevented).toBe(true);
    expect(capability.upload).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-unsupported-image"]')
        .textContent,
    ).toContain('animated.gif');
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-upload-retry"]'),
    ).toBeNull();
  });

  it('consumes an unsupported image drop and reports it without starting an upload', () => {
    const capability = capabilityWithUploads([FIRST_MARKDOWN_URL]);
    createFixture(capability);
    const drop = imageDropEvent(new File(['gif'], 'dropped.gif', { type: 'image/gif' }));

    editorContent().dispatchEvent(drop);
    fixture.detectChanges();

    expect(drop.defaultPrevented).toBe(true);
    expect(capability.upload).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-unsupported-image"]')
        .textContent,
    ).toContain('dropped.gif');
  });

  it('uploads pasted images and consumes only the handled paste event', () => {
    const file = new File(['pasted'], 'pasted.png', { type: 'image/png' });
    const capability = capabilityWithUploads([FIRST_MARKDOWN_URL]);
    const values: string[] = [];
    createFixture(capability);
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));
    const paste = imagePasteEvent(file);

    editorContent().dispatchEvent(paste);
    fixture.detectChanges();

    expect(paste.defaultPrevented).toBe(true);
    expect(capability.upload).toHaveBeenCalledWith(file);
    expect(values.at(-1)).toBe(`![pasted.png](${FIRST_MARKDOWN_URL})`);
  });

  it('uploads dropped images and consumes only the handled drop event', () => {
    const file = new File(['dropped'], 'dropped.png', { type: 'image/png' });
    const capability = capabilityWithUploads([FIRST_MARKDOWN_URL]);
    const values: string[] = [];
    createFixture(capability);
    fixture.componentInstance.valueChange.subscribe((value) => values.push(value));
    const drop = imageDropEvent(file);

    editorContent().dispatchEvent(drop);
    fixture.detectChanges();

    expect(drop.defaultPrevented).toBe(true);
    expect(capability.upload).toHaveBeenCalledWith(file);
    expect(values.at(-1)).toBe(`![dropped.png](${FIRST_MARKDOWN_URL})`);
  });

  it('leaves picker, paste, and drop inactive while upload interactions are disabled', () => {
    const file = new File(['image'], 'disabled.png', { type: 'image/png' });
    const capability = capabilityWithUploads([FIRST_MARKDOWN_URL]);
    createFixture(capability);
    fixture.componentRef.setInput('uploadInteractionsDisabled', true);
    fixture.detectChanges();
    const imageButton = fixture.nativeElement.querySelector(
      '[data-markdown-command="image"]',
    ) as HTMLButtonElement;
    const toolbarButtons = Array.from(
      fixture.nativeElement.querySelectorAll<HTMLButtonElement>('[data-markdown-command]'),
    );
    const imageButtonIndex = toolbarButtons.indexOf(imageButton);
    const previousButton = toolbarButtons[imageButtonIndex - 1]!;
    const nextButton = toolbarButtons[0]!;
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const paste = imagePasteEvent(file);
    const drop = imageDropEvent(file);

    setInputFiles(input, [file]);
    input.dispatchEvent(new Event('change'));
    editorContent().dispatchEvent(paste);
    editorContent().dispatchEvent(drop);
    previousButton.focus();
    previousButton.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true, cancelable: true }),
    );

    expect(imageButton.disabled).toBe(true);
    expect(input.disabled).toBe(true);
    expect(capability.upload).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(nextButton);
  });

  it('shows a retryable failure without advancing later queued uploads', () => {
    const first = new File(['first'], 'first.png', { type: 'image/png' });
    const second = new File(['second'], 'second.png', { type: 'image/png' });
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest
        .fn()
        .mockReturnValueOnce(throwError(() => new Error('upload failed')))
        .mockReturnValueOnce(of({ markdownUrl: FIRST_MARKDOWN_URL }))
        .mockReturnValueOnce(of({ markdownUrl: SECOND_MARKDOWN_URL })),
      loadPreview: jest.fn(() => throwError(() => new Error('not used'))),
    };
    createFixture(capability);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;

    setInputFiles(input, [first, second]);
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(capability.upload).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-upload-error"]')
        .textContent,
    ).toContain('first.png');

    (
      fixture.nativeElement.querySelector(
        '[data-testid="markdown-editor-upload-retry"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();

    expect(capability.upload).toHaveBeenCalledTimes(3);
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-upload-error"]'),
    ).toBeNull();
  });

  it('keeps protected preview Blobs active while upload interactions are disabled', () => {
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => throwError(() => new Error('not used'))),
      loadPreview: jest.fn(() => of(new Blob(['private'], { type: 'image/webp' }))),
    };
    const createObjectURL = jest.fn(() => 'blob:active-while-disabled');
    const revokeObjectURL = jest.fn();
    defineUrlMethods(createObjectURL, revokeObjectURL);
    createFixture(capability, `![Private](${FIRST_MARKDOWN_URL})`);
    selectPreview();

    fixture.componentRef.setInput('uploadInteractionsDisabled', true);
    fixture.detectChanges();

    expect(previewImage().getAttribute('src')).toBe('blob:active-while-disabled');
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-preview-content"]')
        .innerHTML,
    ).not.toContain(FIRST_MARKDOWN_URL);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('does not queue a failed upload retry while interactions are disabled', () => {
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest
        .fn()
        .mockReturnValueOnce(throwError(() => new Error('upload failed')))
        .mockReturnValueOnce(of({ markdownUrl: FIRST_MARKDOWN_URL })),
      loadPreview: jest.fn(() => throwError(() => new Error('not used'))),
    };
    createFixture(capability);
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    setInputFiles(input, [new File(['image'], 'retry.png', { type: 'image/png' })]);
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    fixture.componentRef.setInput('uploadInteractionsDisabled', true);
    fixture.detectChanges();
    const retry = fixture.nativeElement.querySelector(
      '[data-testid="markdown-editor-upload-retry"]',
    ) as HTMLButtonElement;
    retry.click();

    expect(retry.disabled).toBe(true);
    expect(capability.upload).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('uploadInteractionsDisabled', false);
    fixture.detectChanges();
    retry.click();
    fixture.detectChanges();

    expect(capability.upload).toHaveBeenCalledTimes(2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-upload-error"]'),
    ).toBeNull();
  });

  it('revokes and revalidates an active preview when its backing attachment revision changes', () => {
    let attachmentAvailable = true;
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => throwError(() => new Error('not used'))),
      loadPreview: jest.fn(() =>
        attachmentAvailable
          ? of(new Blob(['private'], { type: 'image/webp' }))
          : throwError(() => new Error('attachment removed')),
      ),
    };
    const createObjectURL = jest.fn(() => 'blob:deleted-attachment');
    const revokeObjectURL = jest.fn();
    defineUrlMethods(createObjectURL, revokeObjectURL);
    createFixture(capability, `![Private](${FIRST_MARKDOWN_URL})`);
    selectPreview();

    attachmentAvailable = false;
    fixture.componentRef.setInput('imagePreviewRevision', 1);
    fixture.detectChanges();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:deleted-attachment');
    expect(previewImage().getAttribute('src')).toBeNull();
    expect(capability.loadPreview).toHaveBeenCalledTimes(2);
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-preview-image-error"]'),
    ).not.toBeNull();
  });

  it('loads protected preview images as Blobs without exposing their source URL in the DOM', () => {
    const previewBlob = new Subject<Blob>();
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => throwError(() => new Error('not used'))),
      loadPreview: jest.fn(() => previewBlob),
    };
    const createObjectURL = jest.fn(() => 'blob:protected-preview');
    const revokeObjectURL = jest.fn();
    defineUrlMethods(createObjectURL, revokeObjectURL);
    createFixture(capability, `![Private](${FIRST_MARKDOWN_URL})`);

    selectPreview();
    const image = previewImage();
    expect(image.getAttribute('src')).toBeNull();
    expect(capability.loadPreview).toHaveBeenCalledWith(FIRST_MARKDOWN_URL);

    previewBlob.next(new Blob(['private'], { type: 'image/webp' }));

    expect(image.getAttribute('src')).toBe('blob:protected-preview');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).not.toHaveBeenCalled();
  });

  it('revokes and reloads protected preview images when the rendering language changes', () => {
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => throwError(() => new Error('not used'))),
      loadPreview: jest.fn(() => of(new Blob(['private'], { type: 'image/webp' }))),
    };
    const createObjectURL = jest
      .fn()
      .mockReturnValueOnce('blob:russian-preview')
      .mockReturnValueOnce('blob:english-preview');
    const revokeObjectURL = jest.fn();
    defineUrlMethods(createObjectURL, revokeObjectURL);
    createFixture(capability, `![Private](${FIRST_MARKDOWN_URL})`);
    selectPreview();

    fixture.componentRef.setInput('language', 'en');
    fixture.detectChanges();

    expect(revokeObjectURL).toHaveBeenCalledWith('blob:russian-preview');
    expect(capability.loadPreview).toHaveBeenCalledTimes(2);
    expect(previewImage().getAttribute('src')).toBe('blob:english-preview');
  });

  it('keeps successful preview siblings visible and retries only the failed image', () => {
    const failedPreview = new Subject<Blob>();
    const retriedPreview = new Subject<Blob>();
    let secondAttempts = 0;
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => throwError(() => new Error('not used'))),
      loadPreview: jest.fn((source: string) => {
        if (source === FIRST_MARKDOWN_URL) {
          return of(new Blob(['first'], { type: 'image/webp' }));
        }
        secondAttempts += 1;
        return secondAttempts === 1 ? failedPreview : retriedPreview;
      }),
    };
    const createObjectURL = jest
      .fn()
      .mockReturnValueOnce('blob:first-sibling')
      .mockReturnValueOnce('blob:retried-sibling');
    const revokeObjectURL = jest.fn();
    defineUrlMethods(createObjectURL, revokeObjectURL);
    createFixture(capability, `![First](${FIRST_MARKDOWN_URL})\n![Second](${SECOND_MARKDOWN_URL})`);
    selectPreview();
    const images = fixture.nativeElement.querySelectorAll(
      '[data-testid="markdown-editor-preview-content"] img',
    ) as NodeListOf<HTMLImageElement>;

    failedPreview.error(new Error('preview failed'));
    fixture.detectChanges();

    expect(images.item(0).getAttribute('src')).toBe('blob:first-sibling');
    expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:first-sibling');
    const error = fixture.nativeElement.querySelector(
      '[data-testid="markdown-editor-preview-image-error"]',
    ) as HTMLElement;
    expect(error.textContent).toContain('Не удалось загрузить изображение для предпросмотра.');

    (
      error.querySelector(
        '[data-testid="markdown-editor-preview-image-retry"]',
      ) as HTMLButtonElement
    ).click();
    retriedPreview.next(new Blob(['second'], { type: 'image/webp' }));
    fixture.detectChanges();

    expect(images.item(1).getAttribute('src')).toBe('blob:retried-sibling');
    expect(
      fixture.nativeElement.querySelector('[data-testid="markdown-editor-preview-image-error"]'),
    ).toBeNull();
  });

  it('revokes superseded, removed, failed, and destroyed preview object URLs', () => {
    const firstBlob = new Subject<Blob>();
    const secondBlob = new Subject<Blob>();
    const capability: MarkdownEditorImageCapability = {
      acceptedMimeTypes: ACCEPTED_MIME_TYPES,
      upload: jest.fn(() => throwError(() => new Error('not used'))),
      loadPreview: jest.fn((source: string) =>
        source === FIRST_MARKDOWN_URL ? firstBlob : secondBlob,
      ),
    };
    const createObjectURL = jest
      .fn()
      .mockReturnValueOnce('blob:first')
      .mockReturnValueOnce('blob:second')
      .mockReturnValueOnce('blob:third')
      .mockReturnValueOnce('blob:destroyed');
    const revokeObjectURL = jest.fn();
    defineUrlMethods(createObjectURL, revokeObjectURL);
    createFixture(capability, `![First](${FIRST_MARKDOWN_URL})`);
    selectPreview();
    firstBlob.next(new Blob(['first']));

    fixture.componentRef.setInput('value', `![Second](${SECOND_MARKDOWN_URL})`);
    fixture.detectChanges();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:first');
    secondBlob.next(new Blob(['second']));

    fixture.componentRef.setInput('value', 'No image');
    fixture.detectChanges();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:second');

    fixture.componentRef.setInput(
      'value',
      `![First again](${FIRST_MARKDOWN_URL})\n![Failure](${SECOND_MARKDOWN_URL})`,
    );
    fixture.detectChanges();
    firstBlob.next(new Blob(['third']));
    secondBlob.error(new Error('preview failed'));
    expect(revokeObjectURL).not.toHaveBeenCalledWith('blob:third');

    fixture.componentRef.setInput('value', `![Active](${FIRST_MARKDOWN_URL})`);
    fixture.detectChanges();
    firstBlob.next(new Blob(['destroyed']));
    fixture.destroy();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:destroyed');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:third');
    expect(revokeObjectURL).toHaveBeenCalledTimes(4);
  });

  it('keeps preview output on the centralized sanitizer boundary', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    createFixture(
      null,
      [
        '<script>alert("script")</script>',
        '<img src="x" onerror="alert(1)">',
        '<a href="javascript:alert(2)">bad link</a>',
      ].join('\n'),
    );

    selectPreview();
    const html = (
      fixture.nativeElement.querySelector(
        '[data-testid="markdown-editor-preview-content"]',
      ) as HTMLElement
    ).innerHTML;

    expect(html).not.toContain('<script');
    expect(html).not.toContain('onerror');
    expect(html).not.toMatch(/href=["']javascript:/i);
    expect(warn).toHaveBeenCalled();
  });

  function createFixture(capability: MarkdownEditorImageCapability | null, value = ''): void {
    fixture = TestBed.createComponent(MarkdownEditorComponent);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('language', 'ru');
    fixture.componentRef.setInput('accessibleLabel', 'Description');
    fixture.componentRef.setInput('imageCapability', capability);
    fixture.componentRef.setInput('uploadInteractionsDisabled', false);
    fixture.componentRef.setInput('imagePreviewRevision', 0);
    fixture.detectChanges();
  }

  function editorContent(): HTMLElement {
    return fixture.nativeElement.querySelector('.cm-content') as HTMLElement;
  }

  function selectPreview(): void {
    (
      fixture.nativeElement.querySelector(
        '[data-testid="markdown-editor-preview-tab"]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
  }

  function previewImage(): HTMLImageElement {
    return fixture.nativeElement.querySelector(
      '[data-testid="markdown-editor-preview-content"] img',
    ) as HTMLImageElement;
  }
});

function capabilityWithUploads(markdownUrls: readonly string[]): MarkdownEditorImageCapability & {
  upload: jest.Mock;
} {
  let index = 0;
  return {
    acceptedMimeTypes: ACCEPTED_MIME_TYPES,
    upload: jest.fn(() => of({ markdownUrl: markdownUrls[index++]! })),
    loadPreview: jest.fn(() => throwError(() => new Error('not used'))),
  };
}

function setInputFiles(input: HTMLInputElement, files: readonly File[]): void {
  Object.defineProperty(input, 'files', {
    configurable: true,
    value: files,
  });
}

function imagePasteEvent(file: File): ClipboardEvent {
  const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: () => '',
      items: [
        {
          kind: 'file',
          type: file.type,
          getAsFile: () => file,
        },
      ],
    },
  });
  return event;
}

function imageDropEvent(file: File): DragEvent {
  const event = new Event('drop', { bubbles: true, cancelable: true }) as DragEvent;
  Object.defineProperties(event, {
    clientX: { value: 0 },
    clientY: { value: 0 },
    dataTransfer: {
      value: {
        files: [file],
        items: [{ kind: 'file', type: file.type }],
      },
    },
  });
  return event;
}

function defineUrlMethods(createObjectURL: jest.Mock, revokeObjectURL: jest.Mock): void {
  Object.defineProperty(window.URL, 'createObjectURL', {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(window.URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURL,
  });
}

function restoreUrlMethod(
  name: 'createObjectURL' | 'revokeObjectURL',
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor === undefined) {
    Reflect.deleteProperty(window.URL, name);
    return;
  }
  Object.defineProperty(window.URL, name, descriptor);
}
