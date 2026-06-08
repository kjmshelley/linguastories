const fs = require("fs");
const path = require("path");
const { query } = require("../db/pool");

const APP_USER_EMAIL = process.env.APP_USER_EMAIL;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.APP_ENV === "PROD";
const AUTO_SEED = IS_PRODUCTION ? process.env.AUTO_SEED === "true" : process.env.AUTO_SEED !== "false";

async function seedIfNeeded() {
  if (!AUTO_SEED) return;
  if (!APP_USER_EMAIL) {
    throw new Error("APP_USER_EMAIL is required when AUTO_SEED is enabled.");
  }

  const existing = await query("select id from users where email = $1", [APP_USER_EMAIL]);
  if (existing.rowCount > 0) return;

  const seedPath = path.join(__dirname, "..", "..", "db", "seed.sql");
  const sql = fs.readFileSync(seedPath, "utf8");
  await query(sql);
}

module.exports = { seedIfNeeded };
