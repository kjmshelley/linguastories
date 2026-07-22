export const HOUR_MS = 60 * 60 * 1000;
export const DAY_MS = 24 * HOUR_MS;
export const REVIEW_LEASE_MS = 90_000;
export const REVIEW_STATES = Object.freeze(["new", "learning", "reviewing", "stable", "weak", "relearning", "suspended"]);

// LinguaStories' intentionally small, configurable stability model. It is not a
// named third-party algorithm and is documented in docs/review-scheduler.md.
export const DEFAULT_REVIEW_CONFIG = Object.freeze({
  failedProvisionalDelayMs: 2 * HOUR_MS,
  firstPerfectDelayMs: 18 * HOUR_MS,
  firstPerfectWeakDelayMs: 6 * HOUR_MS,
  lapseDelayMs: 20 * 60 * 1000,
  weakRecoveryDelayMs: 4 * HOUR_MS,
  minIntervalMs: 4 * HOUR_MS,
  maxIntervalMs: 365 * DAY_MS,
  stableIntervalMs: 30 * DAY_MS,
  masterySuccesses: 4,
  multipliers: Object.freeze({ 1: 1.2, 2: 1.8, 3: 2.35 })
});

export function reviewItemId(pairKey, targetType, targetId) { return `${pairKey}:${targetType}:${targetId}`; }
export function reviewStatusKeys(record) {
  return {
    languageStateKey: `${record.languagePairKey}:${record.state}`,
    languageCategoryKey: `${record.languagePairKey}:${record.categoryId}`,
    languageWeaknessKey: `${record.languagePairKey}:${record.weak ? "weak" : "healthy"}`,
    languageActiveKey: `${record.languagePairKey}:${record.active && !record.deprecated && record.state !== "suspended" ? "active" : "inactive"}`
  };
}

export function withReviewKeys(record) { return { ...record, ...reviewStatusKeys(record) }; }
export function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }

export function createReviewItem({ pairKey, target, lesson, contentVersion, now, provisional = false, weak = false, config = DEFAULT_REVIEW_CONFIG }) {
  const delay = provisional ? config.failedProvisionalDelayMs : weak ? config.firstPerfectWeakDelayMs : config.firstPerfectDelayMs;
  const record = {
    id: reviewItemId(pairKey, target.type, target.id), languagePairKey: pairKey, targetId: target.id, targetType: target.type,
    categoryId: lesson.categoryId, lessonId: lesson.id, contentVersion, content: target.content,
    state: provisional ? "new" : "learning", active: !provisional, provisional, weak, suspendedReason: null, deprecated: false,
    dueAt: now + delay, intervalMs: delay, stability: provisional ? 0.35 : weak ? 0.6 : 1,
    difficulty: clamp(Number(target.difficulty || 5), 1, 10), reviewCount: 0, successfulReviews: 0, consecutiveSuccessful: 0,
    lapses: provisional && weak ? 1 : 0, productionSuccesses: 0, lastReviewedAt: null, lastResult: null,
    firstSeenAt: now, activatedAt: provisional ? null : now, masteredAt: null, createdAt: now, updatedAt: now, revision: 1
  };
  return withReviewKeys(record);
}

export function activateReviewItem(prior, { target, lesson, contentVersion, now, previouslyMissed = false, config = DEFAULT_REVIEW_CONFIG }) {
  if (!prior) return createReviewItem({ pairKey: target.pairKey, target, lesson, contentVersion, now, weak: previouslyMissed, config });
  const shouldActivate = !prior.active || prior.provisional;
  const delay = previouslyMissed ? config.firstPerfectWeakDelayMs : config.firstPerfectDelayMs;
  return withReviewKeys({
    ...prior, content: target.content || prior.content, categoryId: lesson.categoryId, lessonId: lesson.id, contentVersion,
    active: true, provisional: false, deprecated: false, suspendedReason: null,
    state: shouldActivate ? "learning" : prior.state,
    weak: Boolean(prior.weak || previouslyMissed), dueAt: shouldActivate ? Math.min(prior.dueAt || Infinity, now + delay) : prior.dueAt,
    intervalMs: shouldActivate ? Math.min(Number(prior.intervalMs || delay), delay) : prior.intervalMs,
    stability: shouldActivate ? Math.max(Number(prior.stability || 0), previouslyMissed ? 0.6 : 1) : prior.stability,
    activatedAt: prior.activatedAt || now, updatedAt: now, revision: Number(prior.revision || 0) + 1
  });
}

export function applyReviewResult(item, { correct, quality = correct ? 2 : 0, production = false, practice = false, now, config = DEFAULT_REVIEW_CONFIG }) {
  if (!item?.active || item.state === "suspended") return item;
  const boundedQuality = clamp(Number(quality || 0), 0, 3);
  let intervalMs; let stability; let state; let weak;
  if (!correct) {
    intervalMs = practice ? Math.max(config.minIntervalMs, Number(item.intervalMs || config.minIntervalMs) * 0.7) : config.lapseDelayMs;
    stability = Math.max(0.25, Number(item.stability || 1) * (practice ? 0.82 : 0.55)); state = "relearning"; weak = true;
  } else {
    const difficultyFactor = 1.15 - (clamp(Number(item.difficulty || 5), 1, 10) - 1) * 0.025;
    const multiplier = config.multipliers[boundedQuality] || config.multipliers[1];
    intervalMs = clamp(Math.max(Number(item.intervalMs || config.minIntervalMs), config.minIntervalMs) * multiplier * difficultyFactor, config.minIntervalMs, config.maxIntervalMs);
    stability = Math.min(100, Number(item.stability || 1) + (boundedQuality * 0.45) + Math.log2(intervalMs / config.minIntervalMs + 1));
    weak = item.weak && Number(item.consecutiveSuccessful || 0) < 1;
    state = intervalMs >= config.stableIntervalMs ? "stable" : "reviewing";
  }
  const successfulReviews = Number(item.successfulReviews || 0) + (correct ? 1 : 0);
  const productionSuccesses = Number(item.productionSuccesses || 0) + (correct && production ? 1 : 0);
  const consecutiveSuccessful = correct ? Number(item.consecutiveSuccessful || 0) + 1 : 0;
  const mastered = successfulReviews >= config.masterySuccesses && productionSuccesses > 0 && intervalMs >= config.stableIntervalMs && consecutiveSuccessful >= 2;
  return withReviewKeys({
    ...item, state: mastered ? "stable" : state, weak: mastered ? false : weak, intervalMs: Math.round(intervalMs), dueAt: now + Math.round(intervalMs), stability,
    reviewCount: Number(item.reviewCount || 0) + 1, successfulReviews, consecutiveSuccessful,
    lapses: Number(item.lapses || 0) + (correct ? 0 : 1), productionSuccesses,
    lastReviewedAt: now, lastResult: { correct, quality: boundedQuality, production, practice }, masteredAt: item.masteredAt || (mastered ? now : null), updatedAt: now, revision: Number(item.revision || 0) + 1
  });
}

export function isDue(item, now) { return Boolean(item?.active && !item.deprecated && item.state !== "suspended" && Number(item.dueAt) <= now); }
export function isMastered(item) { return Boolean(item?.masteredAt); }
