import { itemProgressId, lessonStatusKey, progressId } from "./model.mjs";

export class ProgressRepository {
  constructor(database) { this.database = database; }
  get(pairKey, type, id) { return this.database.get("progress", progressId(pairKey, type, id)); }
  put(record) { return this.database.put("progress", record); }
  async forLanguagePair(pairKey) { return this.database.getAllByIndex("progress", "byLanguagePair", pairKey); }
  async forEntityType(pairKey, type) { return this.database.getAllByIndex("progress", "byLanguageEntity", `${pairKey}:${type}`); }
  async lessonsForCategory(pairKey, categoryId) { return this.database.getAllByIndex("progress", "byParentCategory", `${pairKey}:${categoryId}`); }
}

export class LessonAttemptRepository {
  constructor(database) { this.database = database; }
  get(id) { return this.database.get("lessonAttempts", id); }
  put(record) { return this.database.put("lessonAttempts", record); }
  async forLanguagePair(pairKey) { return this.database.getAllByIndex("lessonAttempts", "byLanguagePair", pairKey); }
  async forLesson(pairKey, lessonId) { return (await this.forLanguagePair(pairKey)).filter((item) => item.lessonId === lessonId).sort((a, b) => b.updatedAt - a.updatedAt); }
  async resumable(pairKey, lessonId) { return (await this.forLesson(pairKey, lessonId)).find((item) => ["in_progress", "paused"].includes(item.status)) || null; }
  async recent(pairKey, limit = 12) { return (await this.forLanguagePair(pairKey)).filter((item) => !["in_progress", "paused"].includes(item.status)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit); }
}

export class ContentItemProgressRepository {
  constructor(database) { this.database = database; }
  get(pairKey, type, id) { return this.database.get("contentItemProgress", itemProgressId(pairKey, type, id)); }
  put(record) { return this.database.put("contentItemProgress", record); }
  async forLanguagePair(pairKey) { return this.database.getAllByIndex("contentItemProgress", "byLanguagePair", pairKey); }
  async weak(pairKey, limit = 20) { return (await this.forLanguagePair(pairKey)).filter((item) => ["weak", "at_risk"].includes(item.weaknessClassification)).sort((a, b) => b.weaknessScore - a.weaknessScore || b.updatedAt - a.updatedAt).slice(0, limit); }
}

export class ProgressEventRepository {
  constructor(database) { this.database = database; }
  put(record) { return this.database.put("progressEvents", record); }
  async recent(pairKey, limit = 12) { return (await this.database.getAllByIndex("progressEvents", "byLanguagePair", pairKey)).sort((a, b) => b.timestamp - a.timestamp).slice(0, limit); }
}

export class ProgressMigrationRepository {
  constructor(database) { this.database = database; }
  get(id) { return this.database.get("progressMigrations", id); }
  put(record) { return this.database.put("progressMigrations", record); }
}

export class AttemptLeaseRepository {
  constructor(database, { now = () => Date.now() } = {}) { this.database = database; this.now = now; }
  async acquire(pairKey, lessonId, ownerId, attemptId, ttlMs) { const id = `${pairKey}:${lessonId}`; return this.database.transaction(["attemptLeases"], "readwrite", async (tx) => { const existing = await tx.get("attemptLeases", id); if (existing && existing.ownerId !== ownerId && existing.expiresAt > this.now()) return { acquired: false, lease: existing }; const lease = { id, languagePairKey: pairKey, lessonId, ownerId, attemptId, acquiredAt: this.now(), expiresAt: this.now() + ttlMs }; await tx.put("attemptLeases", lease); return { acquired: true, lease }; }); }
  async renew(pairKey, lessonId, ownerId, ttlMs) { const id = `${pairKey}:${lessonId}`; const existing = await this.database.get("attemptLeases", id); if (!existing || existing.ownerId !== ownerId) return false; await this.database.put("attemptLeases", { ...existing, expiresAt: this.now() + ttlMs }); return true; }
  async release(pairKey, lessonId, ownerId) { const id = `${pairKey}:${lessonId}`; const existing = await this.database.get("attemptLeases", id); if (existing?.ownerId === ownerId) await this.database.delete("attemptLeases", id); }
}

export { itemProgressId, lessonStatusKey, progressId };
