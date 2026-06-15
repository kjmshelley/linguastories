const { pool } = require("../src/db/pool");

function usage() {
  return [
    "Usage:",
    "  node scripts/approve-teacher-profile.js --id <teacher-profile-id>",
    "  node scripts/approve-teacher-profile.js <teacher-profile-id>"
  ].join("\n");
}

function profileIdFromArgs(argv) {
  const idIndex = argv.findIndex((arg) => arg === "--id" || arg === "--profile-id" || arg === "--teacher-profile-id");
  if (idIndex !== -1) return argv[idIndex + 1] || "";
  return argv.find((arg) => !arg.startsWith("--")) || "";
}

async function main() {
  const profileId = profileIdFromArgs(process.argv.slice(2));
  if (!profileId) throw new Error(usage());

  const result = await pool.query(
    `update teacher_profiles tp
        set status = 'published',
            updated_at = now()
       from users u
      where tp.user_id = u.id
        and tp.id = $1
      returning tp.id,
                tp.display_name as "displayName",
                tp.status,
                u.email as "ownerEmail"`,
    [profileId]
  );

  const profile = result.rows[0];
  if (!profile) throw new Error(`Teacher profile not found: ${profileId}`);

  console.log(`Approved teacher profile ${profile.id}`);
  console.log(`Display name: ${profile.displayName}`);
  console.log(`Owner email: ${profile.ownerEmail}`);
  console.log(`Status: ${profile.status}`);
}

main()
  .catch((error) => {
    console.error(error.message || error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
