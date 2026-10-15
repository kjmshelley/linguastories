const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { generateCurriculum, loadFoundation } = require("./generator");
const { parseCurriculumWorkbook } = require("./parser");
const { validateCurriculum, validateManifest } = require("./validator");

const ROOT = path.join(__dirname, "..", "..");
const DEFAULT_SOURCE = path.join(ROOT, "sent", "chinese_words_categorized_expanded.xlsx");
const GENERATED_ROOT = path.join(ROOT, "content", "generated");
const REPORT_ROOT = path.join(ROOT, "content", "reports");
const VERSION = "1.1.0";
const PACKAGE_ROOT = path.join(GENERATED_ROOT, "zh-TW", "en", `v${VERSION}`);
const CURRICULUM_PATH = path.join(PACKAGE_ROOT, "curriculum.json");
const VOCABULARY_PATH = path.join(PACKAGE_ROOT, "vocabulary.normalized.json");
const STATE_PATH = path.join(GENERATED_ROOT, ".generation-state.json");
const MANIFEST_PATH = path.join(GENERATED_ROOT, "manifest.json");

function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stableJson(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function writeIfChanged(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const text = typeof content === "string" ? content : stableJson(content);
  if (fs.existsSync(filePath) && fs.readFileSync(filePath, "utf8") === text) return false;
  const temporary = `${filePath}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, text);
  fs.renameSync(temporary, filePath);
  return true;
}

function readJson(filePath, fallback = null) {
  return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : fallback;
}

function countBy(items, key) {
  const counts = {};
  for (const item of items) counts[item[key] || "unknown"] = (counts[item[key] || "unknown"] || 0) + 1;
  return counts;
}

function markdownTable(headers, rows) {
  const escape = (value) => String(value ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
  return [`| ${headers.map(escape).join(" | ")} |`, `| ${headers.map(() => "---").join(" | ")} |`, ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`)].join("\n");
}

function spreadsheetQualityMarkdown(normalized) {
  const q = normalized.quality;
  const warningRows = Object.entries(countBy(q.warnings, "code")).sort((a, b) => b[1] - a[1]);
  return `# Spreadsheet quality report\n\nSource: \`${normalized.source.file}\`  \nWorksheets: ${normalized.source.worksheetNames.join(", ")}  \nVocabulary worksheet: ${normalized.source.vocabularyWorksheet}, header row ${normalized.source.headerRow}\n\n## Result\n\n- Accepted rows: ${q.acceptedRowCount}\n- Rejected rows: ${q.rejectedRowCount}\n- Empty rows: ${q.emptyRows.length}\n- Duplicate normalized words: ${q.duplicateWordCount}\n- Duplicate category-guide labels: ${q.duplicateCategoryCount}\n- Errors: ${q.errorCount}\n- Warnings: ${q.warningCount}\n\n## Warning classes\n\n${markdownTable(["Code", "Count"], warningRows)}\n\nNo malformed row is silently discarded; rejected rows and repaired source values are retained in the machine-readable report.\n`;
}

function curriculumOrderMarkdown(curriculum) {
  return `# Curriculum order report\n\nCategories are ordered by foundational utility, frequency and concreteness before situational, abstract, or institution-specific language. Difficulty rises from 1 to 10.\n\n${markdownTable(["Order", "Category", "Difficulty", "Words", "Lessons", "Rationale"], curriculum.categories.map((category) => [category.order, category.name, category.difficulty, category.wordCount, category.lessonIds.length, category.rationale]))}\n`;
}

function coverageMarkdown(curriculum) {
  return `# Vocabulary coverage report\n\nOverall tracked vocabulary reuse: **${curriculum.statistics.overallVocabularyReusePercentage}%**. Lessons below 90% are not publishable.\n\n${markdownTable(["Lesson", "Meaningful references", "Covered references", "Reuse", "Publishable"], curriculum.coverage.map((item) => [item.lessonId, item.meaningfulTokenReferences, item.coveredTokenReferences, `${item.reusePercentage}%`, item.publishable ? "yes" : "no"]))}\n`;
}

