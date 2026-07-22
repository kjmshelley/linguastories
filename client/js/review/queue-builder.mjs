const TYPE_ORDER = ["vocabulary", "collocation", "phrase", "sentence", "dialogue", "story"];
export const SESSION_SIZES = Object.freeze({ quick: 5, standard: 12, extended: 25 });

function hash(value) { let result = 2166136261; for (const character of String(value)) { result ^= character.charCodeAt(0); result = Math.imul(result, 16777619); } return result >>> 0; }
export function priorityScore(item, now) {
  const overdueHours = Math.max(0, now - Number(item.dueAt || now)) / 3_600_000;
  return Math.min(72, overdueHours) + (item.weak ? 80 : 0) + Math.min(30, Number(item.lapses || 0) * 6) + (item.provisional ? 10 : 0) + (item.state === "relearning" ? 25 : 0);
}

export function buildReviewQueue(items, { now = Date.now(), size = SESSION_SIZES.standard, seed = "review", categoryId = null, weakOnly = false, practice = false } = {}) {
  const eligible = items.filter((item) => item.active && !item.deprecated && item.state !== "suspended" && (!categoryId || item.categoryId === categoryId) && (!weakOnly || item.weak) && (practice || Number(item.dueAt) <= now));
  const sorted = eligible.sort((a, b) => priorityScore(b, now) - priorityScore(a, now) || TYPE_ORDER.indexOf(a.targetType) - TYPE_ORDER.indexOf(b.targetType) || hash(`${seed}:${a.id}`) - hash(`${seed}:${b.id}`));
  const result = []; const pending = [...sorted]; let lastCategory = null; let categoryRun = 0; let lastType = null;
  while (pending.length && result.length < size) {
    let index = pending.findIndex((item) => !(item.categoryId === lastCategory && categoryRun >= 2) && item.targetType !== lastType);
    if (index < 0) index = pending.findIndex((item) => !(item.categoryId === lastCategory && categoryRun >= 2));
    if (index < 0) index = 0;
    const [next] = pending.splice(index, 1); result.push(next);
    categoryRun = next.categoryId === lastCategory ? categoryRun + 1 : 1; lastCategory = next.categoryId; lastType = next.targetType;
  }
  return result;
}
