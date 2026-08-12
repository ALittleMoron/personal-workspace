import { LanguageCode } from '../../core/i18n/i18n.model';

interface LocalizedText {
  readonly ru: string;
  readonly en: string;
}

export type UpdateTagId =
  | 'admin'
  | 'analytics'
  | 'backend'
  | 'content'
  | 'delivery'
  | 'frontend'
  | 'infra'
  | 'localization'
  | 'quality'
  | 'security';

export interface UpdateTimelineEntry {
  readonly id: string;
  readonly month: string;
  readonly order: number;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly tagIds: readonly UpdateTagId[];
}

export interface LocalizedUpdateEntry {
  readonly id: string;
  readonly title: string;
  readonly summary: string;
  readonly tagKeys: readonly string[];
}

export interface UpdateGroup {
  readonly datetime: string;
  readonly label: string;
  readonly entries: readonly LocalizedUpdateEntry[];
}

const UPDATE_TAG_I18N_KEYS: Readonly<Record<UpdateTagId, string>> = {
  admin: 'updates.tag.admin',
  analytics: 'updates.tag.analytics',
  backend: 'updates.tag.backend',
  content: 'updates.tag.content',
  delivery: 'updates.tag.delivery',
  frontend: 'updates.tag.frontend',
  infra: 'updates.tag.infra',
  localization: 'updates.tag.localization',
  quality: 'updates.tag.quality',
  security: 'updates.tag.security',
};

export const UPDATES_TIMELINE_ENTRIES: readonly UpdateTimelineEntry[] = [
  {
    id: 'public-updates-page',
    month: '2026-07',
    order: 5,
    title: {
      ru: 'Появился публичный журнал изменений',
      en: 'Public updates page went live',
    },
    summary: {
      ru:
        'Сайт получил страницу обновлений с полной историей сайта, сжатой до крупных ' +
        'вех: публичный контент, админка, качество, безопасность и инфраструктура.',
      en:
        'The site gained an updates page with compressed site history focused on major ' +
        'milestones: public content, admin workflows, quality, security, and infrastructure.',
    },
    tagIds: ['content', 'frontend', 'backend'],
  },
  {
    id: 'release-workflow',
    month: '2026-07',
    order: 10,
    title: {
      ru: 'Релизы и интерфейс стали аккуратнее',
      en: 'Release workflow and interface polish',
    },
    summary: {
      ru:
        'CI/CD quality, smoke и deploy jobs разделены понятнее, релиз снова требует ' +
        'ручного подтверждения, а файлы, статистика, мобильные сценарии, локализованные ' +
        'даты и защита несохранённых изменений во всех формах админки получили июльскую ' +
        'полировку.',
      en:
        'CI/CD quality, smoke, and deploy jobs are easier to follow, production deploys ' +
        'require manual approval again, while file handling, statistics, mobile admin flows, ' +
        'locale-aware dates, and unsaved-change protection across admin forms received July ' +
        'polish.',
    },
    tagIds: ['delivery', 'quality', 'admin', 'infra', 'frontend', 'localization'],
  },
  {
    id: 'quality-ops',
    month: '2026-06',
    order: 30,
    title: {
      ru: 'Качество и эксплуатация стали строже',
      en: 'Quality and operations became stricter',
    },
    summary: {
      ru:
        'Появились query-plan checks, Lighthouse gates, Trivy, pip-audit, Hadolint, ' +
        'Dockle, TaskIQ cache warm и hotswap-деплой с readiness health checks.',
      en:
        'Query-plan checks, Lighthouse gates, Trivy, pip-audit, Hadolint, Dockle, ' +
        'TaskIQ cache warming, and hotswap deploys with readiness health checks landed.',
    },
    tagIds: ['quality', 'security', 'infra', 'delivery'],
  },
  {
    id: 'blog-ci',
    month: '2025-08',
    order: 10,
    title: {
      ru: 'Появились блоговая модель и CI/CD',
      en: 'Blog model and CI/CD appeared',
    },
    summary: {
      ru:
        'Стартовали blog posts, GitHub Actions quality checks, coverage badges, ' +
        'deployment workflow и подготовка контейнеров для публикации.',
      en:
        'Blog posts, GitHub Actions quality checks, coverage badges, deployment workflow, ' +
        'and publication-oriented container work started.',
    },
    tagIds: ['content', 'delivery', 'quality', 'infra'],
  },

  {
    id: 'litestar-migration',
    month: '2025-06',
    order: 10,
    title: {
      ru: 'Backend переехал на Litestar',
      en: 'Backend moved to Litestar',
    },
    summary: {
      ru:
        'FastAPI был заменён на Litestar, публичный UI временно пошёл через шаблоны ' +
        'и HTMX, а админский и публичный контуры начали расходиться.',
      en:
        'FastAPI was replaced with Litestar, the public UI temporarily moved through ' +
        'templates and HTMX, and admin and public contours started to split.',
    },
    tagIds: ['backend', 'frontend'],
  },
  {
    id: 'repository-started',
    month: '2024-09',
    order: 10,
    title: {
      ru: 'Репозиторий стартовал',
      en: 'Repository started',
    },
    summary: {
      ru:
        'Появилась первая версия проекта и базовый security pipeline; с этого началась ' +
        'история сайта как отдельной базы знаний.',
      en:
        'The first repository version and baseline security pipeline appeared; that is where ' +
        'the site history as a standalone knowledge base begins.',
    },
    tagIds: ['infra', 'security'],
  },
];

