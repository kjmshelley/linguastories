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

`data/stories.json` contains the genres and stories. Each story declares its `targetLanguage` and available `sourceLanguages` using language codes. Each paragraph has target text in `target`, optional target-language `romanization`, and a `translations` object keyed by source language. Each translation has `text` and can optionally include its own `romanization`. Existing stories have English targets and Traditional Mandarin translations; their pinyin belongs to the Mandarin translations. Story covers are in `client/assets/img/` and use the story ID in their filenames. The catalog serves a story-specific WebP or PNG when present, falling back to the town illustration.

The stories and translations are initial drafts and should be reviewed by qualified English and Mandarin editors before publication. Pinyin generated automatically should also be checked in context.
