const { tables } = require("../admin/config/tables");

const baseUrl = process.env.ADMIN_BASE_URL || "http://127.0.0.1:3000";
const fakeId = "00000000-0000-0000-0000-000000000000";

async function postForm(path) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ __admin_form_probe: "1" }),
    redirect: "manual"
  });
  const body = await response.text();
  return { status: response.status, body };
}

async function main() {
  const checks = [];

  for (const table of tables) {
    checks.push({ label: `${table.slug} create`, path: `/admin/tables/${table.slug}` });
    checks.push({ label: `${table.slug} edit`, path: `/admin/tables/${table.slug}/${fakeId}/edit` });
    checks.push({ label: `${table.slug} delete`, path: `/admin/tables/${table.slug}/${fakeId}/delete` });
  }

  const failures = [];

  for (const check of checks) {
    const result = await postForm(check.path);
    const hasJsonContentTypeError = result.status === 415 && result.body.includes("Content-Type must be application/json");
    const ok = !hasJsonContentTypeError;
    console.log(`${ok ? "ok" : "fail"} ${check.label} -> ${result.status}`);

    if (!ok) {
      failures.push(`${check.label} returned JSON content-type rejection.`);
    }
  }

  if (failures.length) {
    throw new Error(failures.join("\n"));
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
