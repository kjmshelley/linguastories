const DAY_MS = 86_400_000;

function dayKey(timestamp) { return new Date(timestamp).toISOString().slice(0, 10); }
function accuracy(correct, incorrect) { const total = correct + incorrect; return total ? Math.round((correct / total) * 100) : null; }

export function learningStreak(attempts, reviewSessions, now = Date.now()) {
  const studyDays = new Set([
    ...attempts.filter((item) => ["passed", "failed"].includes(item.status) && item.endedAt).map((item) => dayKey(item.endedAt)),
    ...reviewSessions.filter((item) => item.status === "completed" && item.completedAt).map((item) => dayKey(item.completedAt))
  ]);
  let current = 0; const cursor = new Date(now); cursor.setUTCHours(0, 0, 0, 0);
  if (!studyDays.has(dayKey(cursor.getTime()))) cursor.setTime(cursor.getTime() - DAY_MS);
  while (studyDays.has(dayKey(cursor.getTime()))) { current += 1; cursor.setTime(cursor.getTime() - DAY_MS); }
  let longest = 0; let run = 0; let prior = null;
  for (const stamp of [...studyDays].sort()) { const value = Date.parse(`${stamp}T00:00:00Z`); run = prior !== null && value - prior === DAY_MS ? run + 1 : 1; longest = Math.max(longest, run); prior = value; }
  return { current, longest, studyDays: studyDays.size };
}

export function buildProgressInsights({ categories = [], progressRecords = [], itemRecords = [], attempts = [], reviewSessions = [], reviewResponses = [], recentEvents = [], now = Date.now() } = {}) {
  const byCategory = new Map(progressRecords.filter((item) => item.entityType === "category").map((item) => [item.entityId, item]));
  const categoryProgress = categories.map((category) => { const record = byCategory.get(category.id); return { ...category, percentage: Number(record?.completionPercentage || 0), completedLessons: Number(record?.completedRequiredLessons || 0), lessonTotal: Number(record?.totalRequiredLessons || category.lessonCount || 0), status: record?.reviewStatus === "mastered" ? "mastered" : record?.historicallyCompleted ? "completed" : record ? "in_progress" : "not_started", lastActiveAt: record?.lastActiveAt || null }; });
  const reviewCorrect = reviewResponses.filter((item) => item.correct).length; const reviewIncorrect = reviewResponses.length - reviewCorrect;
  const weakAreas = itemRecords.filter((item) => ["weak", "at_risk"].includes(item.weaknessClassification)).sort((a, b) => Number(b.weaknessScore) - Number(a.weaknessScore) || Number(b.updatedAt) - Number(a.updatedAt)).slice(0, 8).map((item) => ({ id: item.itemId, type: item.itemType, categoryId: item.categoryId, score: item.weaknessScore, correct: item.correctResponses || 0, incorrect: item.incorrectResponses || 0, accuracy: accuracy(item.correctResponses || 0, item.incorrectResponses || 0) }));
  const activity = [...recentEvents, ...reviewSessions.filter((item) => item.status === "completed").map((item) => ({ id: `activity:${item.id}`, type: "review_completed", timestamp: item.completedAt, details: { correct: item.correctCount || 0, incorrect: item.incorrectCount || 0 } }))].filter((item) => item.timestamp).sort((a, b) => b.timestamp - a.timestamp).slice(0, 12);
  return { categoryProgress, weakAreas, reviewAccuracy: accuracy(reviewCorrect, reviewIncorrect), reviewResponses: reviewResponses.length, reviewSessionsCompleted: reviewSessions.filter((item) => item.status === "completed").length, streak: learningStreak(attempts, reviewSessions, now), activity };
}
