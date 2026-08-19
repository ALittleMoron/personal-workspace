import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, RouterOutlet, Routes } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { workspaceRoutes } from './workspace.routes';
import { UnsavedChangesService } from './services/unsaved-changes.service';

@Component({ standalone: true, imports: [RouterOutlet], template: '<router-outlet />' })
class RouterHostComponent {}

@Component({ standalone: true, template: '' })
class EmptyRouteComponent {}

describe('workspaceRoutes', () => {
  let confirmDiscard: jest.Mock;
  let router: Router;

  beforeEach(() => {
    confirmDiscard = jest.fn(() => true);
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routesWithTestComponents()),
        {
          provide: UnsavedChangesService,
          useValue: { confirmDiscard },
        },
      ],
    });
    router = TestBed.inject(Router);
  });

  it('opens the dashboard directly at the workspace root', async () => {
    const harness = await RouterTestingHarness.create();

    await harness.navigateByUrl('/');
    expect(router.url).toBe('/');
  });

  it('navigates to every retained knowledge and resume workspace', async () => {
    const harness = await RouterTestingHarness.create();
    const destinations = [
      '/knowledge/people',
      '/knowledge/people/person-1',
      '/knowledge/dates',
      '/knowledge/dates/date-1',
      '/resumes',
      '/resumes/resume-1',
    ];

    for (const destination of destinations) {
      await harness.navigateByUrl(destination);
      expect(router.url).toBe(destination);
    }
  });

  it('cancels navigation away from a retained workspace when discard is rejected', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/knowledge/people');
    confirmDiscard.mockReturnValue(false);

    const navigated = await router.navigateByUrl('/knowledge/dates');

    expect(navigated).toBe(false);
    expect(router.url).toBe('/knowledge/people');
    expect(confirmDiscard).toHaveBeenCalledTimes(1);
  });
});

function routesWithTestComponents(): Routes {
  const workspaceRoute = workspaceRoutes[0];
  if (workspaceRoute === undefined) {
    throw new Error('Workspace route is missing.');
  }

  return [
    {
      path: '',
      children: [
        {
          ...workspaceRoute,
          component: RouterHostComponent,
          loadComponent: undefined,
          children: (workspaceRoute.children ?? []).map((route) =>
            route.redirectTo === undefined
              ? { ...route, component: EmptyRouteComponent, loadComponent: undefined }
              : route,
          ),
        },
      ],
    },
  ];
}
