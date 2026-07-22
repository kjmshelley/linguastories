export function parseSemanticVersion(value) {
  const match = String(value || "").match(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-([0-9A-Za-z.-]+))?$/);
  if (!match) throw Object.assign(new Error(`Invalid semantic version: ${value}`), { code: "INVALID_VERSION" });
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), prerelease: match[4] || "" };
}

export function compareVersions(left, right) {
  const a = parseSemanticVersion(left); const b = parseSemanticVersion(right);
  for (const key of ["major", "minor", "patch"]) if (a[key] !== b[key]) return a[key] > b[key] ? 1 : -1;
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease.localeCompare(b.prerelease);
}

export function compatibilityStatus(language, { appVersion, supportedSchemas }) {
  if (compareVersions(language.minimumAppVersion || "0.0.0", appVersion) > 0) return "unsupported_app_version";
  if (!supportedSchemas.includes(language.schemaVersion)) return "unsupported_schema_version";
  return "compatible";
}
