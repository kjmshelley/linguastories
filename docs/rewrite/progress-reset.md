# Progress reset

## User contract

Settings exposes a separate “Reset Traditional Chinese progress” action with an explicit destructive confirmation. The confirmation names what is deleted and what is retained. Removing downloaded content remains a different action and explicitly preserves progress.

## Deleted for the selected language pair

- Category and lesson progress
- Lesson attempts
- Content-item performance and weakness
- Activity events and progress migration reports
- Saved lesson sessions and attempt leases
- Future review items and language-scoped sync queue entries

The reset runs as one transaction. Records belonging to another language pair are untouched.

## Preserved

- Downloaded curriculum packages and category data
- Content manifest and download/update preferences
- General settings
- LinguaStories authentication account and server session data

After reset, projections refresh immediately: the first category and first lesson are available, all successors are locked, metrics are zero, and Continue targets the first category. A `progress_reset` broadcast makes other tabs refresh and exits any active lesson after removing its cached session.
