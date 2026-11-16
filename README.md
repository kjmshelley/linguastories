# LinguaStories reader

A file-backed graded reader with English stories and Mandarin translations.

## Run locally

Use Node.js 20.6 or later:

```sh
npm ci
npm start
```

Open http://localhost:3000. No database is needed for the reader. Run `npm test` for the existing automated tests.

## Content

`data/catalog.json` is the metadata index. Each story has an ordered ID, title, genre, target language, and a `levels` array. Every level identifies its story version, the story file URL, and the available source languages with their translation file URLs. The raw index is served at `/content/catalog.json`.

`data/stories/<story-id>.json` contains the story's versions. Each version contains paragraphs, sentences, and ordered tokens; concatenating a sentence's token text preserves the original text and spacing. A target-language paragraph may also contain `romanization`.

`data/translations/<story-id>/<story-level-id>/<source-language>.json` contains paragraph translations for one source language and level. Existing paragraph-level translations and optional source romanization are preserved. Sentence entries may contain `glosses`, with contiguous, non-overlapping token IDs, a contextual translation, and optional romanization. The reader makes only tokens with a gloss clickable. The first sentence of story 01-01 has a small Traditional Mandarin example; the remaining word and phrase glosses still need to be authored and reviewed. Full paragraph translations remain available.

Story covers are in `client/assets/img/` and use the story ID in their filenames. The catalog serves a story-specific WebP or PNG when present, falling back to the town illustration.

The stories, translations, and example glosses are drafts and should be reviewed by qualified editors before publication. Romanization should also be checked in context.
