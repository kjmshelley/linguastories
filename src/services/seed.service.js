const fs = require("fs");
const path = require("path");
const { query } = require("../db/pool");
const { fallbackSupportedLanguages } = require("./config.service");

const APP_USER_EMAIL = process.env.APP_USER_EMAIL;
const IS_PRODUCTION = process.env.NODE_ENV === "production" || process.env.APP_ENV === "PROD";
const AUTO_SEED = IS_PRODUCTION ? process.env.AUTO_SEED === "true" : process.env.AUTO_SEED !== "false";

async function ensureRuntimeColumns() {
  await query(`
    do $$
    begin
      if to_regclass('public.users') is not null then
        alter table users add column if not exists timezone text not null default 'UTC';
        alter table users add column if not exists site_language text not null default 'en-US';
        alter table users add column if not exists currency text not null default 'USD';
      end if;
      if to_regclass('public.teacher_profiles') is not null then
        alter table teacher_profiles add column if not exists professional_tutor boolean not null default true;
        alter table teacher_profiles add column if not exists speaking_practice_only boolean not null default false;
        if not exists (select 1 from teacher_profiles where speaking_practice_only = true) then
          with ranked_profiles as (
            select id, row_number() over (order by created_at, id) as row_number
              from teacher_profiles
             where status = 'published'
          )
          update teacher_profiles tp
             set speaking_practice_only = true,
                 professional_tutor = false
            from ranked_profiles rp
           where tp.id = rp.id
             and rp.row_number % 3 = 0;
        end if;
      end if;
    end $$
  `);
}

async function ensureSupportedLanguages() {
  const table = await query("select to_regclass('public.supported_languages') as table_name");
  if (!table.rows[0]?.table_name) return;
  const languages = fallbackSupportedLanguages();
  if (!languages.length) return;
  await query(
    `insert into supported_languages (code, name, sort_order, active)
     select *
       from unnest($1::text[], $2::text[], $3::int[], $4::boolean[])
          as incoming(code, name, sort_order, active)
     on conflict (code) do update
     set name = excluded.name,
         sort_order = excluded.sort_order,
         active = true`,
    [
      languages.map((language) => language.code),
      languages.map((language) => language.name),
      languages.map((_language, index) => index + 1),
      languages.map(() => true)
    ]
  );
  await query("update supported_languages set active = false where not (code = any($1::text[]))", [languages.map((language) => language.code)]);
}

async function seedIfNeeded() {
  if (!AUTO_SEED) return;
  if (!APP_USER_EMAIL) {
    throw new Error("APP_USER_EMAIL is required when AUTO_SEED is enabled.");
  }

  await ensureRuntimeColumns();
  await ensureSupportedLanguages();

  const existing = await query("select id from users where email = $1", [APP_USER_EMAIL]);
  if (existing.rowCount > 0) return;

  const seedPath = path.join(__dirname, "..", "..", "db", "seed.sql");
  const sql = fs.readFileSync(seedPath, "utf8");
  await query(sql);
}

module.exports = { seedIfNeeded };
