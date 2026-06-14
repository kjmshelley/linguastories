import { escapeHtml } from "./ui.js";

const fallbackLanguages = [
  { code: "en-US", name: "English (US)" },
  { code: "ja-JP", name: "Japanese (Standard)" },
  { code: "ko-KR", name: "Korean (South Korea)" },
  { code: "es-ES", name: "Spanish (Spain)" },
  { code: "fr-FR", name: "French (France)" },
  { code: "de-DE", name: "German (Germany)" }
];

function normalizeLanguage(language) {
  if (language && typeof language === "object") {
    const code = String(language.code || "").trim();
    return code ? { code, name: String(language.name || code).trim() || code } : null;
  }
  const code = String(language || "").trim();
  return code ? { code, name: code } : null;
}

export function supportedLanguageOptions(appConfig = {}) {
  const languages = Array.isArray(appConfig.supportedLanguages) && appConfig.supportedLanguages.length ? appConfig.supportedLanguages : fallbackLanguages;
  return languages.map(normalizeLanguage).filter(Boolean);
}

export function languageName(appConfig = {}, code = "") {
  const value = String(code || "").trim();
  if (!value) return "";
  return supportedLanguageOptions(appConfig).find((language) => language.code === value)?.name || value;
}

export function languageNameList(appConfig = {}, codes = []) {
  return codes.map((code) => languageName(appConfig, code)).join(", ");
}

export function languageSelectOptions(appConfig = {}, selected = "", { placeholder = "" } = {}) {
  const current = String(selected || "");
  const options = supportedLanguageOptions(appConfig).map(
    (language) => `<option value="${escapeHtml(language.code)}" ${language.code === current ? "selected" : ""}>${escapeHtml(language.name)}</option>`
  );
  if (placeholder) {
    options.unshift(`<option value="" disabled ${current ? "" : "selected"}>${escapeHtml(placeholder)}</option>`);
  }
  return options.join("");
}

export function languageMultiSelectOptions(appConfig = {}, selected = []) {
  const selectedCodes = new Set(selected);
  return supportedLanguageOptions(appConfig)
    .map((language) => `<option value="${escapeHtml(language.code)}" ${selectedCodes.has(language.code) ? "selected" : ""}>${escapeHtml(language.name)}</option>`)
    .join("");
}
