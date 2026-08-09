import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FoldableTreeComponent, FoldableTreeSection } from './foldable-tree.component';

describe('FoldableTreeComponent', () => {
  let fixture: ComponentFixture<FoldableTreeComponent>;

  const sections: readonly FoldableTreeSection[] = [
    {
      key: 'projects',
      label: 'Projects',
      trailingText: '2',
      items: [
        { key: 'active', label: 'Active', badgeText: null },
        { key: 'archived', label: 'Archived projects', badgeText: '4' },
      ],
    },
  ];
  const rootItems = [{ key: 'overview', label: 'Overview', badgeText: null }] as const;

  function openSection(): void {
    (
      fixture.nativeElement.querySelector('[data-testid="tree-section"]') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
  }

  function itemButton(index: number): HTMLButtonElement {
    return fixture.nativeElement.querySelectorAll(
      '.foldable-tree-items [data-testid="tree-item"]',
    )[index] as HTMLButtonElement;
  }

  function itemLabel(index: number): HTMLElement {
    return itemButton(index).querySelector('.foldable-tree-item-label') as HTMLElement;
  }

  function setRenderedWidths(
    element: HTMLElement,
    widths: { client: number; scroll: number },
  ): void {
    Object.defineProperty(element, 'clientWidth', { configurable: true, value: widths.client });
    Object.defineProperty(element, 'scrollWidth', { configurable: true, value: widths.scroll });
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FoldableTreeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FoldableTreeComponent);
    fixture.componentRef.setInput('rootItems', rootItems);
    fixture.componentRef.setInput('sections', sections);
    fixture.componentRef.setInput('emptyMessage', 'Sections will appear later.');
    fixture.componentRef.setInput('selectedItemKey', 'archived');
    fixture.componentRef.setInput('defaultExpandedSectionKeys', []);
    fixture.componentRef.setInput('sectionTestId', 'tree-section');
    fixture.componentRef.setInput('itemTestId', 'tree-item');
    fixture.detectChanges();
  });

  it('renders foldable sections and selected nested items as an accessible tree', () => {
    const section = fixture.nativeElement.querySelector(
      '[data-testid="tree-section"]',
    ) as HTMLButtonElement;

    expect(fixture.nativeElement.querySelector('[role="tree"]')).not.toBeNull();
    expect(section.textContent).toContain('Projects');
    expect(section.textContent).toContain('2');
    expect(section.getAttribute('aria-expanded')).toBe('false');

    section.click();
    fixture.detectChanges();

    const items = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.foldable-tree-items [data-testid="tree-item"]',
      ),
    ) as HTMLButtonElement[];
    expect(section.getAttribute('aria-expanded')).toBe('true');
    expect(items.map((item) => item.textContent?.trim())).toEqual([
      '+--Active',
      '+--Archived projects4',
    ]);
    expect(items[1].classList).toContain('active');
    expect(items[1].classList).toContain('foldable-tree-item-success');
    expect(items[1].getAttribute('aria-selected')).toBe('true');
  });

  it('renders selected root items with the same item states and page semantics', () => {
    fixture.componentRef.setInput('selectedItemKey', 'overview');
    fixture.detectChanges();

    const rootItem = fixture.nativeElement.querySelector(
      '[data-testid="tree-item"]',
    ) as HTMLButtonElement;

    expect(rootItem.textContent?.trim()).toBe('Overview');
    expect(rootItem.classList).toContain('foldable-tree-item');
    expect(rootItem.classList).toContain('foldable-tree-item-success');
    expect(rootItem.getAttribute('aria-selected')).toBe('true');
    expect(rootItem.getAttribute('aria-current')).toBe('page');
  });

  it('renders sections from explicit default expanded keys without a toggle click', () => {
    fixture.componentRef.setInput('defaultExpandedSectionKeys', ['projects']);
    fixture.detectChanges();

    const section = fixture.nativeElement.querySelector(
      '[data-testid="tree-section"]',
    ) as HTMLButtonElement;
    const items = fixture.nativeElement.querySelectorAll(
      '.foldable-tree-items [data-testid="tree-item"]',
    );

    expect(section.getAttribute('aria-expanded')).toBe('true');
    expect(items).toHaveLength(2);
  });

  it('sets the full item label title when the rendered label is truncated', () => {
    openSection();
    const item = itemButton(1);
    setRenderedWidths(itemLabel(1), { client: 80, scroll: 160 });

    item.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    expect(item.getAttribute('title')).toBe('Archived projects');
  });

  it('does not set an item label title when the rendered label fits', () => {
    openSection();
    const item = itemButton(0);
    setRenderedWidths(itemLabel(0), { client: 120, scroll: 120 });

    item.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();

    expect(item.getAttribute('title')).toBeNull();
  });

  it('clears a truncated item label title after pointer leaves the item', () => {
    openSection();
    const item = itemButton(1);
    setRenderedWidths(itemLabel(1), { client: 80, scroll: 160 });

    item.dispatchEvent(new Event('mouseenter'));
    fixture.detectChanges();
    item.dispatchEvent(new Event('mouseleave'));
    fixture.detectChanges();

    expect(item.getAttribute('title')).toBeNull();
  });

  it('emits selected item keys', () => {
    const selected: string[] = [];
    fixture.componentInstance.itemSelected.subscribe((key) => selected.push(key));

    openSection();
    (
      fixture.nativeElement.querySelector(
        '.foldable-tree-items [data-testid="tree-item"]',
      ) as HTMLButtonElement
    ).click();

    expect(selected).toEqual(['active']);
  });

  it('emits selected root item keys', () => {
    const selected: string[] = [];
    fixture.componentInstance.itemSelected.subscribe((key) => selected.push(key));

    (
      fixture.nativeElement.querySelector('[data-testid="tree-item"]') as HTMLButtonElement
    ).click();

    expect(selected).toEqual(['overview']);
  });

  it('renders the explicit empty message when there are no sections', () => {
    fixture.componentRef.setInput('rootItems', []);
    fixture.componentRef.setInput('sections', []);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="tree"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Sections will appear later.');
  });
});
