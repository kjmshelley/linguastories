export class StructuredLogger {
  constructor({ enabled = false, sink = globalThis.console } = {}) { this.enabled = enabled; this.sink = sink; }
  info(event, properties = {}) { if (this.enabled) this.sink.info?.("[LinguaStories]", { event, ...properties }); }
  error(event, properties = {}) { if (this.enabled) this.sink.error?.("[LinguaStories]", { event, ...properties }); }
}

export class BrowserQuotaAdapter {
  constructor(storage = globalThis.navigator?.storage) { this.storage = storage; }
  async estimate() { return this.storage?.estimate ? this.storage.estimate() : { usage: null, quota: null }; }
  async requestPersistent() { return this.storage?.persist ? this.storage.persist() : false; }
  async assertCapacity(requiredBytes) {
    const { usage, quota } = await this.estimate();
    if (Number.isFinite(usage) && Number.isFinite(quota) && quota - usage < requiredBytes * 1.15) throw Object.assign(new Error("There is not enough browser storage for this course."), { code: "INSUFFICIENT_STORAGE", requiredBytes, availableBytes: quota - usage });
    return { requiredBytes, availableBytes: Number.isFinite(quota) ? quota - (usage || 0) : null };
  }
}

export class BrowserConnectivityAdapter {
  constructor(target = globalThis) { this.target = target; this.listeners = new Set(); this.online = target.navigator?.onLine !== false; this.onOnline = () => this.set(true); this.onOffline = () => this.set(false); }
  start() { this.target.addEventListener?.("online", this.onOnline); this.target.addEventListener?.("offline", this.onOffline); }
  stop() { this.target.removeEventListener?.("online", this.onOnline); this.target.removeEventListener?.("offline", this.onOffline); }
  set(value) { this.online = value; for (const listener of this.listeners) listener(value); }
  subscribe(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener); }
}

export const DOWNLOAD_STATE_DETAILS = Object.freeze({
  not_installed: ["Not installed", "Download this course while online."], preparing: ["Preparing", "Checking storage and package details."],
  downloading: ["Downloading", "Saving the curriculum files to this device."], interrupted: ["Download interrupted", "Retry when your connection is ready."],
  validating_checksum: ["Verifying files", "Checking secure SHA-256 checksums."], validating_schema: ["Validating content", "Checking curriculum structure and stable references."],
  saving: ["Installing", "Activating the complete validated course."], installed: ["Ready offline", "This course is available without a connection."],
  update_available: ["Update available", "A newer curriculum version is ready to download."], updating: ["Updating", "Downloading a newer curriculum without replacing the current version yet."],
  update_failed: ["Update failed", "Your installed course is still available."], download_failed: ["Download failed", "No incomplete curriculum was activated."],
  unsupported_app_version: ["App update required", "This curriculum requires a newer LinguaStories app."], unsupported_schema_version: ["Unsupported curriculum", "This app cannot read the available curriculum schema."],
  offline: ["Offline", "Connect to download or update this course."], corrupted_local_content: ["Downloaded content needs repair", "Learning is paused until the content is repaired."], repair_available: ["Repair available", "Redownload the curriculum while preserving settings and progress."]
});
