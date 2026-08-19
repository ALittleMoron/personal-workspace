import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DropdownAction, ActionsDropdownComponent } from './actions-dropdown.component';

describe('ActionsDropdownComponent', () => {
  let fixture: ComponentFixture<ActionsDropdownComponent>;
  const actions: readonly DropdownAction[] = [
    { id: 'edit', label: 'Редактировать', destructive: false, disabled: false },
    { id: 'delete', label: 'Удалить', destructive: true, disabled: false },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActionsDropdownComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActionsDropdownComponent);
    fixture.componentRef.setInput('actions', actions);
    fixture.componentRef.setInput('buttonLabel', 'Действия');
    fixture.componentRef.setInput('ariaLabel', 'Действия с записью');
    fixture.componentRef.setInput('destructiveActionLabel', 'опасное действие');
    fixture.componentRef.setInput('testId', 'record-actions');
    fixture.detectChanges();
  });

  it('connects its accessible trigger to the popover state', () => {
    const toggle = element<HTMLButtonElement>('[data-testid="record-actions-toggle"]');
    const menu = element<HTMLElement>('[data-testid="record-actions-menu"]');

    expect(toggle.getAttribute('aria-label')).toBe('Действия с записью');
    expect(toggle.getAttribute('popovertarget')).toBe(menu.id);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    dispatchToggle(menu, 'open');
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });

  it('emits a destructive selection with an explicit accessible warning', () => {
    const selected: string[] = [];
    const toggle = element<HTMLButtonElement>('[data-testid="record-actions-toggle"]');
    const menu = element<HTMLElement>('[data-testid="record-actions-menu"]');
    const hidePopover = jest.fn<void, []>();
    Object.defineProperty(menu, 'hidePopover', { configurable: true, value: hidePopover });
    fixture.componentInstance.actionSelected.subscribe((action) => selected.push(action));
    dispatchToggle(menu, 'open');
    fixture.detectChanges();

    const deleteButton = element<HTMLButtonElement>('[data-testid="record-actions-delete"]');
    deleteButton.click();
    fixture.detectChanges();

    expect(deleteButton.getAttribute('aria-label')).toBe('Удалить, опасное действие');
    expect(selected).toEqual(['delete']);
    expect(hidePopover).toHaveBeenCalledTimes(1);
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('does not offer actions that the caller marked unavailable', () => {
    fixture.componentRef.setInput('actions', [
      { id: 'edit', label: 'Редактировать', destructive: false, disabled: false },
      { id: 'delete', label: 'Удалить', destructive: true, disabled: true },
    ]);
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="record-actions-edit"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="record-actions-delete"]')).toBeNull();

    fixture.componentRef.setInput('actions', [
      { id: 'delete', label: 'Удалить', destructive: true, disabled: true },
    ]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="record-actions-toggle"]')).toBeNull();
  });

  function element<T extends Element>(selector: string): T {
    const value = fixture.nativeElement.querySelector(selector) as T | null;
    if (value === null) {
      throw new Error(`Missing element: ${selector}`);
    }
    return value;
  }
});

function dispatchToggle(menu: HTMLElement, newState: 'open' | 'closed'): void {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', { value: newState });
  menu.dispatchEvent(event);
}
