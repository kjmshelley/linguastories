const { Pool } = require("pg");

const requiredDbVars = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
const missingDbVars = requiredDbVars.filter((name) => !process.env[name]);

if (missingDbVars.length) {
  throw new Error(`Missing required database env vars: ${missingDbVars.join(", ")}`);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: false } : false
});

async function query(sql, params = []) {
  return pool.query(sql, params);
}

module.exports = { pool, query };
