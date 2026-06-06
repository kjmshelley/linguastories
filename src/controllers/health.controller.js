const { query } = require("../db/pool");

async function health(_req, res) {
  await query("select 1");
  res.json({ ok: true, database: "postgres-connected" });
}

module.exports = { health };
