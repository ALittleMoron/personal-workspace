import { TestBed } from '@angular/core/testing';
import { provideI18nTesting } from '../../testing/i18n-testing';
import { FoundationPageComponent } from './foundation-page.component';

describe('FoundationPageComponent', () => {
  it('renders the backend-owned foundation text', async () => {
    await TestBed.configureTestingModule({
      imports: [FoundationPageComponent],
      providers: [provideI18nTesting()],
    }).compileComponents();
    const fixture = TestBed.createComponent(FoundationPageComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Personal Workspace');
    expect(fixture.nativeElement.textContent).toContain('Workspace is ready');
  });
});