function supportingVocabularyReport(curriculum) {
  const counts = new Map(curriculum.foundationalVocabulary.map((item) => [item.id, 0]));
  const lines = [
    ...curriculum.words.flatMap((word) => [...word.collocations, ...word.phrases, ...word.sentences]),
    ...curriculum.dialogues.flatMap((dialogue) => dialogue.turns),
    ...curriculum.stories.flatMap((story) => story.lines)
  ];
  for (const line of lines) for (const id of line.foundationalVocabularyReferences || []) counts.set(id, (counts.get(id) || 0) + 1);
  return curriculum.foundationalVocabulary.map((item) => ({ ...item, generatedContentReferences: counts.get(item.id) || 0 }));
}

function writeReports(normalized, curriculum, validation, manifest) {
  const qualityReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, source: normalized.source, ...normalized.quality };
  const orderReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, categories: curriculum.categories.map(({ id, name, order, difficulty, wordCount, lessonIds, rationale }) => ({ id, name, order, difficulty, wordCount, lessonCount: lessonIds.length, rationale })) };
  const generationReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, version: curriculum.curriculumVersion, statistics: curriculum.statistics, package: manifest.languages[0] };
  const coverageReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, overallVocabularyReusePercentage: curriculum.statistics.overallVocabularyReusePercentage, lessons: curriculum.coverage };
  const supportingReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, items: supportingVocabularyReport(curriculum) };
  const pinyinWarnings = normalized.quality.warnings.filter((warning) => warning.code === "pinyin-review" || warning.code === "missing-source-pinyin-repaired");
  const pinyinReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, warningCount: pinyinWarnings.length, warnings: pinyinWarnings };
  const humanReviewReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, itemCount: validation.reviewItems.length, items: validation.reviewItems };
  const validationReport = { schemaVersion: "1.0.0", generatedAt: curriculum.generatedAt, valid: validation.valid, errorCount: validation.errors.length, warningCount: validation.warnings.length, errors: validation.errors, warnings: validation.warnings };

  writeIfChanged(path.join(REPORT_ROOT, "spreadsheet-quality.json"), qualityReport);
  writeIfChanged(path.join(REPORT_ROOT, "spreadsheet-quality.md"), spreadsheetQualityMarkdown(normalized));
  writeIfChanged(path.join(REPORT_ROOT, "curriculum-order.json"), orderReport);
  writeIfChanged(path.join(REPORT_ROOT, "curriculum-order.md"), curriculumOrderMarkdown(curriculum));
  writeIfChanged(path.join(REPORT_ROOT, "generation-report.json"), generationReport);
  writeIfChanged(path.join(REPORT_ROOT, "generation-report.md"), `# Generation report\n\nVersion: ${curriculum.curriculumVersion}  \nGenerated: ${curriculum.generatedAt}\n\n${markdownTable(["Metric", "Count"], Object.entries(curriculum.statistics))}\n`);
  writeIfChanged(path.join(REPORT_ROOT, "validation-report.json"), validationReport);
  writeIfChanged(path.join(REPORT_ROOT, "validation-report.md"), `# Validation report\n\n- Valid: ${validation.valid ? "yes" : "no"}\n- Errors: ${validation.errors.length}\n- Warnings: ${validation.warnings.length}\n- Human-review items: ${validation.reviewItems.length}\n\n${validation.errors.length ? markdownTable(["Code", "Details"], validation.errors.map((error) => [error.code, JSON.stringify(error)])) : "No validation errors."}\n`);
  writeIfChanged(path.join(REPORT_ROOT, "vocabulary-coverage.json"), coverageReport);
  writeIfChanged(path.join(REPORT_ROOT, "vocabulary-coverage.md"), coverageMarkdown(curriculum));
  writeIfChanged(path.join(REPORT_ROOT, "supporting-vocabulary.json"), supportingReport);
  writeIfChanged(path.join(REPORT_ROOT, "supporting-vocabulary.md"), `# Supporting vocabulary report\n\n${markdownTable(["Group", "Traditional", "Pinyin", "English", "References"], supportingReport.items.map((item) => [item.group, item.traditional, item.pinyin, item.english, item.generatedContentReferences]))}\n`);
  writeIfChanged(path.join(REPORT_ROOT, "pinyin-warnings.json"), pinyinReport);
  writeIfChanged(path.join(REPORT_ROOT, "pinyin-warnings.md"), `# Pinyin warning report\n\nWarnings requiring review: ${pinyinWarnings.length}\n\n${markdownTable(["Source row", "Word", "Code", "Details"], pinyinWarnings.map((warning) => [warning.sourceRow, warning.value, warning.code, JSON.stringify(warning.details || warning.numberedPinyin || "")]))}\n`);
  writeIfChanged(path.join(REPORT_ROOT, "human-review.json"), humanReviewReport);
  writeIfChanged(path.join(REPORT_ROOT, "human-review.md"), `# Human-review report\n\n${validation.reviewItems.length} items require editorial review before publication. This includes source ambiguity and every template-generated lesson's collocations, dialogue, and story.\n\n${markdownTable(["Type", "ID", "Issues"], validation.reviewItems.slice(0, 250).map((item) => [item.type, item.id, (item.issues || []).join(", ")]))}\n\nThe complete item list is in \`human-review.json\`.\n`);
}

