import { AdminPanelNavigationSection } from './models/admin-panel-navigation.model';

export const ADMIN_PANEL_NAVIGATION_SECTIONS: readonly AdminPanelNavigationSection[] = [
  {
    key: 'workspace',
    labelKey: 'adminPanel.section.workspace',
    pages: [
      {
        key: 'resumes',
        labelKey: 'adminPanel.section.resumes',
        route: '/admin-panel/workspace/resumes',
        badgeTextKey: null,
      },
    ],
  },
  {
    key: 'knowledge',
    labelKey: 'adminPanel.section.knowledge',
    pages: [
      {
        key: 'knowledge-people',
        labelKey: 'adminPanel.section.people',
        route: '/admin-panel/knowledge/people',
        badgeTextKey: null,
      },
      {
        key: 'knowledge-dates',
        labelKey: 'adminPanel.section.dates',
        route: '/admin-panel/knowledge/dates',
        badgeTextKey: null,
      },
    ],
  },
];
