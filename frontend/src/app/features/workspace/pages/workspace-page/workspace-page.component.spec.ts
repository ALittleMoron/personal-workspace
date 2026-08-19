import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ThemeName, ThemeService } from '../../../../core/layout/theme.service';
import { provideI18nTesting } from '../../../../testing/i18n-testing';
import { WorkspacePageComponent } from './workspace-page.component';

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('WorkspacePageComponent', () => {
  let fixture: ComponentFixture<WorkspacePageComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkspacePageComponent],
      providers: [
        provideRouter([{ path: '**', component: EmptyRouteComponent }]),
        provideI18nTesting(),
        {
          provide: ThemeService,
          useValue: { theme: signal<ThemeName>('light'), toggleTheme: jest.fn() },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    await router.navigateByUrl('/');
    fixture = TestBed.createComponent(WorkspacePageComponent);
    fixture.detectChanges();
  });

  it('renders the retained dashboard, workspace, and knowledge navigation', () => {
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Дашборд');
    expect(text).toContain('Рабочая область');
    expect(text).toContain('Резюме');
    expect(text).toContain('База знаний');
    expect(text).toContain('Люди');
    expect(text).toContain('Даты');
  });

  it('marks the most specific navigation item for a detail URL', async () => {
    await router.navigateByUrl('/knowledge/people/person-1');
    fixture.detectChanges();

    const peopleItem = navigationItem('Люди');
    const dashboardItem = navigationItem('Дашборд');

    expect(peopleItem.getAttribute('aria-current')).toBe('page');
    expect(peopleItem.getAttribute('aria-selected')).toBe('true');
    expect(dashboardItem.getAttribute('aria-current')).toBeNull();
  });

  it('closes the mobile panel after navigating to a selected workspace page', async () => {
    navigationItem('Даты').click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(router.url).toBe('/knowledge/dates');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('[data-testid="workspace-side-panel"]')
        ?.classList.contains('workspace-side-panel-closed'),
    ).toBe(true);
  });

  function navigationItem(label: string): HTMLButtonElement {
    const item = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '[data-testid="workspace-tree-item"]',
      ),
    ).find((candidate) => candidate.textContent?.includes(label));
    if (item === undefined) {
      throw new Error(`Missing navigation item: ${label}`);
    }
    return item;
  }
});
