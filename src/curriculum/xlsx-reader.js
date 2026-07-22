const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

function decodeXml(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function unzipText(filePath, entry, { optional = false } = {}) {
  try {
    return execFileSync("unzip", ["-p", filePath, entry], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (optional) return "";
    throw new Error(`Unable to read ${entry} from ${path.basename(filePath)}: ${error.message}`);
  }
}

function attributes(xml) {
  const result = {};
  for (const match of String(xml).matchAll(/([\w:.-]+)="([^"]*)"/g)) result[match[1]] = decodeXml(match[2]);
  return result;
}

function columnIndex(reference) {
  const letters = String(reference || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() || "A";
  let index = 0;
  for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
  return index - 1;
}

function parseSharedStrings(xml) {
  const values = [];
  for (const item of String(xml).matchAll(/<(?:\w+:)?si\b[^>]*>([\s\S]*?)<\/(?:\w+:)?si>/g)) {
    values.push([...item[1].matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((match) => decodeXml(match[1])).join(""));
  }
  return values;
}

function parseCellValue(cellXml, attrs, sharedStrings) {
  const type = attrs.t || "n";
  if (type === "inlineStr") {
    return [...cellXml.matchAll(/<(?:\w+:)?t\b[^>]*>([\s\S]*?)<\/(?:\w+:)?t>/g)].map((match) => decodeXml(match[1])).join("");
  }
  const raw = cellXml.match(/<(?:\w+:)?v\b[^>]*>([\s\S]*?)<\/(?:\w+:)?v>/)?.[1];
  if (raw === undefined) return null;
  const decoded = decodeXml(raw);
  if (type === "s") return sharedStrings[Number(decoded)] ?? decoded;
  if (type === "b") return decoded === "1";
  if (type === "n" && decoded !== "" && Number.isFinite(Number(decoded))) return Number(decoded);
  return decoded;
}

function parseWorksheet(xml, sharedStrings) {
  const rowsByNumber = new Map();
  let maximumColumn = 0;
  let maximumRow = 0;
  for (const rowMatch of String(xml).matchAll(/<(?:\w+:)?row\b([^>]*)>([\s\S]*?)<\/(?:\w+:)?row>/g)) {
    const rowAttrs = attributes(rowMatch[1]);
    const rowNumber = Number(rowAttrs.r) || maximumRow + 1;
    const values = [];
    for (const cellMatch of rowMatch[2].matchAll(/<(?:\w+:)?c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/(?:\w+:)?c>)/g)) {
      const cellAttrs = attributes(cellMatch[1]);
      const index = columnIndex(cellAttrs.r || "A1");
      values[index] = parseCellValue(cellMatch[2] || "", cellAttrs, sharedStrings);
      maximumColumn = Math.max(maximumColumn, index + 1);
    }
    rowsByNumber.set(rowNumber, { rowNumber, values });
    maximumRow = Math.max(maximumRow, rowNumber);
  }
  const rows = [];
  for (let rowNumber = 1; rowNumber <= maximumRow; rowNumber += 1) {
    const row = rowsByNumber.get(rowNumber) || { rowNumber, values: [] };
    row.values = Array.from({ length: maximumColumn }, (_unused, index) => row.values[index] ?? null);
    rows.push(row);
  }
  return { rows, maximumColumn, maximumRow };
}

function inspectWorkbook(filePath) {
  const resolved = path.resolve(filePath);
  if (!resolved.toLowerCase().endsWith(".xlsx")) throw new Error("Curriculum source must be an .xlsx workbook");
  if (!fs.existsSync(resolved)) throw new Error(`Workbook not found: ${resolved}`);
  const workbookXml = unzipText(resolved, "xl/workbook.xml");
  const relationshipsXml = unzipText(resolved, "xl/_rels/workbook.xml.rels");
  const sharedStrings = parseSharedStrings(unzipText(resolved, "xl/sharedStrings.xml", { optional: true }));
  const relationships = new Map();
  for (const match of relationshipsXml.matchAll(/<(?:\w+:)?Relationship\b([^>]*?)(?:\/>|>)/g)) {
    const attrs = attributes(match[1]);
    relationships.set(attrs.Id, attrs.Target);
  }
  const sheets = [];
  for (const match of workbookXml.matchAll(/<(?:\w+:)?sheet\b([^>]*?)(?:\/>|>)/g)) {
    const attrs = attributes(match[1]);
    const target = relationships.get(attrs["r:id"]);
    if (!target) continue;
    const entry = target.startsWith("/") ? target.slice(1) : `xl/${target.replace(/^\.\//, "")}`;
    const parsed = parseWorksheet(unzipText(resolved, entry), sharedStrings);
    sheets.push({ name: attrs.name, id: attrs.sheetId, entry, ...parsed });
  }
  return { filePath: resolved, worksheetNames: sheets.map((sheet) => sheet.name), sheets };
}

module.exports = { columnIndex, decodeXml, inspectWorkbook, parseWorksheet };
