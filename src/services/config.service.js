const { query } = require("../db/pool");

async function getSupportedLanguages() {
  const result = await query(
    `select code, name
       from supported_languages
      where active = true
      order by sort_order asc, code asc`
  );
  return result.rows.map((row) => ({ code: row.code, name: row.name }));
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

module.exports = { getPublicConfig, getSupportedLanguages, isSupportedLanguage };
