export class ReviewItemRepository {
  constructor(database) { this.database = database; }
  get(id) { return this.database.get("reviewItems", id); }
  put(record) { return this.database.put("reviewItems", record); }
  forLanguagePair(pairKey) { return this.database.getAllByIndex("reviewItems", "byLanguagePair", pairKey); }
  active(pairKey) { return this.database.getAllByIndex("reviewItems", "byLanguageActive", `${pairKey}:active`); }
}

export class ReviewSessionRepository {
  constructor(database) { this.database = database; }
  get(id) { return this.database.get("reviewSessions", id); }
  put(record) { return this.database.put("reviewSessions", record); }
  async active(pairKey) { return (await this.database.getAllByIndex("reviewSessions", "byLanguageStatus", `${pairKey}:active`)).sort((a, b) => b.updatedAt - a.updatedAt)[0] || null; }
  async resumable(pairKey) { return (await this.database.getAllByIndex("reviewSessions", "byLanguagePair", pairKey)).filter((item) => ["active", "paused"].includes(item.status)).sort((a, b) => b.updatedAt - a.updatedAt)[0] || null; }
  async recent(pairKey, limit = 20) { return (await this.database.getAllByIndex("reviewSessions", "byLanguagePair", pairKey)).sort((a, b) => b.updatedAt - a.updatedAt).slice(0, limit); }
}

export class ReviewLeaseRepository {
  constructor(database, { now = () => Date.now() } = {}) { this.database = database; this.now = now; }
  async acquire(pairKey, ownerId, sessionId, ttlMs) { const id = pairKey; return this.database.transaction(["reviewLeases"], "readwrite", async (tx) => { const prior = await tx.get("reviewLeases", id); if (prior && prior.ownerId !== ownerId && prior.expiresAt > this.now()) return { acquired: false, lease: prior }; const lease = { id, languagePairKey: pairKey, ownerId, sessionId, acquiredAt: prior?.ownerId === ownerId ? prior.acquiredAt : this.now(), expiresAt: this.now() + ttlMs }; await tx.put("reviewLeases", lease); return { acquired: true, lease }; }); }
  async renew(pairKey, ownerId, ttlMs) { const prior = await this.database.get("reviewLeases", pairKey); if (!prior || prior.ownerId !== ownerId) return false; await this.database.put("reviewLeases", { ...prior, expiresAt: this.now() + ttlMs }); return true; }
  async release(pairKey, ownerId) { const prior = await this.database.get("reviewLeases", pairKey); if (prior?.ownerId === ownerId) await this.database.delete("reviewLeases", pairKey); }
}
