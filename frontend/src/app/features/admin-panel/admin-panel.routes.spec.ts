import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { adminPanelRoutes } from './admin-panel.routes';
import { AdminUnsavedChangesService } from './services/admin-unsaved-changes.service';

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class RouterHostComponent {}

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('adminPanelRoutes', () => {
  let confirmDiscard: jest.Mock;
  let router: Router;

  beforeEach(() => {
    confirmDiscard = jest.fn(() => true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routesWithTestComponents()),
        {
          provide: AdminUnsavedChangesService,
          useValue: { confirmDiscard },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('opens the dashboard from both admin workspace entry URLs', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/admin-panel');
    expect(router.url).toBe('/admin-panel/dashboard');

    await harness.navigateByUrl('/admin-panel/workspace/tools');
    expect(router.url).toBe('/admin-panel/dashboard');
  });

  it('navigates to every retained knowledge and resume workspace', async () => {
    const harness = await RouterTestingHarness.create();
    const destinations = [
      '/admin-panel/knowledge/people',
      '/admin-panel/knowledge/people/person-1',
      '/admin-panel/knowledge/dates',
      '/admin-panel/knowledge/dates/date-1',
      '/admin-panel/workspace/resumes',
      '/admin-panel/workspace/resumes/resume-1',
    ];

    for (const destination of destinations) {
      await harness.navigateByUrl(destination);
      expect(router.url).toBe(destination);
    }
  });

  it('cancels navigation away from a retained workspace when discard is rejected', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/admin-panel/knowledge/people');
    confirmDiscard.mockReturnValue(false);

    const navigated = await router.navigateByUrl('/admin-panel/knowledge/dates');

    expect(navigated).toBe(false);
    expect(router.url).toBe('/admin-panel/knowledge/people');
    expect(confirmDiscard).toHaveBeenCalledTimes(1);
  });
});

function routesWithTestComponents(): Routes {
  const adminRoute = adminPanelRoutes[0];
  if (adminRoute === undefined) {
    throw new Error('Admin panel route is missing.');
  }

  return [
    {
      path: 'admin-panel',
      children: [
        {
          ...adminRoute,
          component: RouterHostComponent,
          loadComponent: undefined,
          children: (adminRoute.children ?? []).map((route) =>
            route.redirectTo === undefined
              ? { ...route, component: EmptyRouteComponent, loadComponent: undefined }
              : route,
          ),
        },
      ],
    },
  ];
}
