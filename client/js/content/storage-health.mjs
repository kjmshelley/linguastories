import { sha256Hex } from "./checksum.mjs";

export class StorageHealthService {
  constructor({ contentRepository, database, cryptoImpl = globalThis.crypto, logger = null }) { this.content = contentRepository; this.database = database; this.crypto = cryptoImpl; this.logger = logger; }
  async check(pairKey) {
    const active = await this.content.getActivePackage(pairKey);
    if (!active) return { healthy: false, code: "MISSING_ACTIVE_PACKAGE", repairable: true };
    const categories = await this.content.categoriesForVersion(pairKey, active.contentVersion);
    if (categories.length !== active.categoryCount) return this.recover(pairKey, "MISSING_CATEGORY_PACKAGE");
    for (const category of categories) {
      if (category.validationState !== "valid" || !category.content?.categories?.[0]) return this.recover(pairKey, "INVALID_STORED_SCHEMA");
      const checksum = await sha256Hex(JSON.stringify(category.content), this.crypto);
      if (category.localChecksum && checksum !== category.localChecksum) return this.recover(pairKey, "LOCAL_CHECKSUM_MISMATCH");
    }
    const pendingJobs = (await this.database.getAllByIndex("downloadJobs", "byLanguagePair", pairKey)).filter((item) => !["installed", "download_failed", "update_failed", "interrupted"].includes(item.status));
    return { healthy: true, code: pendingJobs.length ? "INCOMPLETE_DOWNLOAD_REMNANTS" : "HEALTHY", activeVersion: active.contentVersion, categoryCount: categories.length };
  }
  async recover(pairKey, code) { const rolledBack = await this.content.rollback(pairKey); this.logger?.error("content_corruption", { languagePairKey: pairKey, code, rolledBack }); return { healthy: rolledBack, code, rolledBack, repairable: true }; }
}
