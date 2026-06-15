const LANGUAGE_SKILL_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2", "Native"];

function normalizeLanguageSkillLevel(value, fallback = "A1") {
  const text = String(value || fallback).trim();
  const upper = text.toUpperCase();
  const normalized = upper === "NATIVE" ? "Native" : upper;
  return LANGUAGE_SKILL_LEVELS.includes(normalized) ? normalized : fallback;
}

module.exports = { LANGUAGE_SKILL_LEVELS, normalizeLanguageSkillLevel };
