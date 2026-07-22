# Review migrations

Review migration runs after a newly downloaded curriculum version becomes active, alongside progress migration. The migration key is `languagePair:fromVersion:toVersion`, so retries are idempotent.

For each review item:

- A stable target ID in the new package preserves interval, stability, history and mastery, and updates the content version.
- `replacedContentIds` moves the record to the replacement stable ID and records `migratedFromId`.
- A removed target is retained for history but becomes inactive, deprecated and suspended with `content_removed`.
- `requiresReviewReset` suspends all records with `content_reset_required`; it never silently converts old evidence to new content.

Active sessions are marked `invalidated` after an update because their embedded definitions came from the old package. Completed response history remains intact. The report records preserved, replaced and deprecated totals in `reviewMigrations`.

Rollback keeps the prior curriculum package according to the Phase 5 retention rules. Review state is not destructively rewritten during download staging; migration begins only after activation.
