import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-foundation-page',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="surface-card p-4 p-md-5 shadow-sm" aria-labelledby="foundation-title">
      <p class="text-body-secondary mb-2">{{ 'app.name' | t }}</p>
      <h1 id="foundation-title" class="display-6 mb-3">{{ 'foundation.title' | t }}</h1>
      <p class="lead mb-0">{{ 'foundation.description' | t }}</p>
    </section>
  `,
})
export class FoundationPageComponent {}
