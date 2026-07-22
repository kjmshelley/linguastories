import { ReviewService } from "./review-service.mjs";

function reviewOwnerId(storage = globalThis.sessionStorage) {
  const key = "linguaStoriesReviewTabId";
  try { const prior = storage?.getItem(key); if (prior) return prior; const value = `review-tab-${globalThis.crypto?.randomUUID?.() || Date.now()}`; storage?.setItem(key, value); return value; } catch (_error) { return `review-tab-${Date.now()}`; }
}

class ReviewEventBus { constructor() { this.listeners = new Set(); } subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); } emit(event) { for (const listener of this.listeners) listener(event); } }

export class ReviewRuntime {
  constructor({ channelFactory = (name) => typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(name), now = () => Date.now() } = {}) { this.ownerId = reviewOwnerId(); this.channelFactory = channelFactory; this.now = now; this.listeners = new Set(); this.state = { initialized: false, dashboard: null, session: null, error: null }; }
  snapshot() { return { ...this.state }; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { for (const listener of this.listeners) listener(this.snapshot()); }
  async initialize({ database, pairKey, preferences = () => ({}) }) { this.database = database; this.pairKey = pairKey; this.events = new ReviewEventBus(); this.service = new ReviewService({ database, pairKey, ownerId: this.ownerId, now: this.now, events: this.events, preferences }); this.events.subscribe((event) => { this.channel?.postMessage({ ...event, ownerId: this.ownerId, languagePairKey: pairKey }); void this.refresh(); }); this.channel = this.channelFactory(`linguastories-review:${pairKey}`); if (this.channel) this.channel.onmessage = (event) => { if (event.data?.ownerId !== this.ownerId) void this.refresh(); }; await this.refresh(); this.state.initialized = true; this.notify(); return this.snapshot(); }
  async refresh() { if (!this.service) return this.snapshot(); const dashboard = await this.service.dashboard(); const current = this.state.session; const session = current?.status === "completed" ? current : current && dashboard.activeSession?.id === current.id ? dashboard.activeSession : null; this.state = { ...this.state, dashboard, session, error: null }; this.notify(); return this.snapshot(); }
  async start(options) { try { const result = await this.service.start(options); this.state.session = result.session; this.state.error = null; await this.refresh(); return result; } catch (error) { this.state.error = error; this.notify(); throw error; } }
  async respond(input) { const result = await this.service.respond(input); this.state.session = result.session; await this.refresh(); return result; }
  async continue() { if (!this.state.session) return null; const session = await this.service.continue(this.state.session.id); this.state.session = session; await this.refresh(); return session; }
  async pause() { if (this.state.session) await this.service.pause(this.state.session.id); this.state.session = null; await this.refresh(); }
  clearCompleted() { this.state.session = null; this.notify(); }
  migrate(input) { return this.service.migrate(input).then(() => this.refresh()); }
  destroy() { this.channel?.close(); this.listeners.clear(); }
}
