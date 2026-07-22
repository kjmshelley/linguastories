export const COMPLETION_EVENT_VERSION = 1;
export const ATTEMPT_LEASE_MS = 90_000;

export function progressId(languagePairKey, entityType, entityId) { return `${languagePairKey}:${entityType}:${entityId}`; }
export function itemProgressId(languagePairKey, itemType, itemId) { return `${languagePairKey}:${itemType}:${itemId}`; }
export function lessonStatusKey(languagePairKey, lessonId, status) { return `${languagePairKey}:${lessonId}:${status}`; }

export function weaknessScore(record, now = Date.now()) {
  const incorrect = Number(record.incorrectResponses || 0); const correct = Number(record.correctResponses || 0); const encounters = Number(record.encounters || 0);
  if (!encounters || (!incorrect && !correct)) return { score: 0, classification: "new" };
  const recentIncorrect = record.lastIncorrectAt && now - record.lastIncorrectAt < 7 * 86_400_000 ? 2 : 0;
  const recentRecovery = record.lastCorrectAt && (!record.lastIncorrectAt || record.lastCorrectAt > record.lastIncorrectAt) ? 1 : 0;
  const score = Math.max(0, Number((incorrect * 2 + recentIncorrect - correct * 0.5 - recentRecovery).toFixed(2)));
  return { score, classification: score >= 5 ? "weak" : score >= 2 ? "at_risk" : correct >= 2 ? "stable" : "new" };
}

function prerequisiteMap(items, prerequisiteField) { return new Map(items.map((item) => [item.id, item[prerequisiteField] ?? null])); }

export function validatePrerequisiteChain(items, prerequisiteField) {
  const byId = new Map(items.map((item) => [item.id, item])); const prerequisites = prerequisiteMap(items, prerequisiteField); const errors = [];
  for (const item of items) {
    const prerequisite = prerequisites.get(item.id);
    if (prerequisite && !byId.has(prerequisite)) { errors.push({ code: "MISSING_PREREQUISITE", entityId: item.id, prerequisiteId: prerequisite }); continue; }
    const seen = new Set([item.id]); let cursor = prerequisite;
    while (cursor) { if (seen.has(cursor)) { errors.push({ code: "PREREQUISITE_CYCLE", entityId: item.id, prerequisiteId: cursor }); break; } seen.add(cursor); cursor = prerequisites.get(cursor); }
  }
  if (items.length && !items.some((item) => !item[prerequisiteField])) errors.push({ code: "NO_CHAIN_ROOT" });
  return { valid: errors.length === 0, errors };
}

export function deriveAccess(items, progressById, prerequisiteField) {
  const validation = validatePrerequisiteChain(items, prerequisiteField); if (!validation.valid) return { validation, states: new Map() };
  const states = new Map();
  for (const item of items) {
    const progress = progressById.get(item.id); const completed = Boolean(progress?.historicallyCompleted || progress?.completionStatus === "completed"); const prerequisite = item[prerequisiteField];
    const unlocked = completed || !prerequisite || Boolean(progressById.get(prerequisite)?.historicallyCompleted || progressById.get(prerequisite)?.completionStatus === "completed");
    states.set(item.id, { accessStatus: unlocked ? "available" : "locked", completionStatus: completed ? "completed" : progress?.completionStatus || "not_started", reviewStatus: progress?.reviewStatus || "none" });
  }
  return { validation, states };
}

export function calculateCompletion(completed, total) { if (!total) return 0; if (completed >= total) return 100; return Math.floor((completed / total) * 100); }

export function summarizeAttempt(session, responseSummaries) {
  const scored = responseSummaries.filter((item) => !item.instructional); const correct = scored.filter((item) => item.correct).length; const perfectPass = scored.length > 0 && correct === scored.length && !session.failed;
  return { totalScoredExercises: scored.length, correctCount: correct, incorrectCount: scored.length - correct, accuracy: scored.length ? Number(((correct / scored.length) * 100).toFixed(2)) : 0, perfectPass, studyTimeMs: Number(session.activeMs || 0) };
}

export function utcNow(clock = Date) { return new clock().toISOString(); }

