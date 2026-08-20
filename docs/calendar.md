# Calendar

Calendar is a standalone, read-only core domain that composes private People birthdays and
memorable Dates. It owns no tables and is not part of the Knowledge Dates persistence domain or the
Dashboard domain.

## Architecture

`core/calendar` owns window selection, entry and summary schemas, conversion, relationship
projection and ordering. `CalendarUseCase` orchestrates author-scoped reads from People, Dates and
Knowledge Items. The source domains retain persistence ownership: Dates load date-to-Person links,
People load birthdays, and Knowledge Items project display names. The clean `0001` schema contains
the indexes used by these reads; the query-plan gate exercises retained Knowledge and Resume storage
scenarios.

## Protected API

```text
GET /api/calendar
    ?referenceDate=YYYY-MM-DD
    &window=month|currentAndNextMonths
```

`month` returns the complete month containing `referenceDate`; `currentAndNextMonths` adds the next
complete month. The response includes the selected reference date/window, date and birthday counts,
and ordered entries with their annual date, occurrence year, period, kind, display name and related
People.

Entries sort by month, day, memorable date before birthday, case-insensitive name and ID. December
to January advances the occurrence year. February 29 remains a February annual date and is reported
below the month grid when the selected year has no such day.

The handler is protected by the authenticated API boundary, excluded from OpenAPI and returned with
`Cache-Control: no-store`. The configured owner's session supplies the author username used by the
retained author-scoped reads in the private workspace.

## Workspace dashboard composition

`/` directly hosts the workspace dashboard, which is the first root item in the shared sidebar. Its
neutral tabs are Home, Calendar and Tools:

- Home contains the independent foldable widget for upcoming dates and birthdays in the browser's
  local current and next months.
- Calendar contains the always-expanded month-grid widget without a separate card header.
- Tools contains the always-expanded response-cache maintenance widget.

Collapsed section keys from Home are stored under one neutral browser-local key. Missing, malformed
or unknown data leaves those sections expanded. Widget loading, error and retry states stay
independent.
The month grid supports navigation, year selection, locale weekday order, multiple entries per day,
today highlighting and stale-response rejection. Names link to their typed Knowledge details.

## Verification

Backend tests cover API serialization, access guard and domain ordering. Frontend tests cover
request serialization, tabs and accessible tab panels, fold-state persistence, independent errors
and retries, local-date windows, locale formatting, month/year navigation, February 29 and links.
