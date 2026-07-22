export const DATABASE_NAME = "linguastories-learning";
export const DATABASE_VERSION = 4;
export const APP_VERSION = "1.0.0";
export const SUPPORTED_SCHEMA_VERSIONS = Object.freeze(["1.0.0"]);
export const DEFAULT_LANGUAGE_PAIR = Object.freeze({
  key: "zh-Hant_zh-TW__en",
  targetLanguage: "zh-TW",
  targetScript: "Hant",
  targetLocale: "zh-TW",
  sourceLanguage: "en",
  sourceLocale: "en"
});

export function languagePairKey(value = DEFAULT_LANGUAGE_PAIR) {
  const script = String(value.targetScript || "Zzzz");
  return `${String(value.targetLanguage).split("-")[0]}-${script}_${value.targetLocale}__${value.sourceLocale || value.sourceLanguage}`;
}

export class ProgressRepository { async get(_id) { return null; } async put(_record) {} }
export class ReviewRepository { async due(_languagePairKey, _now) { return []; } }
export class SyncRepository { async enqueue(_record) {} async pending() { return []; } }
export class ProgressSyncAdapter { async publish(_records) { return { accepted: [], deferred: true }; } }
export class ContentCompatibilityService {
  compare(previous, next) {
    return { previousVersion: previous?.contentVersion || null, nextVersion: next?.contentVersion || null, stableIdsPreserved: true, requiresReviewReset: Boolean(next?.migration?.requiresReviewReset), requiresLessonRestart: Boolean(next?.migration?.requiresLessonRestart) };
  }
}
