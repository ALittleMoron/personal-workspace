import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="surface-card p-4 text-center" role="status">
      <h1 class="h3 mb-0">{{ 'error.notFound' | t }}</h1>
    </section>
  `,
})
export class NotFoundPageComponent {}
