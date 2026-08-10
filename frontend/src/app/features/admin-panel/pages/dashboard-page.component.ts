import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../core/i18n/i18n.service';
import { TranslatePipe } from '../../../core/i18n/translate.pipe';
import { ApiError } from '../../../core/models/api-error.model';
import { EmptyStateComponent } from '../../../shared/ui/empty-state/empty-state.component';
import { ErrorMessageComponent } from '../../../shared/ui/error-message/error-message.component';
import { LoadingSpinnerComponent } from '../../../shared/ui/loading-spinner/loading-spinner.component';
import { DashboardFoldableSectionComponent } from '../components/dashboard-foldable-section/dashboard-foldable-section.component';
import { AdminToolsWidgetComponent } from '../components/admin-tools-widget/admin-tools-widget.component';
import { MonthCalendarWidgetComponent } from '../components/month-calendar-widget/month-calendar-widget.component';
import { formatAnnualDate } from '../knowledge/shared/annual-date';
import { Calendar, CalendarEntry } from '../models/calendar.model';
import { CalendarService } from '../services/calendar.service';

type DashboardSectionKey = 'upcoming-dates' | 'month-calendar' | 'tools';

type DashboardTabKey = 'home' | 'month-calendar' | 'tools';

interface DashboardTabDefinition {
  key: DashboardTabKey;
  labelKey: string;
}

const MANAGER_DASHBOARD_TABS: readonly DashboardTabDefinition[] = [
  { key: 'home', labelKey: 'dashboard.home.title' },
  { key: 'month-calendar', labelKey: 'dashboard.calendar.title' },
  { key: 'tools', labelKey: 'dashboard.tools.title' },
];

const MANAGER_DASHBOARD_SECTIONS: readonly DashboardSectionKey[] = [
  'upcoming-dates',
  'month-calendar',
  'tools',
];

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    RouterLink,
    TranslatePipe,
    EmptyStateComponent,
    ErrorMessageComponent,
    LoadingSpinnerComponent,
    DashboardFoldableSectionComponent,
    MonthCalendarWidgetComponent,
    AdminToolsWidgetComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.scss',
})
export class DashboardPageComponent implements OnInit {
  private readonly calendarService = inject(CalendarService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private upcomingLoadGeneration = 0;

  @ViewChild(MonthCalendarWidgetComponent)
  private monthCalendarWidget: MonthCalendarWidgetComponent | undefined;
  @ViewChild(AdminToolsWidgetComponent)
  private adminToolsWidget: AdminToolsWidgetComponent | undefined;

  readonly upcomingCalendar = signal<Calendar | null>(null);
  readonly upcomingLoading = signal(false);
  readonly upcomingError = signal<ApiError | null>(null);
  readonly monthCalendarSummary = signal<string | null>(null);
  readonly toolsStatusSummary = signal<string | null>(null);
  readonly activeTab = signal<DashboardTabKey>('home');
  readonly tabs = signal<readonly DashboardTabDefinition[]>(MANAGER_DASHBOARD_TABS);
  readonly collapsedSectionKeys = signal<ReadonlySet<string>>(new Set<string>());
  readonly knownSectionKeys = signal<readonly DashboardSectionKey[]>(MANAGER_DASHBOARD_SECTIONS);
  readonly datesSummary = computed(() => {
    this.i18n.language();
    const summary = this.upcomingCalendar()?.summary;
    return `${this.i18n.translate('dashboard.dates.type.memorableDate')}: ${summary?.memorableDateCount ?? 0} · ${this.i18n.translate('dashboard.dates.type.birthday')}: ${summary?.birthdayCount ?? 0}`;
  });
  readonly calendarPanelSummary = computed(() => {
    this.i18n.language();
    return this.monthCalendarSummary() ?? this.i18n.translate('dashboard.calendar.loadingSummary');
  });
  readonly toolsPanelSummary = computed(() => {
    this.i18n.language();
    return this.toolsStatusSummary() ?? this.i18n.translate('dashboard.tools.summary');
  });
  ngOnInit(): void {
    this.loadUpcomingDates();
  }

  loadDashboard(): void {
    this.loadUpcomingDates();
    this.monthCalendarWidget?.loadSelectedMonth();
    this.adminToolsWidget?.loadCacheStatus();
  }

  loadUpcomingDates(): void {
    const generation = ++this.upcomingLoadGeneration;
    this.upcomingLoading.set(true);
    this.upcomingError.set(null);
    this.calendarService
      .getCalendar(browserLocalDate(new Date()), 'currentAndNextMonths')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (calendar) => {
          if (generation !== this.upcomingLoadGeneration) return;
          this.upcomingCalendar.set(calendar);
          this.upcomingLoading.set(false);
        },
        error: (error: ApiError) => {
          if (generation !== this.upcomingLoadGeneration) return;
          this.upcomingError.set(error);
          this.upcomingLoading.set(false);
        },
      });
  }

  isSectionExpanded(sectionKey: DashboardSectionKey): boolean {
    return !this.collapsedSectionKeys().has(sectionKey);
  }

  setSectionExpanded(sectionKey: DashboardSectionKey, expanded: boolean): void {
    if (!this.knownSectionKeys().includes(sectionKey)) return;
    this.collapsedSectionKeys.update((current) => {
      const next = new Set(current);
      if (expanded) {
        next.delete(sectionKey);
      } else {
        next.add(sectionKey);
      }
      return next;
    });
  }

  setActiveTab(tabKey: DashboardTabKey): void {
    if (!this.tabs().some((tab) => tab.key === tabKey)) return;
    this.activeTab.set(tabKey);
  }

  tabId(tabKey: DashboardTabKey): string {
    return `dashboard-tab-${tabKey}`;
  }

  tabPanelId(tabKey: DashboardTabKey): string {
    return `dashboard-tabpanel-${tabKey}`;
  }

  annualDateLabel(entry: CalendarEntry): string {
    return formatAnnualDate(
      { day: entry.annualDate.day, month: entry.annualDate.month, year: null },
      this.i18n.dateLocale(),
    );
  }

  entryRoute(entry: CalendarEntry): readonly string[] {
    if (entry.kind === 'memorableDate') {
      return ['/admin-panel/knowledge/dates', entry.id];
    }
    return ['/admin-panel/knowledge/people', entry.id];
  }

  additionalInfoItems(entry: CalendarEntry): readonly string[] {
    const items: string[] = [];
    if (entry.period === 'nextMonth') {
      items.push(this.i18n.translate('dashboard.dates.nextMonth'));
    }
    if (entry.annualDate.year !== null) {
      const years = entry.occurrenceYear - entry.annualDate.year;
      if (years >= 0) {
        const category = new Intl.PluralRules(this.i18n.dateLocale()).select(years);
        const suffix = pluralSuffix(category);
        const prefix = entry.kind === 'birthday' ? 'age' : 'anniversary';
        items.push(this.i18n.translate(`dashboard.dates.${prefix}.${suffix}`, { count: years }));
      }
    }
    return items;
  }
}

function browserLocalDate(value: Date): string {
  const year = String(value.getFullYear()).padStart(4, '0');
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function pluralSuffix(category: Intl.LDMLPluralRule): 'one' | 'few' | 'many' | 'other' {
  if (category === 'one' || category === 'few' || category === 'many') return category;
  return 'other';
}
