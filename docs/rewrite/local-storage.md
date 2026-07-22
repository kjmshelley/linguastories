# Local storage architecture

LinguaStories uses IndexedDB database `linguastories-learning`, currently version 3. Full curriculum documents are never stored in localStorage. LocalStorage holds only the small startup language-pair hint; legacy lesson-session keys are migrated to IndexedDB after a successful database open and removed only after their individual write succeeds. Per-tab attempt ownership uses `sessionStorage` so it survives reload but is isolated from other tabs.

## Object stores

Version 1 creates `contentManifests`, `curriculumPackages`, `curriculumCategories`, `downloadJobs`, `lessonSessions`, `settings`, and `migrationState`. Version 2 adds stable-ID stores for `progress`, `reviewItems`, `lessonAttempts`, `syncQueue`, and `syncMetadata`. Version 3 adds production indexes plus `contentItemProgress`, `progressEvents`, `progressMigrations`, and expiring `attemptLeases`.

Indexes cover manifest retrieval time; packages by language pair, status, and update time; categories by language/version, stable category ID, and slug; jobs and sessions by language pair; sessions by content version and update time; settings by update time; and the reserved progress/review/attempt/sync lookup fields.

Migrations are additive, ordered, and executed only inside IndexedDB's `upgradeneeded` transaction. Existing stores and indexes are detected before creation, so an interrupted schema upgrade cannot leave a partially committed database version. A database `versionchange` closes the current handle so another tab can upgrade safely.

## Repositories and identity

`ContentRepository`, `ManifestRepository`, `DownloadRepository`, `SettingsRepository`, and `IndexedDbLessonSessionRepository` hide raw browser transactions from UI and lesson code. The canonical Traditional Chinese-from-English key is `zh-Hant_zh-TW__en`. Package records combine that key with semantic content version; category records also include the stable category slug. Progress-facing interfaces use stable IDs, never array positions or display labels.

Common category lookup is a direct primary-key read. Category bundles are cached in memory while used by the lesson engine, preventing repeated whole-curriculum deserialization. Progress indexes cover language/entity, parent category, item weakness, activity time, lesson/status, completion-event identity, and migration status.

## Portability and future sync

Business services receive database, fetch, connectivity, crypto, quota, and clock dependencies. A native client can replace browser adapters with SQLite/file downloads, native reachability, secure hashing, and device-capacity APIs while retaining package/version rules. Progress repositories are now concrete local implementations; the sync adapter remains a placeholder. A future server layer must exchange revisioned stable-ID records through that boundary rather than becoming a curriculum store.
