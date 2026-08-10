import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'ru/how-this-site-is-built',
    renderMode: RenderMode.Server,
  },
  {
    path: 'en/how-this-site-is-built',
    renderMode: RenderMode.Server,
  },
  {
    path: 'ru/updates',
    renderMode: RenderMode.Server,
  },
  {
    path: 'en/updates',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
