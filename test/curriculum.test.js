const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const test = require("node:test");

const { stableId } = require("../src/curriculum/ids");
const { exactGroupSizes, groupCategoryWords, orderCategories } = require("../src/curriculum/ordering");
const { parseCurriculumWorkbook } = require("../src/curriculum/parser");
const { numberedPinyinToToneMarks } = require("../src/curriculum/pinyin");
const { validateCurriculum, validateManifest } = require("../src/curriculum/validator");
const contentService = require("../src/services/content.service");
const { CURRICULUM_PATH, MANIFEST_PATH } = require("../src/curriculum/workflow");

const workbookPath = path.join(__dirname, "..", "sent", "chinese_words_categorized_expanded.xlsx");
let normalized;
let curriculum;
let manifest;

test.before(() => {
  normalized = parseCurriculumWorkbook(workbookPath);
  curriculum = JSON.parse(fs.readFileSync(CURRICULUM_PATH, "utf8"));
  manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
});

test("spreadsheet parser inspects the real workbook and preserves source rows", () => {
  assert.deepEqual(normalized.source.worksheetNames, ["Summary", "Categorized Words", "Category Guide", "Sources & Method"]);
  assert.deepEqual(normalized.source.headers.slice(0, 7), ["Source order", "Chinese", "Pinyin", "English meanings", "Category", "Category basis", "Translation source"]);
  assert.equal(normalized.words.length, 2316);
  assert.equal(normalized.categories.length, 113);
  assert.equal(normalized.words[0].sourceRow, 2);
  assert.equal(normalized.quality.rejectedRowCount, 0);
});

test("spreadsheet parser reports duplicates and repaired malformed pinyin", () => {
  assert.equal(normalized.quality.duplicateWordCount, 1);
  assert.ok(normalized.quality.warnings.some((warning) => warning.code === "duplicate-word" && warning.value === "顏色ᵇ"));
  assert.equal(normalized.quality.warnings.filter((warning) => warning.code === "missing-source-pinyin-repaired").length, 11);
  assert.equal(normalized.words.find((word) => word.traditional === "計畫").pinyin, "jì huà");
});

test("stable IDs are deterministic and independent of array position", () => {
  assert.equal(stableId("word", 100, "手機"), stableId("word", 100, "手機"));
  assert.notEqual(stableId("word", 100, "手機"), stableId("word", 101, "手機"));
});

test("category ordering places reusable foundations before specialized language", () => {
  const ordered = orderCategories(normalized.categories, normalized.words);
  assert.equal(ordered[0].name, "Grammar — Pronouns");
  assert.ok(ordered.findIndex((category) => category.name === "Everyday Actions") < ordered.findIndex((category) => category.name === "Administration"));
  assert.deepEqual(ordered.map((category) => category.order), ordered.map((_category, index) => index + 1));
});

test("lesson grouping uses four or five words and introduces every source word", () => {
  assert.deepEqual(exactGroupSizes(10), [5, 5]);
  assert.deepEqual(exactGroupSizes(14), [5, 5, 4]);
  assert.equal(exactGroupSizes(11), null);
  const roomWords = normalized.words.filter((word) => word.category === "Rooms");
  const groups = groupCategoryWords(roomWords);
  assert.ok(groups.every((group) => group.words.length === 4 || group.words.length === 5));
  assert.deepEqual(new Set(groups.flatMap((group) => group.newWordIds)), new Set(roomWords.map((word) => word.id)));
});

test("pinyin conversion emits Hanyu Pinyin tone marks", () => {
  assert.equal(numberedPinyinToToneMarks("shou3 ji1"), "shǒu jī");
  assert.equal(numberedPinyinToToneMarks("lü4 se4"), "lǜ sè");
  assert.doesNotMatch(numberedPinyinToToneMarks("zhang3 cheng2"), /\d/);
});

test("JSON schemas and generated documents are valid JSON", () => {
  for (const filename of ["curriculum.schema.json", "language-manifest.schema.json", "normalized-vocabulary.schema.json"]) {
    const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "curriculum", "schemas", filename), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  }
  assert.equal(validateManifest(manifest).valid, true);
  assert.equal(validateCurriculum(curriculum).valid, true);
});

