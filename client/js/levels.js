export const languageSkillLevels = [
  ["A1", "Newbie"],
  ["A2", "Beginner"],
  ["B1", "Intermediate"],
  ["B2", "High Intermediate"],
  ["C1", "Advanced"],
  ["C2", "Fluent"],
  ["Native", "Native"]
];

export const languageSkillLevelCodes = languageSkillLevels.map(([code]) => code);

export function languageSkillLevelLabel(code = "A1") {
  const value = String(code || "A1");
  const match = languageSkillLevels.find(([level]) => level === value);
  return match ? `${match[0]} - ${match[1]}` : value;
}

export function languageSkillLevelOptions(selected = "A1") {
  const current = String(selected || "A1");
  return languageSkillLevels
    .map(([code, label]) => `<option value="${code}" ${code === current ? "selected" : ""}>${code} - ${label}</option>`)
    .join("");
}
