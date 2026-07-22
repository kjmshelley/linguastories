export const DATABASE_MIGRATIONS = Object.freeze([
  {
    version: 1,
    description: "Core curriculum downloads, settings, and lesson sessions",
    stores: [
      { name: "contentManifests", keyPath: "id", indexes: [{ name: "byRetrievedAt", keyPath: "retrievedAt" }] },
      { name: "curriculumPackages", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byStatus", keyPath: "status" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "curriculumCategories", keyPath: "id", indexes: [{ name: "byLanguageVersion", keyPath: "languageVersionKey" }, { name: "byCategoryId", keyPath: "categoryId" }, { name: "bySlug", keyPath: "slug" }] },
      { name: "downloadJobs", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byStatus", keyPath: "status" }] },
      { name: "lessonSessions", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byContentVersion", keyPath: "contentVersion" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "settings", keyPath: "id", indexes: [{ name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "migrationState", keyPath: "id", indexes: [] }
    ]
  },
  {
    version: 2,
    description: "Reserved stable-ID records for future progress, review, attempts, and sync",
    stores: [
      { name: "progress", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "bySyncState", keyPath: "syncState" }] },
      { name: "reviewItems", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byDueAt", keyPath: "dueAt" }] },
      { name: "lessonAttempts", keyPath: "id", indexes: [{ name: "byLessonId", keyPath: "lessonId" }, { name: "bySyncState", keyPath: "syncState" }] },
      { name: "syncQueue", keyPath: "id", indexes: [{ name: "byStatus", keyPath: "status" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "syncMetadata", keyPath: "id", indexes: [] }
    ]
  },
  {
    version: 3,
    description: "Persistent progress, item performance, activity, migrations, and expiring attempt leases",
    stores: [
      { name: "progress", keyPath: "id", indexes: [{ name: "byLanguageEntity", keyPath: "languageEntityKey" }, { name: "byParentCategory", keyPath: "parentCategoryKey" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "lessonAttempts", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byLessonStatus", keyPath: "lessonStatusKey" }, { name: "bySessionId", keyPath: "sessionId", unique: true }, { name: "byCompletionEvent", keyPath: "completionEventId", unique: true }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "contentItemProgress", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byWeakness", keyPath: "weaknessKey" }, { name: "byLessonId", keyPath: "lessonId" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "progressEvents", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byTimestamp", keyPath: "timestamp" }] },
      { name: "progressMigrations", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byStatus", keyPath: "status" }] },
      { name: "attemptLeases", keyPath: "id", indexes: [{ name: "byExpiresAt", keyPath: "expiresAt" }] }
    ]
  },
  {
    version: 4,
    description: "Spaced-repetition schedules, resumable review sessions, idempotent responses, migrations, and leases",
    stores: [
      { name: "reviewItems", keyPath: "id", indexes: [{ name: "byLanguageState", keyPath: "languageStateKey" }, { name: "byLanguageCategory", keyPath: "languageCategoryKey" }, { name: "byLanguageWeakness", keyPath: "languageWeaknessKey" }, { name: "byLanguageActive", keyPath: "languageActiveKey" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "reviewSessions", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byLanguageStatus", keyPath: "languageStatusKey" }, { name: "byUpdatedAt", keyPath: "updatedAt" }] },
      { name: "reviewResponses", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "bySession", keyPath: "sessionId" }, { name: "byTarget", keyPath: "reviewItemId" }, { name: "byAnsweredAt", keyPath: "answeredAt" }] },
      { name: "reviewLeases", keyPath: "id", indexes: [{ name: "byExpiresAt", keyPath: "expiresAt" }] },
      { name: "reviewMigrations", keyPath: "id", indexes: [{ name: "byLanguagePair", keyPath: "languagePairKey" }, { name: "byStatus", keyPath: "status" }] }
    ]
  }
]);

export function migrationsForUpgrade(oldVersion, newVersion) {
  return DATABASE_MIGRATIONS.filter((migration) => migration.version > oldVersion && migration.version <= newVersion);
}