test("generated lessons meet vocabulary, dialogue, story, and exercise requirements", () => {
  assert.equal(curriculum.coverage.length, curriculum.lessons.length);
  assert.ok(curriculum.coverage.every((item) => item.reusePercentage >= 90 && item.publishable));
  assert.ok(curriculum.dialogues.every((dialogue) => dialogue.turns.length >= 4 && dialogue.turns.length <= 10));
  assert.ok(curriculum.stories.every((story) => story.lines.length >= 5 && story.lines.length <= 8));
  assert.equal(curriculum.exercises.length, curriculum.lessons.length * 21);
  assert.ok(curriculum.exercises.every((exercise) => !(exercise.distractors || []).some((answer) => JSON.stringify(answer) === JSON.stringify(exercise.correctAnswer))));
});

test("content service prevents traversal and rejects unsupported languages", () => {
  assert.throws(() => contentService.resolveWithinContent("../../etc/passwd"), (error) => error.status === 400 && error.code === "INVALID_CONTENT_PATH");
  assert.throws(() => contentService.validateLanguageCode("../../etc", "target"), (error) => error.status === 400);
  assert.throws(() => contentService.findLanguage("fr-FR", "en"), (error) => error.status === 404 && error.code === "UNSUPPORTED_LANGUAGE_PAIR");
  assert.throws(() => contentService.getCategory("zh-TW", "en", "../travel"), (error) => error.status === 400 && error.code === "INVALID_CATEGORY_SLUG");
});

test("manifest and content routes return cache and checksum metadata", () => {
  const controller = require("../src/controllers/content.controller");
  const router = require("../src/routes/content.routes");
  const response = () => ({
    headers: {}, statusCode: 200, body: null,
    setHeader(name, value) { this.headers[name.toLowerCase()] = String(value); },
    status(value) { this.statusCode = value; return this; },
    send(value) { this.body = value; return this; },
    end() { return this; },
    json(value) { this.body = value; return this; }
  });
  const manifestResponse = response();
  controller.manifest({ headers: {} }, manifestResponse);
  assert.equal(manifestResponse.statusCode, 200);
  assert.match(manifestResponse.headers["content-type"], /^application\/json/);
  assert.match(manifestResponse.headers["cache-control"], /max-age=300/);
  assert.ok(manifestResponse.headers.etag);
  assert.equal(JSON.parse(manifestResponse.body).languages[0].targetLanguage, "zh-TW");
  const cachedResponse = response();
  controller.manifest({ headers: { "if-none-match": manifestResponse.headers.etag } }, cachedResponse);
  assert.equal(cachedResponse.statusCode, 304);
  const versionResponse = response();
  controller.version({ params: { targetLanguage: "zh-TW", sourceLanguage: "en" } }, versionResponse);
  assert.equal(versionResponse.body.version, manifest.languages[0].version);
  const contentResponse = response();
  controller.curriculum({ params: { targetLanguage: "zh-TW", sourceLanguage: "en" }, headers: { "accept-encoding": "identity" } }, contentResponse);
  assert.match(contentResponse.headers["cache-control"], /must-revalidate/);
  assert.equal(contentResponse.headers["x-content-sha256"], manifest.languages[0].checksum);
  const categoryResponse = response();
  controller.category({ params: { targetLanguage: "zh-TW", sourceLanguage: "en", categorySlug: "travel" }, headers: { "accept-encoding": "identity" } }, categoryResponse);
  assert.match(categoryResponse.headers["cache-control"], /must-revalidate/);
  assert.equal(JSON.parse(categoryResponse.body).categories[0].slug, "travel");
  const versionedCategoryResponse = response();
  controller.category({ params: { targetLanguage: "zh-TW", sourceLanguage: "en", version: manifest.languages[0].version, categorySlug: "travel" }, headers: { "accept-encoding": "identity" } }, versionedCategoryResponse);
  assert.match(versionedCategoryResponse.headers["cache-control"], /immutable/);
  assert.equal(versionedCategoryResponse.headers["x-content-version"], manifest.languages[0].version);
  const registeredPaths = router.stack.filter((layer) => layer.route).map((layer) => layer.route.path);
  assert.deepEqual(registeredPaths, ["/content/manifest", "/content/:targetLanguage/:sourceLanguage/version", "/content/:targetLanguage/:sourceLanguage/versions/:version/categories/:categorySlug", "/content/:targetLanguage/:sourceLanguage/categories/:categorySlug", "/content/:targetLanguage/:sourceLanguage"]);
});
