import { Routes } from '@angular/router';
import { adminUnsavedChangesGuard } from './guards/admin-unsaved-changes.guard';

export const adminPanelRoutes: Routes = [
  {
    path: '',
    title: 'adminPanel.title',
    loadComponent: () =>
      import('./pages/admin-panel-page/admin-panel-page.component').then(
        (m) => m.AdminPanelPageComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'dashboard.title',
        loadComponent: () =>
          import('./pages/dashboard-page.component').then((m) => m.DashboardPageComponent),
      },
      {
        path: 'knowledge/people',
        title: 'knowledgePeople.title',
        canDeactivate: [adminUnsavedChangesGuard],
        loadComponent: () =>
          import('./knowledge/people/pages/people-list/people-list.component').then(
            (m) => m.PeopleListComponent,
          ),
      },
      {
        path: 'knowledge/people/:id',
        title: 'knowledgePeople.detailTitle',
        canDeactivate: [adminUnsavedChangesGuard],
        loadComponent: () =>
          import('./knowledge/people/pages/person-detail/person-detail.component').then(
            (m) => m.PersonDetailComponent,
          ),
      },
      {
        path: 'knowledge/dates',
        title: 'knowledgeDates.title',
        canDeactivate: [adminUnsavedChangesGuard],
        loadComponent: () =>
          import('./knowledge/dates/pages/dates-list/dates-list.component').then(
            (m) => m.DatesListComponent,
          ),
      },
      {
        path: 'knowledge/dates/:id',
        title: 'knowledgeDates.detailTitle',
        canDeactivate: [adminUnsavedChangesGuard],
        loadComponent: () =>
          import('./knowledge/dates/pages/date-detail/date-detail.component').then(
            (m) => m.DateDetailComponent,
          ),
      },
      { path: 'workspace/tools', pathMatch: 'full', redirectTo: '/admin-panel/dashboard' },
      {
        path: 'workspace/resumes',
        title: 'adminResumeWorkspace.title',
        canDeactivate: [adminUnsavedChangesGuard],
        loadComponent: () =>
          import('./pages/resumes-page/resumes-page.component').then(
            (m) => m.AdminResumesPageComponent,
          ),
      },
      {
        path: 'workspace/resumes/:id',
        title: 'adminResumeWorkspace.detailTitle',
        canDeactivate: [adminUnsavedChangesGuard],
        loadComponent: () =>
          import('./pages/resume-detail-page/resume-detail-page.component').then(
            (m) => m.AdminResumeDetailPageComponent,
          ),
      },
    ],
  },
];