export function groupUpdateEntries(
  entries: readonly UpdateTimelineEntry[],
  language: LanguageCode,
  dateLocale: string,
): readonly UpdateGroup[] {
  const groups = new Map<string, UpdateTimelineEntry[]>();
  const sortedEntries = [...entries].sort(compareTimelineEntries);

  for (const entry of sortedEntries) {
    const groupEntries = groups.get(entry.month);
    if (groupEntries === undefined) {
      groups.set(entry.month, [entry]);
    } else {
      groupEntries.push(entry);
    }
  }

  return [...groups.entries()].map(([month, groupEntries]) => ({
    datetime: month,
    label: formatMonthLabel(month, dateLocale),
    entries: groupEntries.map((entry) => localizeEntry(entry, language)),
  }));
}

function localizeEntry(entry: UpdateTimelineEntry, language: LanguageCode): LocalizedUpdateEntry {
  return {
    id: entry.id,
    title: entry.title[language],
    summary: entry.summary[language],
    tagKeys: entry.tagIds.map((tagId) => UPDATE_TAG_I18N_KEYS[tagId]),
  };
}

function formatMonthLabel(month: string, dateLocale: string): string {
  const date = parseUpdateMonth(month);
  const parts = new Intl.DateTimeFormat(dateLocale, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  }).formatToParts(date);
  const monthPart = requireDatePart(parts, 'month', month);
  const yearPart = requireDatePart(parts, 'year', month);
  return `${capitalizeFirstLetter(monthPart)} ${yearPart}`;
}

function parseUpdateMonth(month: string): Date {
  const match = /^(?<year>\d{4})-(?<month>\d{2})$/.exec(month);
  if (match?.groups === undefined) {
    throw new Error(`Invalid update month: ${month}`);
  }

  const year = Number.parseInt(match.groups['year'], 10);
  const monthIndex = Number.parseInt(match.groups['month'], 10) - 1;
  if (monthIndex < 0 || monthIndex > 11) {
    throw new Error(`Invalid update month: ${month}`);
  }

  return new Date(Date.UTC(year, monthIndex, 1));
}

function requireDatePart(
  parts: Intl.DateTimeFormatPart[],
  type: Intl.DateTimeFormatPartTypes,
  month: string,
): string {
  const part = parts.find((item) => item.type === type);
  if (part === undefined) {
    throw new Error(`Cannot format update month: ${month}`);
  }
  return part.value;
}

function capitalizeFirstLetter(value: string): string {
  const firstLetter = value.charAt(0);
  if (firstLetter === '') {
    return value;
  }
  return firstLetter.toLocaleUpperCase() + value.slice(1);
}

function compareTimelineEntries(left: UpdateTimelineEntry, right: UpdateTimelineEntry): number {
  const monthOrder = right.month.localeCompare(left.month);
  if (monthOrder !== 0) {
    return monthOrder;
  }
  return left.order - right.order;
}
