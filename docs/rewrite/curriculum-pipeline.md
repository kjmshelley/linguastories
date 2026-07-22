# Curriculum content pipeline

Phase 3 turns `sent/chinese_words_categorized_expanded.xlsx` into an immutable, versioned Traditional Chinese curriculum package without connecting it to the learner UI.

## Source and language pair

- Target: Traditional Chinese (`zh-TW`), Taiwan Mandarin
- Source: English (`en`)
- Workbook vocabulary sheet: `Categorized Words`
- Workbook headers are discovered at runtime; worksheet names and source row numbers are retained in normalized output.

The parser reads OOXML worksheet data directly through the system `unzip` executable. It does not edit the source workbook. Malformed rows are reported rather than silently dropped. Blank pinyin values may only be repaired through the reviewed `curriculum/config/polyphonic-overrides.json` file.

## Commands

```sh
npm run curriculum:parse
npm run curriculum:generate
npm run curriculum:resume
npm run curriculum:validate
npm run curriculum:manifest
node scripts/curriculum.js generate --category animals
node scripts/curriculum.js generate --category animals --force
node scripts/curriculum.js status
```

- `parse` inspects and normalizes the workbook and rebuilds spreadsheet-quality reports.
- `generate` generates every category fragment and the combined versioned package.
- `generate --category` creates one category fragment. Add `--force` to regenerate a completed category.
- `resume` skips completed category fragments whose source-workbook checksum and curriculum version still match.
- `validate` reads existing generated JSON and rebuilds validation/review reports without regenerating content.
- `manifest` recalculates the package checksum, byte size, and language manifest.

Writes are atomic and content-aware: unchanged files are not replaced. Generation progress is recorded in `content/generated/.generation-state.json`.

## Output contract

The combined package is `content/generated/zh-TW/en/v1.0.0/curriculum.json`. Category fragments are stored beside it under `categories/`. `content/generated/manifest.json` is the mutable, short-cache pointer to the immutable package version.

The generated package uses stable hash-backed IDs, explicit ordering, references instead of array positions, 4/5-word lessons, word/collocation/phrase/sentence/dialogue/story stages, exercise definitions, and per-lesson vocabulary coverage. Source words carry `sourceRow`, tone-mark pinyin, usage metadata, and null media URLs.

Generated teaching prose is marked `draft_pending_human_review`. Structural and vocabulary-reuse validation can pass automatically, but publication still requires native-speaker editorial review of collocations, sentence naturalness, dialogues, stories, polyphonic choices, and ambiguous dictionary senses.

## Delivery routes

- `GET /api/content/manifest`
- `GET /api/content/:targetLanguage/:sourceLanguage`
- `GET /api/content/:targetLanguage/:sourceLanguage/version`
- `GET /api/content/:targetLanguage/:sourceLanguage/categories/:categorySlug`

The routes validate BCP-47-like language codes and category slugs, resolve only versioned files beneath `content/generated`, reject traversal, return JSON with ETag/Last-Modified/checksum metadata, support conditional requests and gzip, use short caching for manifests/version metadata, and immutable one-year caching for versioned curriculum or category content. The category route lets the lesson engine avoid parsing the combined package.

## Reports

Machine-readable JSON and human-readable Markdown are written to `content/reports` for spreadsheet quality, curriculum order, generation, validation, vocabulary coverage, supporting vocabulary, pinyin warnings, and human review.
