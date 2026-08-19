import { Routes } from '@angular/router';
import { authGuard, loginGuard, workspaceEntryGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: '',
    canActivate: [workspaceEntryGuard],
    loadComponent: () =>
      import('./core/auth/workspace-entry.component').then((m) => m.WorkspaceEntryComponent),
    pathMatch: 'full',
  },
  {
    path: 'login',
    canMatch: [loginGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.authRoutes),
  },
  {
    path: 'admin-panel',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/admin-panel/admin-panel.routes').then((m) => m.adminPanelRoutes),
  },
  {
    path: '**',
    canActivate: [authGuard],
    loadChildren: () =>
      import('./features/not-found/not-found.routes').then((m) => m.notFoundRoutes),
  },
];
