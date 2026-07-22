import { ProgressEventBus, ProgressService } from "./progress-service.mjs";
import { upgradeLessonSession } from "../lesson-engine/session.mjs";

function ownerId(storage = globalThis.sessionStorage) {
  const key = "linguaStoriesProgressTabId";
  try {
    const existing = storage?.getItem(key); if (existing) return existing;
    const created = `tab-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`; storage?.setItem(key, created); return created;
  } catch (_error) { return `tab-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
}

function initialState() {
  return { initialized: false, categories: [], snapshot: null, categorySnapshots: new Map(), continueTarget: null, error: null };
}

export class ProgressRuntime {
  constructor({ channelFactory = (name) => typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(name) } = {}) {
    this.ownerId = ownerId(); this.channelFactory = channelFactory; this.state = initialState(); this.listeners = new Set(); this.refreshing = null;
  }
  snapshot() { return { ...this.state, categorySnapshots: this.state.categorySnapshots }; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { for (const listener of this.listeners) listener(this.snapshot()); }
  async initialize({ database, pairKey, categories = [], sessions }) {
    this.database = database; this.pairKey = pairKey; this.categories = categories; this.sessions = sessions;
    this.events = new ProgressEventBus();
    this.service = new ProgressService({ database, pairKey, ownerId: this.ownerId, eventBus: this.events });
    this.events.subscribe((event) => { this.broadcast(event); void this.refresh(); });
    this.channel = this.channelFactory(`linguastories-progress:${pairKey}`);
    if (this.channel) this.channel.onmessage = (event) => { if (event.data?.ownerId !== this.ownerId) { if (event.data?.type === "progress_reset") globalThis.dispatchEvent?.(new CustomEvent("linguastories-progress-reset", { detail: event.data })); void this.refresh(); } };
    await this.refresh(); this.state.initialized = true; this.notify(); return this.snapshot();
  }
  setCategories(categories = []) { this.categories = categories; return this.refresh(); }
  broadcast(event) { this.channel?.postMessage({ ownerId: this.ownerId, type: event.type, languagePairKey: this.pairKey, timestamp: Date.now() }); }
  async refresh() {
    if (!this.service) return this.snapshot();
    if (this.refreshing) return this.refreshing;
    this.refreshing = (async () => {
      const snapshot = await this.service.snapshot(this.categories);
      const sessionRecords = await this.database.getAllByIndex("lessonSessions", "byLanguagePair", this.pairKey);
      const resumable = sessionRecords.filter((record) => ["intro", "active", "feedback", "paused"].includes(record.session?.status));
      const continueTarget = await this.service.continueTarget(this.categories, snapshot, resumable);
      this.state = { ...this.state, categories: this.categories, snapshot, continueTarget, error: null };
      this.notify(); return this.snapshot();
    })().catch((error) => { this.state.error = error; this.notify(); throw error; }).finally(() => { this.refreshing = null; });
    return this.refreshing;
  }
  categoryState(categoryId) { return this.state.snapshot?.categoryStates?.states?.get(categoryId) || { accessStatus: "locked", completionStatus: "not_started" }; }
  async loadCategory(bundle) {
    const categorySnapshot = await this.service.categorySnapshot(bundle);
    const next = new Map(this.state.categorySnapshots); next.set(bundle.categories[0].slug, categorySnapshot); this.state.categorySnapshots = next; this.notify(); return categorySnapshot;
  }
  categorySnapshot(slug) { return this.state.categorySnapshots.get(slug) || null; }
  async prepareLesson(bundle, lesson, savedSession = null, { replay = false } = {}) {
    const category = bundle.categories[0];
    const categoryState = this.categoryState(category.id);
    if (categoryState.accessStatus !== "available" && categoryState.completionStatus !== "completed") throw Object.assign(new Error("Complete the previous category to unlock this lesson."), { code: "CATEGORY_LOCKED" });
    const categorySnapshot = this.categorySnapshot(category.slug) || await this.loadCategory(bundle); const access = this.service.unlocks.checkLessonAccess(lesson, bundle.lessons, categorySnapshot.records);
    if (access.error) throw Object.assign(new Error("The curriculum prerequisite chain is invalid."), { code: access.error.code, details: access.error });
    if (!access.allowed) throw Object.assign(new Error("Complete the previous lesson to unlock this one."), { code: "LESSON_LOCKED" });
    const prepared = await this.service.attemptService.prepare({ bundle, lesson, savedSession, replay });
    const restoreSaved = savedSession && savedSession.status !== "results";
    return { ...prepared, session: restoreSaved ? upgradeLessonSession(savedSession, { attemptId: prepared.attempt.id, sessionId: prepared.attempt.sessionId, attempt: prepared.attempt.attemptNumber }) : null };
  }
  completeLesson(bundle, lesson, session, sequence) { return this.service.completion.complete({ bundle, lesson, session, sequence, categories: this.categories }); }
  pauseAttempt(attemptId) { return this.service.attemptService.pause(attemptId); }
  resumeAttempt(attemptId) { return this.service.attemptService.resume(attemptId); }
  releaseLesson(lessonId) { return this.service.attemptService.release(lessonId); }
  reset() { return this.service.resetter.resetLanguage(this.pairKey).then(() => this.refresh()); }
  async migrate(fromVersion, toVersion, migration = {}) {
    const records = await this.database.getAllByIndex("curriculumCategories", "byLanguageVersion", `${this.pairKey}:${toVersion}`);
    const ids = new Set(); for (const record of records) { for (const collection of ["categories", "lessons", "words", "dialogues", "stories", "exercises"]) for (const item of record.content[collection] || []) ids.add(item.id); for (const word of record.content.words || []) for (const field of ["collocations", "phrases", "sentences"]) for (const item of word[field] || []) ids.add(item.id); }
    return this.service.migrations.migrate({ pairKey: this.pairKey, fromVersion, toVersion, currentEntityIds: ids, migration });
  }
  destroy() { this.channel?.close(); this.listeners.clear(); }
}