function buildManifest(curriculumPath = CURRICULUM_PATH, generatedAt = new Date().toISOString()) {
  const bytes = fs.readFileSync(curriculumPath);
  const curriculum = JSON.parse(bytes);
  const categories = curriculum.categories.map((category) => {
    const relativePath = `zh-TW/en/v${curriculum.curriculumVersion}/categories/${category.slug}.json`;
    const categoryBytes = fs.readFileSync(path.join(GENERATED_ROOT, relativePath));
    return { id: category.id, slug: category.slug, name: category.name, description: category.description, order: category.order, difficulty: category.difficulty, wordCount: category.wordCount, lessonCount: category.lessonIds.length, prerequisiteCategoryId: category.prerequisiteCategoryId, required: category.required !== false, imageUrl: `/assets/img/categories/${category.order}.png`, path: relativePath, checksum: sha256(categoryBytes), bytes: categoryBytes.length };
  });
  const manifest = {
    schemaVersion: "1.0.0",
    generatedAt,
    languages: [{
      targetLanguage: "zh-TW", sourceLanguage: "en", version: curriculum.curriculumVersion, schemaVersion: curriculum.schemaVersion,
      targetScript: "Hant", targetLocale: "zh-TW", sourceLocale: "en", minimumAppVersion: "1.0.0", packageStrategy: "category-packages",
      path: `zh-TW/en/v${curriculum.curriculumVersion}/curriculum.json`, checksum: sha256(bytes), bytes: bytes.length,
      categoryBytes: categories.reduce((total, item) => total + item.bytes, 0), categories, statistics: curriculum.statistics,
      migration: { previousVersion: "1.0.0", compatibleVersions: ["1.0.0", curriculum.curriculumVersion], replacedContentIds: {}, deprecatedContentIds: [], requiresReviewReset: false, requiresLessonRestart: false }
    }]
  };
  const validation = validateManifest(manifest);
  if (!validation.valid) throw new Error(`Manifest validation failed: ${JSON.stringify(validation.errors)}`);
  writeIfChanged(MANIFEST_PATH, manifest);
  return manifest;
}

function parseSource(sourcePath = DEFAULT_SOURCE) {
  const normalized = parseCurriculumWorkbook(sourcePath);
  writeIfChanged(VOCABULARY_PATH, normalized);
  writeIfChanged(path.join(REPORT_ROOT, "spreadsheet-quality.json"), { schemaVersion: "1.0.0", source: normalized.source, ...normalized.quality });
  writeIfChanged(path.join(REPORT_ROOT, "spreadsheet-quality.md"), spreadsheetQualityMarkdown(normalized));
  return normalized;
}

