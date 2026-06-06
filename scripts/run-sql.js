const fs = require("fs");
const { Pool } = require("pg");

const file = process.argv[2];

if (!file) {
  throw new Error("Usage: node scripts/run-sql.js <sql-file>");
}

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

async function main() {
  const sql = fs.readFileSync(file, "utf8");
  await pool.query(sql);
  console.log(`Executed ${file}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
