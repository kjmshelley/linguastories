export const SETTINGS_SCHEMA_VERSION = 1;

export const GLOBAL_SETTINGS_DEFAULTS = Object.freeze({
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  interfaceLanguage: "system",
  reducedMotion: "system",
  automaticChecks: true,
  automaticDownloads: false,
  manualOnly: false
});

export const PAIR_SETTINGS_DEFAULTS = Object.freeze({
  schemaVersion: SETTINGS_SCHEMA_VERSION,
  pinyinMode: "instructional",
  translationMode: "instructional",
  storyDisplay: "all",
  audioEnabled: true,
  audioSpeed: "normal",
  voiceURI: "",
  autoplayIntroductions: false,
  replayAudio: true,
  reviewSessionSize: "standard",
  reviewReminders: true,
  earlyReinforcement: true,
  preferTyping: false,
  reviewAudio: false,
  weakPriority: true
});

export const SETTING_OPTIONS = Object.freeze({
  interfaceLanguage: ["system", "en"],
  reducedMotion: ["system", "reduce", "no-preference"],
  pinyinMode: ["always", "instructional", "on_request", "hidden"],
  translationMode: ["instructional", "on_request", "hidden_story"],
  storyDisplay: ["chinese", "chinese_pinyin", "chinese_english", "all"],
  audioSpeed: ["slow", "normal", "fast"],
  reviewSessionSize: ["quick", "standard", "extended"]
});

const BOOLEAN_FIELDS = new Set(["automaticChecks", "automaticDownloads", "manualOnly", "audioEnabled", "autoplayIntroductions", "replayAudio", "reviewReminders", "earlyReinforcement", "preferTyping", "reviewAudio", "weakPriority"]);

function sanitized(source, defaults) {
  const value = source && typeof source === "object" ? source : {};
  const result = { ...defaults };
  const invalid = [];
  for (const key of Object.keys(defaults)) {
    if (key === "schemaVersion") continue;
    if (BOOLEAN_FIELDS.has(key)) {
      if (typeof value[key] === "boolean") result[key] = value[key];
      else if (value[key] !== undefined) invalid.push(key);
    } else if (key === "voiceURI") {
      if (typeof value[key] === "string" && value[key].length <= 500) result[key] = value[key];
      else if (value[key] !== undefined) invalid.push(key);
    } else if (SETTING_OPTIONS[key]?.includes(value[key])) result[key] = value[key];
    else if (value[key] !== undefined) invalid.push(key);
  }
  return { value: result, invalid };
}

export function validateGlobalSettings(value) { return sanitized(value, GLOBAL_SETTINGS_DEFAULTS); }
export function validatePairSettings(value) { return sanitized(value, PAIR_SETTINGS_DEFAULTS); }
export function globalSettingsKey() { return "globalPreferences"; }
export function pairSettingsKey(pairKey) {
  if (!/^[a-z]{2,3}-[A-Za-z]{4}_[a-z]{2,3}(?:-[A-Z]{2})?__[a-z]{2,3}(?:-[A-Z]{2})?$/.test(String(pairKey || ""))) throw Object.assign(new Error("Invalid language-pair key."), { code: "INVALID_LANGUAGE_PAIR" });
  return `pairPreferences:${pairKey}`;
}

export function audioRate(speed) { return { slow: 0.78, normal: 0.92, fast: 1.08 }[speed] || 0.92; }
