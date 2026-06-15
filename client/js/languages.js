import { escapeHtml } from "./ui.js";

const fallbackLanguages = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "ar-SA", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "my", name: "Burmese" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "zh-CN", name: "Chinese" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl-NL", name: "Dutch" },
  { code: "en-US", name: "English" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "fil", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fr-FR", name: "French" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "de-DE", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "he", name: "Hebrew" },
  { code: "hi-IN", name: "Hindi" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "id-ID", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it-IT", name: "Italian" },
  { code: "ja-JP", name: "Japanese" },
  { code: "jv", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "ko-KR", name: "Korean" },
  { code: "ku", name: "Kurdish" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "ny", name: "Nyanja" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "pl-PL", name: "Polish" },
  { code: "pt-PT", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru-RU", name: "Russian" },
  { code: "sm", name: "Samoan" },
  { code: "gd", name: "Scottish Gaelic" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "es-ES", name: "Spanish" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv-SE", name: "Swedish" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th-TH", name: "Thai" },
  { code: "tr-TR", name: "Turkish" },
  { code: "uk-UA", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "uz", name: "Uzbek" },
  { code: "vi-VN", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
  { code: "ak", name: "Akan" },
  { code: "as", name: "Assamese" },
  { code: "ay", name: "Aymara" },
  { code: "bm", name: "Bambara" },
  { code: "bho", name: "Bhojpuri" },
  { code: "co", name: "Corsican" },
  { code: "dv", name: "Divehi" },
  { code: "ee", name: "Ewe" },
  { code: "fy", name: "Frisian" },
  { code: "rw", name: "Kinyarwanda" }
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
  return languages
    .map(normalizeLanguage)
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
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
