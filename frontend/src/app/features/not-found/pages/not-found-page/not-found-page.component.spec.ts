import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideI18nTesting } from '../../../../testing/i18n-testing';
import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  let fixture: ComponentFixture<NotFoundPageComponent>;
  let originalHead: string;
  let expectedHead: string;

  beforeEach(async () => {
    originalHead = document.head.innerHTML;
    document.head.insertAdjacentHTML(
      'beforeend',
      '<meta name="description" content="preserved by the page component">',
    );
    expectedHead = document.head.innerHTML;

    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [provideRouter([]), provideI18nTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.head.innerHTML = originalHead;
  });

  it('links back to the private workspace dashboard', () => {
    const link = fixture.nativeElement.querySelector('a') as HTMLAnchorElement | null;

    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe('/');
    expect(link?.textContent?.trim()).toBe('В рабочую область');
  });

  it('leaves document metadata ownership outside the page component', () => {
    expect(document.head.innerHTML).toBe(expectedHead);
  });
});
