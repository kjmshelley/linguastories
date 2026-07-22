export class LessonSessionRepository {
  load(_key) { return null; }
  save(_key, _session) {}
  remove(_key) {}
}

export class LocalStorageLessonSessionRepository extends LessonSessionRepository {
  constructor(storage = globalThis.localStorage, prefix = "linguaStoriesLessonSession") {
    super(); this.storage = storage; this.prefix = prefix;
  }
  storageKey(key) { return `${this.prefix}:${key}`; }
  load(key) {
    try { return JSON.parse(this.storage?.getItem(this.storageKey(key)) || "null"); } catch (_error) { return null; }
  }
  save(key, session) {
    try { this.storage?.setItem(this.storageKey(key), JSON.stringify(session)); } catch (_error) { /* A later repository can surface quota errors. */ }
  }
  remove(key) {
    try { this.storage?.removeItem(this.storageKey(key)); } catch (_error) { /* Ignore unavailable storage. */ }
  }
}
