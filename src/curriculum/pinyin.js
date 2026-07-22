const fs = require("fs");
const path = require("path");

const VOWELS = {
  a: ["a", "ā", "á", "ǎ", "à"],
  e: ["e", "ē", "é", "ě", "è"],
  i: ["i", "ī", "í", "ǐ", "ì"],
  o: ["o", "ō", "ó", "ǒ", "ò"],
  u: ["u", "ū", "ú", "ǔ", "ù"],
  ü: ["ü", "ǖ", "ǘ", "ǚ", "ǜ"]
};

function normalizeSyllable(value) {
  return String(value || "").trim().toLowerCase().replace(/u:/g, "ü").replace(/v/g, "ü");
}

function markSyllable(raw) {
  const syllable = normalizeSyllable(raw);
  const match = syllable.match(/^([a-zü]+)([0-5])$/i);
  if (!match) return syllable;
  const plain = match[1];
  const tone = Number(match[2]);
  if (tone === 0 || tone === 5) return plain;
  let vowelIndex = plain.indexOf("a");
  if (vowelIndex < 0) vowelIndex = plain.indexOf("e");
  if (vowelIndex < 0 && plain.includes("ou")) vowelIndex = plain.indexOf("o");
  if (vowelIndex < 0) {
    for (let index = plain.length - 1; index >= 0; index -= 1) {
      if (VOWELS[plain[index]]) {
        vowelIndex = index;
        break;
      }
    }
  }
  if (vowelIndex < 0) return plain;
  const vowel = plain[vowelIndex];
  return `${plain.slice(0, vowelIndex)}${VOWELS[vowel][tone]}${plain.slice(vowelIndex + 1)}`;
}

function numberedPinyinToToneMarks(value) {
  return String(value || "")
    .trim()
    .split(/(\s+|\/)/)
    .map((part) => /[a-züv:]+[0-5]/i.test(part) ? markSyllable(part) : part.trim() === "/" ? "/" : part)
    .join("")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasToneMarks(value) {
  return /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u.test(String(value || ""));
}

function loadOverrides(configPath = path.join(__dirname, "..", "..", "curriculum", "config", "polyphonic-overrides.json")) {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function resolvePinyin(word, numberedPinyin, overrides = loadOverrides()) {
  const override = overrides.words?.[word];
  const source = override?.numberedPinyin || String(numberedPinyin || "").split("/")[0].trim();
  const pinyin = numberedPinyinToToneMarks(source);
  const reviewCharacters = overrides.reviewCharacters || [];
  const reasons = [];
  if (String(numberedPinyin || "").includes("/")) reasons.push("multiple-source-pronunciations");
  if ([...String(word || "")].some((character) => reviewCharacters.includes(character)) && !override) reasons.push("polyphonic-character-without-word-override");
  if (!pinyin || /\d/.test(pinyin)) reasons.push("invalid-tone-mark-output");
  return { pinyin, overrideApplied: Boolean(override), reviewRequired: reasons.length > 0, reasons };
}

module.exports = { hasToneMarks, loadOverrides, markSyllable, numberedPinyinToToneMarks, resolvePinyin };
