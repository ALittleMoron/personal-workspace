import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../../core/i18n/translate.pipe';
import { SeoService } from '../../../../core/seo/seo.service';

@Component({
  selector: 'app-sitemap-page',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sitemap-page.component.html',
})
export class SitemapPageComponent implements OnInit {
  private readonly seoService = inject(SeoService);
  private readonly i18n = inject(I18nService);
  readonly language = computed(() => {
    const language = this.i18n.language();
    if (language === null) {
      throw new Error('I18n language is not initialized');
    }
    return language;
  });
  ngOnInit(): void {
    this.seoService.setTranslatedMeta({
      titleKey: 'sitemap.seo.title',
      descriptionKey: 'sitemap.seo.description',
      canonicalPath: '/sitemap',
    });
  }
}
