import { globalSettingsKey, pairSettingsKey, validateGlobalSettings, validatePairSettings } from "./model.mjs";

export class LearningSettingsService {
  constructor({ repository, pairKey, logger = console, channelFactory = (name) => typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(name) } = {}) {
    this.repository = repository; this.pairKey = pairKey; this.logger = logger; this.listeners = new Set(); this.channel = channelFactory?.("linguastories-settings") || null;
    this.channel && (this.channel.onmessage = (event) => { if (event.data?.type === "settings_changed") void this.load().then(() => this.notify()); });
  }
  async load() {
    const [globalRecord, pairRecord] = await Promise.all([this.repository.get(globalSettingsKey()), this.repository.get(pairSettingsKey(this.pairKey))]);
    const globalResult = validateGlobalSettings(globalRecord); const pairResult = validatePairSettings(pairRecord);
    if (globalResult.invalid.length || pairResult.invalid.length) this.logger?.warn?.("Invalid settings were replaced with safe defaults.", { global: globalResult.invalid, pair: pairResult.invalid });
    this.state = { global: globalResult.value, pair: pairResult.value, error: null }; return this.snapshot();
  }
  snapshot() { return { global: { ...(this.state?.global || validateGlobalSettings().value) }, pair: { ...(this.state?.pair || validatePairSettings().value) }, error: this.state?.error || null }; }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
  notify() { const value = this.snapshot(); for (const listener of this.listeners) listener(value); }
  async update(scope, patch) {
    const prior = this.snapshot(); const validator = scope === "global" ? validateGlobalSettings : validatePairSettings; const key = scope === "global" ? globalSettingsKey() : pairSettingsKey(this.pairKey);
    const result = validator({ ...prior[scope], ...patch });
    if (result.invalid.length) throw Object.assign(new Error(`Unsupported ${result.invalid.join(", ")} setting.`), { code: "INVALID_SETTING", fields: result.invalid });
    try { await this.repository.set(key, result.value); this.state = { ...prior, [scope]: result.value, error: null }; this.channel?.postMessage({ type: "settings_changed", scope, pairKey: this.pairKey }); this.notify(); return result.value; }
    catch (error) { this.state = { ...prior, error: "Settings could not be saved. Your previous preferences are still active." }; this.notify(); throw error; }
  }
  destroy() { this.channel?.close?.(); this.listeners.clear(); }
}
