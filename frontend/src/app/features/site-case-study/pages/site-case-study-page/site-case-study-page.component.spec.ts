import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideI18nTesting } from '../../../../testing/i18n-testing';
import { SiteCaseStudyPageComponent } from './site-case-study-page.component';

describe('SiteCaseStudyPageComponent', () => {
  let fixture: ComponentFixture<SiteCaseStudyPageComponent>;
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
      imports: [SiteCaseStudyPageComponent],
      providers: [
        provideRouter([]),
        provideI18nTesting({
          'siteBuild.architecture.title': 'Architecture',
          'siteBuild.architecture.backendTitle': 'Backend',
          'siteBuild.architecture.backendBody': 'Backend services.',
          'siteBuild.architecture.frontendTitle': 'Frontend',
          'siteBuild.architecture.frontendBody': 'Angular CSR with strict CSP.',
          'siteBuild.architecture.infraTitle': 'Infrastructure',
          'siteBuild.architecture.infraBody': 'Infrastructure services.',
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SiteCaseStudyPageComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    document.head.innerHTML = originalHead;
  });

  it('renders the frontend architecture block between backend and infrastructure', () => {
    const titles = Array.from(
      fixture.nativeElement.querySelectorAll('.site-case-study__card h3'),
      (heading: HTMLHeadingElement) => heading.textContent?.trim(),
    );

    expect(titles).toEqual(['Backend', 'Frontend', 'Infrastructure']);
    expect(fixture.nativeElement.textContent).toContain('Angular CSR with strict CSP.');
  });

  it('leaves document metadata ownership outside the page component', () => {
    expect(document.head.innerHTML).toBe(expectedHead);
  });
});
