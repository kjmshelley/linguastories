const fs = require("fs");
const path = require("path");
const { query } = require("../db/pool");

let fallbackLanguagesCache = null;

function fallbackSupportedLanguages() {
  if (fallbackLanguagesCache) return fallbackLanguagesCache;
  const languageFile = path.join(__dirname, "..", "..", "client", "js", "languages.js");
  const source = fs.readFileSync(languageFile, "utf8");
  fallbackLanguagesCache = [...source.matchAll(/\{\s*code:\s*"([^"]+)",\s*name:\s*"([^"]+)"\s*\}/g)].map((match, index) => ({
    code: match[1],
    name: match[2],
    sortOrder: index + 1
  }));
  return fallbackLanguagesCache;
}

async function getSupportedLanguages() {
  const result = await query(
    `select code, name, sort_order as "sortOrder"
       from supported_languages
      where active = true
      order by sort_order asc, code asc`
  );
  const rows = result.rows.map((row) => ({ code: row.code, name: row.name, sortOrder: row.sortOrder }));
  const staleCatalog = rows.length < 100 || rows.some((row) => row.name.includes("(") || row.name.includes(")"));
  return staleCatalog ? fallbackSupportedLanguages().map(({ code, name }) => ({ code, name })) : rows.map(({ code, name }) => ({ code, name }));
}

async function isSupportedLanguage(language) {
  if (!language) return false;
  const result = await query(
    `select 1
       from supported_languages
      where active = true and code = $1`,
    [language]
  );
  return result.rowCount > 0;
}

async function getPublicConfig() {
  return {
    supportedLanguages: await getSupportedLanguages()
  };
}

module.exports = { fallbackSupportedLanguages, getPublicConfig, getSupportedLanguages, isSupportedLanguage };
