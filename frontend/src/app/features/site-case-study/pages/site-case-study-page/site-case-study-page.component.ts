import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

interface ArchitectureBlock {
  readonly titleKey: string;
  readonly bodyKey: string;
  readonly technologies: readonly string[];
}

@Component({
  selector: 'app-site-case-study-page',
  standalone: true,
  imports: [TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './site-case-study-page.component.html',
  styleUrl: './site-case-study-page.component.scss',
})
export class SiteCaseStudyPageComponent {
  readonly architectureBlocks: readonly ArchitectureBlock[] = [
    {
      titleKey: 'siteBuild.architecture.backendTitle',
      bodyKey: 'siteBuild.architecture.backendBody',
      technologies: ['Litestar', 'SQLAlchemy', 'PostgreSQL', 'Dishka', 'TaskIQ'],
    },
    {
      titleKey: 'siteBuild.architecture.frontendTitle',
      bodyKey: 'siteBuild.architecture.frontendBody',
      technologies: ['Angular 22 CSR', 'Backend i18n bundles', 'Strict CSP', 'Bootstrap 5'],
    },
    {
      titleKey: 'siteBuild.architecture.infraTitle',
      bodyKey: 'siteBuild.architecture.infraBody',
      technologies: ['nginx', 'Docker', 'MinIO', 'Valkey', 'GitHub Actions'],
    },
  ];

  readonly decisionKeys: readonly string[] = [
    'siteBuild.decision.cleanArchitecture',
    'siteBuild.decision.deployManifest',
  ];
}
