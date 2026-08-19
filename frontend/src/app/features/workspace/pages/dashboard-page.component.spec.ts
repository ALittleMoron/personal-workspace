import { DOCUMENT } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { I18nService } from '../../../core/i18n/i18n.service';
import { CalendarService } from '../services/calendar.service';
import { DashboardPageComponent } from './dashboard-page.component';

const DASHBOARD_COLLAPSED_SECTIONS_STORAGE_KEY = 'dashboardCollapsedSections';

describe('DashboardPageComponent', () => {
  let fixture: ComponentFixture<DashboardPageComponent>;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        { provide: CalendarService, useValue: { getCalendar: jest.fn() } },
        { provide: I18nService, useValue: {} },
      ],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('loads only known collapsed sections from browser storage', () => {
    localStorage.setItem(
      DASHBOARD_COLLAPSED_SECTIONS_STORAGE_KEY,
      JSON.stringify(['tools', 'unknown-section']),
    );

    fixture = TestBed.createComponent(DashboardPageComponent);

    expect(fixture.componentInstance.isSectionExpanded('tools')).toBe(false);
    expect(fixture.componentInstance.isSectionExpanded('month-calendar')).toBe(true);
  });

  it('keeps sections expanded when no preference has been stored', () => {
    fixture = TestBed.createComponent(DashboardPageComponent);

    expect(fixture.componentInstance.isSectionExpanded('upcoming-dates')).toBe(true);
  });

  it('ignores malformed collapsed-section preferences', () => {
    localStorage.setItem(DASHBOARD_COLLAPSED_SECTIONS_STORAGE_KEY, '{not-json');

    const component = TestBed.runInInjectionContext(() => new DashboardPageComponent());

    expect(component.isSectionExpanded('tools')).toBe(true);
  });

  it('does not access browser storage for a server-like document', () => {
    const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage is not available on the server');
    });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: CalendarService, useValue: { getCalendar: jest.fn() } },
        { provide: I18nService, useValue: {} },
        { provide: DOCUMENT, useValue: { defaultView: null } },
      ],
    });

    const component = TestBed.runInInjectionContext(() => new DashboardPageComponent());

    expect(component.isSectionExpanded('tools')).toBe(true);
    expect(getItem).not.toHaveBeenCalled();
  });

  it('persists a collapsed section when the user toggles it', () => {
    fixture = TestBed.createComponent(DashboardPageComponent);

    fixture.componentInstance.setSectionExpanded('tools', false);

    expect(localStorage.getItem(DASHBOARD_COLLAPSED_SECTIONS_STORAGE_KEY)).toBe(
      JSON.stringify(['tools']),
    );
  });
});