function generationState(sourcePath = DEFAULT_SOURCE) {
  const sourceChecksum = sha256(fs.readFileSync(sourcePath));
  const generatorChecksum = sha256([
    "parser.js", "pinyin.js", "ordering.js", "generator.js", "validator.js"
  ].map((filename) => fs.readFileSync(path.join(__dirname, filename))).concat([
    fs.readFileSync(path.join(ROOT, "curriculum", "config", "foundational-vocabulary.json")),
    fs.readFileSync(path.join(ROOT, "curriculum", "config", "polyphonic-overrides.json"))
  ]).map((buffer) => sha256(buffer)).join("|"));
  const existing = readJson(STATE_PATH, {});
  if (existing.sourceChecksum !== sourceChecksum || existing.generatorChecksum !== generatorChecksum || existing.curriculumVersion !== VERSION) {
    return { schemaVersion: "1.0.0", curriculumVersion: VERSION, sourceChecksum, generatorChecksum, generatedAt: new Date().toISOString(), categories: {} };
  }
  return existing;
}

function generate({ sourcePath = DEFAULT_SOURCE, category = null, resume = false, force = false } = {}) {
  const normalized = parseSource(sourcePath);
  const state = generationState(sourcePath);
  const ordered = require("./ordering").orderCategories(normalized.categories, normalized.words);
  const selected = category ? ordered.filter((item) => item.slug === category || item.name === category) : ordered;
  if (category && selected.length !== 1) throw new Error(`Unsupported category: ${category}`);
  const categoryRoot = path.join(PACKAGE_ROOT, "categories");
  for (const item of selected) {
    const categoryPath = path.join(categoryRoot, `${item.slug}.json`);
    if (resume && !force && state.categories[item.slug]?.status === "complete" && fs.existsSync(categoryPath)) continue;
    const fragment = generateCurriculum(normalized, { curriculumVersion: VERSION, generatedAt: state.generatedAt, categoryFilter: item.slug });
    writeIfChanged(categoryPath, fragment);
    state.categories[item.slug] = { status: "complete", checksum: sha256(stableJson(fragment)), generatedAt: state.generatedAt };
    writeIfChanged(STATE_PATH, state);
  }
  if (category) return { mode: "category", category: selected[0].slug, state };
  const curriculum = generateCurriculum(normalized, { curriculumVersion: VERSION, generatedAt: state.generatedAt });
  const validation = validateCurriculum(curriculum);
  if (!validation.valid) throw new Error(`Curriculum validation failed with ${validation.errors.length} errors`);
  writeIfChanged(CURRICULUM_PATH, curriculum);
  const manifest = buildManifest(CURRICULUM_PATH, state.generatedAt);
  writeReports(normalized, curriculum, validation, manifest);
  state.status = "complete";
  state.statistics = curriculum.statistics;
  state.validation = { errors: validation.errors.length, warnings: validation.warnings.length, humanReviewItems: validation.reviewItems.length };
  writeIfChanged(STATE_PATH, state);
  return { mode: "all", curriculum, validation, manifest, state };
}

function validateExisting() {
  if (!fs.existsSync(CURRICULUM_PATH)) throw new Error("Generated curriculum does not exist; run curriculum:generate first");
  const curriculum = readJson(CURRICULUM_PATH);
  const validation = validateCurriculum(curriculum);
  const manifest = buildManifest(CURRICULUM_PATH, curriculum.generatedAt);
  const normalized = readJson(VOCABULARY_PATH) || parseSource();
  writeReports(normalized, curriculum, validation, manifest);
  return { curriculum, validation, manifest };
}

module.exports = {
  CURRICULUM_PATH, DEFAULT_SOURCE, GENERATED_ROOT, MANIFEST_PATH, PACKAGE_ROOT, REPORT_ROOT, STATE_PATH, VERSION, VOCABULARY_PATH,
  buildManifest, generate, generationState, parseSource, readJson, sha256, validateExisting, writeIfChanged
};
