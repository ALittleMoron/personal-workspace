import { Routes } from '@angular/router';
import { injectedPublicHomePath } from './core/routing/public-home';

export const routes: Routes = [
  { path: '', redirectTo: () => injectedPublicHomePath(), pathMatch: 'full' },
  {
    path: 'ru',
    children: publicRoutes(),
  },
  {
    path: 'en',
    children: publicRoutes(),
  },
  ...publicRoutes(),
  {
    path: '404',
    loadChildren: () =>
      import('./features/not-found/not-found.routes').then((m) => m.notFoundRoutes),
  },
  {
    path: 'admin-panel',
    loadChildren: () =>
      import('./features/admin-panel/admin-panel.routes').then((m) => m.adminPanelRoutes),
  },
  { path: '**', redirectTo: '404' },
];

function publicRoutes(): Routes {
  return [
    {
      path: 'updates',
      loadChildren: () => import('./features/updates/updates.routes').then((m) => m.updatesRoutes),
    },
    {
      path: 'how-this-site-is-built',
      loadChildren: () =>
        import('./features/site-case-study/site-case-study.routes').then(
          (m) => m.siteCaseStudyRoutes,
        ),
    },
  ];
}
