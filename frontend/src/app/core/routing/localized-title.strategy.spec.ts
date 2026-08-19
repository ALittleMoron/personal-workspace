import { Component, signal } from '@angular/core';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter, Router, TitleStrategy } from '@angular/router';
import { I18nService } from '../i18n/i18n.service';
import { LocalizedTitleStrategy } from './localized-title.strategy';

@Component({ template: '' })
class BlankPageComponent {}

describe('LocalizedTitleStrategy', () => {
  const language = signal<'ru' | 'en'>('ru');
  const messages: Record<'ru' | 'en', Record<string, string>> = {
    ru: { 'workspace.title': 'Рабочее пространство' },
    en: { 'workspace.title': 'Workspace' },
  };

  let router: Router;
  let title: Title;

  beforeEach(() => {
    language.set('ru');
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'workspace', title: 'workspace.title', component: BlankPageComponent },
          { path: 'public', component: BlankPageComponent },
        ]),
        {
          provide: I18nService,
          useValue: {
            language,
            translate: (key: string) => messages[language()][key] ?? key,
          },
        },
        { provide: TitleStrategy, useClass: LocalizedTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
  });

  it('translates the active route title and updates it when the language changes', fakeAsync(() => {
    void router.navigateByUrl('/workspace');
    tick();

    expect(title.getTitle()).toBe('Рабочее пространство');

    language.set('en');
    TestBed.flushEffects();

    expect(title.getTitle()).toBe('Workspace');
  }));

  it('does not overwrite the document title when the active route has no title', fakeAsync(() => {
    void router.navigateByUrl('/workspace');
    tick();
    void router.navigateByUrl('/public');
    tick();
    title.setTitle('Existing document title');

    language.set('en');
    TestBed.flushEffects();

    expect(title.getTitle()).toBe('Existing document title');
  }));
});
