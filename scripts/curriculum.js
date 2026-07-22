#!/usr/bin/env node
const path = require("path");
const { buildManifest, generate, MANIFEST_PATH, parseSource, readJson, STATE_PATH, validateExisting } = require("../src/curriculum/workflow");

function options(argv) {
  const result = { command: argv[0] || "help", category: null, resume: false, force: false, sourcePath: undefined };
  for (let index = 1; index < argv.length; index += 1) {
    if (argv[index] === "--category") result.category = argv[++index];
    else if (argv[index] === "--resume") result.resume = true;
    else if (argv[index] === "--force") result.force = true;
    else if (argv[index] === "--source") result.sourcePath = path.resolve(argv[++index]);
    else throw new Error(`Unknown option: ${argv[index]}`);
  }
  return result;
}

function help() {
  console.log(`LinguaStories curriculum workflow

  node scripts/curriculum.js parse [--source workbook.xlsx]
  node scripts/curriculum.js generate [--resume] [--source workbook.xlsx]
  node scripts/curriculum.js generate --category <slug> [--force]
  node scripts/curriculum.js validate
  node scripts/curriculum.js manifest
  node scripts/curriculum.js status`);
}

function main() {
  const args = options(process.argv.slice(2));
  if (args.command === "help") return help();
  if (args.command === "parse") {
    const normalized = parseSource(args.sourcePath);
    console.log(JSON.stringify({ words: normalized.words.length, categories: normalized.categories.length, warnings: normalized.quality.warningCount, errors: normalized.quality.errorCount }, null, 2));
    return;
  }
  if (args.command === "generate") {
    const result = generate(args);
    console.log(JSON.stringify(result.mode === "all" ? {
      mode: result.mode,
      statistics: result.curriculum.statistics,
      validation: { errors: result.validation.errors.length, warnings: result.validation.warnings.length, humanReviewItems: result.validation.reviewItems.length }
    } : {
      mode: result.mode,
      category: result.category,
      status: result.state.categories[result.category]?.status,
      checksum: result.state.categories[result.category]?.checksum
    }, null, 2));
    return;
  }
  if (args.command === "validate") {
    const result = validateExisting();
    console.log(JSON.stringify({ valid: result.validation.valid, errors: result.validation.errors.length, warnings: result.validation.warnings.length, humanReviewItems: result.validation.reviewItems.length, statistics: result.curriculum.statistics }, null, 2));
    process.exitCode = result.validation.valid ? 0 : 1;
    return;
  }
  if (args.command === "manifest") {
    const existing = readJson(MANIFEST_PATH);
    const manifest = buildManifest(undefined, existing?.generatedAt);
    console.log(JSON.stringify(manifest, null, 2));
    return;
  }
  if (args.command === "status") {
    console.log(JSON.stringify(readJson(STATE_PATH, { status: "not-started" }), null, 2));
    return;
  }
  throw new Error(`Unknown command: ${args.command}`);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
