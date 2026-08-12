import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { provideI18nTesting } from '../../../../testing/i18n-testing';
import { UpdatesPageComponent } from './updates-page.component';

describe('UpdatesPageComponent', () => {
  let fixture: ComponentFixture<UpdatesPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UpdatesPageComponent],
      providers: [provideI18nTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdatesPageComponent);
    fixture.detectChanges();
  });

  it('connects every rendered month and entry to its accessible heading', () => {
    const element = fixture.nativeElement as HTMLElement;
    const months = element.querySelectorAll<HTMLTimeElement>('time[datetime]');
    const entries = element.querySelectorAll<HTMLElement>('article[aria-labelledby]');

    expect(months.length).toBeGreaterThan(0);
    expect(entries.length).toBeGreaterThan(0);
    for (const month of months) {
      const labelId = month.id;
      expect(labelId).not.toBe('');
      expect(month.closest('section')?.getAttribute('aria-labelledby')).toBe(labelId);
    }
    for (const entry of entries) {
      const labelId = entry.getAttribute('aria-labelledby');
      expect(labelId).not.toBeNull();
      expect(element.querySelector(`#${labelId}`)?.textContent?.trim()).not.toBe('');
    }
  });

  it('updates authored titles and month labels when the interface language changes', () => {
    const i18n = TestBed.inject(I18nService);
    const russianMonth = firstText('time[datetime]');
    const russianTitle = firstText('article[aria-labelledby] h3');

    i18n.switchLanguage('en').subscribe();
    fixture.detectChanges();

    expect(firstText('time[datetime]')).not.toBe(russianMonth);
    expect(firstText('article[aria-labelledby] h3')).not.toBe(russianTitle);
  });

  function firstText(selector: string): string {
    const text = (fixture.nativeElement as HTMLElement)
      .querySelector(selector)
      ?.textContent?.trim();
    if (!text) {
      throw new Error(`Missing text for ${selector}.`);
    }
    return text;
  }
});
