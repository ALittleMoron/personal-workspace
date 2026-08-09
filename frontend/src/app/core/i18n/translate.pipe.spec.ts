import { TestBed } from '@angular/core/testing';
import { I18nService } from './i18n.service';
import { TranslatePipe } from './translate.pipe';

describe('TranslatePipe', () => {
  it('delegates translation and interpolation to I18nService', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: I18nService, useValue: { translate: jest.fn(() => 'Ready') } }],
    });

    const pipe = TestBed.runInInjectionContext(() => new TranslatePipe());
    expect(pipe.transform('foundation.title')).toBe('Ready');
  });
});
