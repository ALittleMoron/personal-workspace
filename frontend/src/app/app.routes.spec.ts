import { FoundationPageComponent } from './features/foundation/foundation-page.component';
import { NotFoundPageComponent } from './features/not-found/not-found-page.component';
import { routes } from './app.routes';

describe('application routes', () => {
  it('contains only the foundation and not-found routes', () => {
    expect(routes).toEqual([
      { path: '', pathMatch: 'full', component: FoundationPageComponent },
      { path: '**', component: NotFoundPageComponent },
    ]);
  });
});
