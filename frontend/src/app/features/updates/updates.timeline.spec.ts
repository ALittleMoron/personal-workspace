import { groupUpdateEntries } from './updates.timeline';

describe('updates timeline', () => {
  it('groups localized entries by newest month and explicit within-month order', () => {
    const groups = groupUpdateEntries(
      [
        {
          id: 'older',
          month: '2026-05',
          order: 10,
          title: { ru: 'Старое', en: 'Older' },
          summary: { ru: 'Старое описание', en: 'Older summary' },
          tagIds: ['content'],
        },
        {
          id: 'newer-second',
          month: '2026-07',
          order: 20,
          title: { ru: 'Новое второе', en: 'Newer second' },
          summary: { ru: 'Второе описание', en: 'Second summary' },
          tagIds: ['frontend'],
        },
        {
          id: 'newer-first',
          month: '2026-07',
          order: 10,
          title: { ru: 'Новое первое', en: 'Newer first' },
          summary: { ru: 'Первое описание', en: 'First summary' },
          tagIds: ['quality'],
        },
      ],
      'ru',
      'ru-RU',
    );

    expect(groups.map((group) => group.datetime)).toEqual(['2026-07', '2026-05']);
    expect(groups[0]?.label).toBe('Июль 2026');
    expect(groups[0]?.entries.map((entry) => entry.id)).toEqual(['newer-first', 'newer-second']);
    expect(groups[0]?.entries[0]).toEqual({
      id: 'newer-first',
      title: 'Новое первое',
      summary: 'Первое описание',
      tagKeys: ['updates.tag.quality'],
    });
  });

  it('selects English authored text and formats the same month for the English locale', () => {
    const groups = groupUpdateEntries(
      [
        {
          id: 'release',
          month: '2026-07',
          order: 10,
          title: { ru: 'Релиз', en: 'Release' },
          summary: { ru: 'Описание релиза', en: 'Release summary' },
          tagIds: ['delivery'],
        },
      ],
      'en',
      'en-US',
    );

    expect(groups).toEqual([
      {
        datetime: '2026-07',
        label: 'July 2026',
        entries: [
          {
            id: 'release',
            title: 'Release',
            summary: 'Release summary',
            tagKeys: ['updates.tag.delivery'],
          },
        ],
      },
    ]);
  });
});
