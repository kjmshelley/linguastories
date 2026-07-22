export class ProgressIntegrityService {
  constructor({ database, pairKey }) { this.database = database; this.pairKey = pairKey; }
  async inspect({ categories = [], contentIds = new Set() } = {}) {
    const [progress, attempts, reviewItems] = await Promise.all([this.database.getAllByIndex("progress", "byLanguagePair", this.pairKey), this.database.getAllByIndex("lessonAttempts", "byLanguagePair", this.pairKey), this.database.getAllByIndex("reviewItems", "byLanguagePair", this.pairKey)]);
    const issues = []; const attemptsByLesson = new Set(attempts.filter((item) => ["passed", "failed"].includes(item.status)).map((item) => item.lessonId)); const progressById = new Map(progress.map((item) => [item.entityId, item]));
    for (const record of progress) {
      if (record.languagePairKey !== this.pairKey) issues.push({ code: "INVALID_LANGUAGE_PAIR", id: record.id, severity: "serious" });
      if (Number(record.totalStudyTimeMs || 0) < 0) issues.push({ code: "NEGATIVE_STUDY_TIME", id: record.id, severity: "correctable" });
      if (record.entityType === "lesson" && record.historicallyCompleted && !attemptsByLesson.has(record.entityId)) issues.push({ code: "COMPLETION_WITHOUT_ATTEMPT", id: record.id, severity: "serious" });
    }
    for (const category of categories) { const record = progressById.get(category.id); const prerequisite = category.prerequisiteCategoryId; if (record && !record.historicallyCompleted && record.completionPercentage === 100) issues.push({ code: "CATEGORY_COMPLETION_MISMATCH", id: record.id, severity: "correctable" }); if (record?.firstStartedAt && prerequisite && !progressById.get(prerequisite)?.historicallyCompleted) issues.push({ code: "UNLOCKED_WITH_UNMET_PREREQUISITE", id: record.id, severity: "serious" }); }
    for (const item of reviewItems) if (!item.deprecated && contentIds.size && !contentIds.has(item.targetId)) issues.push({ code: "REVIEW_CONTENT_MISSING", id: item.id, severity: "serious" });
    return { checkedAt: Date.now(), healthy: issues.length === 0, issueCount: issues.length, issues, repairRecommended: issues.some((item) => item.severity === "serious") };
  }
}
