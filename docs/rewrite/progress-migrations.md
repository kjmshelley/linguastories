# Progress migrations

## Version boundary

Content version 1.1.0 introduces explicit prerequisites while preserving the Phase 5 schema version and stable content IDs. Its manifest declares previous/compatible versions, replacement mappings, deprecated IDs, and whether review or active lessons require reset/restart.

An activated update invokes `ProgressMigrationService` after package activation. Pending downloads wait for the active lesson to close, then activate and migrate. Migration identity is `{languagePairKey}:{fromVersion}:{toVersion}`; a completed identity is returned unchanged on repeat execution.

## Record treatment

The migration scans aggregate and content-item progress for the selected language pair:

- Stable ID still present: preserve history and point it at the new content version.
- Explicit replacement mapping: create the equivalent record under the replacement stable ID and retain `migratedFromId`.
- ID no longer present: preserve the historical record but mark it `deprecated`; deprecated records do not inflate current course metrics.
- Newly added content: no historical record is fabricated; it appears incomplete and follows its declared prerequisite.

Attempts and activity history remain historical facts tied to the content version on which they occurred. Migrations do not reinterpret an old failed attempt as a pass or discard prior perfect completion.

## Safety and reporting

Aggregate progress, item progress, and the migration report are written in one transaction. The report includes affected, preserved, deprecated, and replaced counts plus warnings/errors placeholders. A failure rolls back the migration and can be retried. The content package activation/rollback logic remains owned by Phase 5; progress migration never deletes curriculum files.

