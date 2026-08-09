import { Routes } from '@angular/router';
import { FoundationPageComponent } from './features/foundation/foundation-page.component';
import { NotFoundPageComponent } from './features/not-found/not-found-page.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: FoundationPageComponent },
  { path: '**', component: NotFoundPageComponent },
];
