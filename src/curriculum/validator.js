const { EXERCISE_TYPES } = require("./generator");

function sameAnswer(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validateChain(items, field, errors) {
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const item of items) {
    const prerequisite = item[field];
    if (prerequisite && !byId.has(prerequisite)) { errors.push({ code: "unknown-prerequisite", id: item.id, prerequisite }); continue; }
    const seen = new Set([item.id]); let cursor = prerequisite;
    while (cursor) { if (seen.has(cursor)) { errors.push({ code: "prerequisite-cycle", id: item.id, prerequisite: cursor }); break; } seen.add(cursor); cursor = byId.get(cursor)?.[field] || null; }
  }
}

function validateCurriculum(curriculum) {
  const errors = [];
  const warnings = [];
  const reviewItems = [];
  const collections = ["categories", "lessons", "words", "dialogues", "stories", "exercises"];
  const allIds = new Map();
  for (const collection of collections) {
    for (const item of curriculum[collection] || []) {
      if (!item.id) errors.push({ code: "missing-stable-id", collection });
      else if (allIds.has(item.id)) errors.push({ code: "duplicate-stable-id", id: item.id, collections: [allIds.get(item.id), collection] });
      else allIds.set(item.id, collection);
    }
  }
  const wordIds = new Set((curriculum.words || []).map((word) => word.id));
  const categoryIds = new Set((curriculum.categories || []).map((category) => category.id));
  const lessonIds = new Set((curriculum.lessons || []).map((lesson) => lesson.id));
  const dialogueById = new Map((curriculum.dialogues || []).map((dialogue) => [dialogue.id, dialogue]));
  const storyById = new Map((curriculum.stories || []).map((story) => [story.id, story]));
  const exerciseById = new Map((curriculum.exercises || []).map((exercise) => [exercise.id, exercise]));

  for (const category of curriculum.categories || []) {
    if (typeof category.required !== "boolean") errors.push({ code: "missing-category-required", categoryId: category.id });
    for (const lessonId of category.lessonIds) if (!lessonIds.has(lessonId)) errors.push({ code: "unknown-category-lesson", categoryId: category.id, lessonId });
    const categoryWords = (curriculum.words || []).filter((word) => word.category === category.name);
    if (categoryWords.length !== category.wordCount) errors.push({ code: "category-word-count-mismatch", categoryId: category.id, declared: category.wordCount, actual: categoryWords.length });
  }
  validateChain(curriculum.categories || [], "prerequisiteCategoryId", errors);

  for (const word of curriculum.words || []) {
    if (!word.traditional || !word.pinyin || !word.englishMeaning) errors.push({ code: "incomplete-word", wordId: word.id });
    if (/\d/.test(word.pinyin)) errors.push({ code: "numeric-tone-pinyin", wordId: word.id, pinyin: word.pinyin });
    if (word.imageUrl !== null || word.audioUrl !== null) errors.push({ code: "unexpected-word-media", wordId: word.id });
    for (const item of [...word.collocations, ...word.phrases, ...word.sentences]) {
      if (!item.traditional || !item.pinyin || !item.english) errors.push({ code: "incomplete-generated-line", id: item.id });
      if (/\d/.test(item.pinyin)) errors.push({ code: "numeric-tone-generated-pinyin", id: item.id });
    }
    if (word.sentences.some((sentence) => !/[。！？]$/.test(sentence.traditional))) errors.push({ code: "sentence-punctuation", wordId: word.id });
    if (word.issues?.length) reviewItems.push({ type: "source-word", id: word.id, traditional: word.traditional, sourceRow: word.sourceRow, issues: word.issues });
  }

  for (const lesson of curriculum.lessons || []) {
    if (typeof lesson.required !== "boolean") errors.push({ code: "missing-lesson-required", lessonId: lesson.id });
    if (!categoryIds.has(lesson.categoryId)) errors.push({ code: "unknown-lesson-category", lessonId: lesson.id, categoryId: lesson.categoryId });
    if (lesson.wordIds.length < 4 || lesson.wordIds.length > 5) errors.push({ code: "lesson-word-count", lessonId: lesson.id, count: lesson.wordIds.length });
    for (const wordId of lesson.wordIds) if (!wordIds.has(wordId)) errors.push({ code: "unknown-lesson-word", lessonId: lesson.id, wordId });
    const dialogue = dialogueById.get(lesson.dialogueId);
    const story = storyById.get(lesson.storyId);
    if (!dialogue) errors.push({ code: "missing-dialogue", lessonId: lesson.id });
    if (!story) errors.push({ code: "missing-story", lessonId: lesson.id });
    if (dialogue) {
      if (dialogue.turns.length < 4 || dialogue.turns.length > 10) errors.push({ code: "dialogue-turn-count", lessonId: lesson.id, count: dialogue.turns.length });
      const referenced = new Set(dialogue.turns.flatMap((turn) => turn.vocabularyReferences || []));
      const ratio = lesson.wordIds.filter((wordId) => referenced.has(wordId)).length / lesson.wordIds.length;
      if (ratio < 0.8) errors.push({ code: "dialogue-vocabulary-coverage", lessonId: lesson.id, ratio });
      for (const turn of dialogue.turns) {
        if (!turn.traditional || !turn.pinyin || !turn.english || !turn.speaker) errors.push({ code: "incomplete-dialogue-turn", dialogueId: dialogue.id });
        if (turn.audioUrl !== null) errors.push({ code: "unexpected-dialogue-audio", dialogueId: dialogue.id });
      }
    }
    if (story) {
      if (story.lines.length < 5 || story.lines.length > 8) errors.push({ code: "story-line-count", lessonId: lesson.id, count: story.lines.length });
      if (!story.title?.traditional || !story.title?.pinyin || !story.title?.english) errors.push({ code: "incomplete-story-title", storyId: story.id });
      const referenced = new Set(story.lines.flatMap((line) => line.vocabularyReferences || []));
      const ratio = lesson.wordIds.filter((wordId) => referenced.has(wordId)).length / lesson.wordIds.length;
      if (ratio < 0.8) errors.push({ code: "story-vocabulary-coverage", lessonId: lesson.id, ratio });
      if (story.imageUrl !== null || story.audioUrl !== null) errors.push({ code: "unexpected-story-media", storyId: story.id });
    }
    const lessonExercises = lesson.exerciseIds.map((id) => exerciseById.get(id)).filter(Boolean);
    if (lessonExercises.length !== lesson.exerciseIds.length) errors.push({ code: "unknown-lesson-exercise", lessonId: lesson.id });
    const types = new Set(lessonExercises.map((item) => item.type));
    for (const type of EXERCISE_TYPES) if (!types.has(type)) errors.push({ code: "missing-exercise-type", lessonId: lesson.id, type });
    reviewItems.push({ type: "generated-lesson", id: lesson.id, categoryId: lesson.categoryId, issues: ["native-speaker-review-required", "template-generated-collocations-dialogue-story"] });
  }
  validateChain(curriculum.lessons || [], "prerequisiteLessonId", errors);

  const introductions = new Map();
  for (const lesson of curriculum.lessons || []) {
    for (const wordId of lesson.newWordIds) introductions.set(wordId, (introductions.get(wordId) || 0) + 1);
  }
  for (const wordId of wordIds) if (introductions.get(wordId) !== 1) errors.push({ code: "word-introduction-count", wordId, count: introductions.get(wordId) || 0 });

  for (const exercise of curriculum.exercises || []) {
    if (!exercise.type || !exercise.stage || !exercise.prompt || exercise.correctAnswer === undefined) errors.push({ code: "incomplete-exercise", exerciseId: exercise.id });
    if ((exercise.distractors || []).some((answer) => sameAnswer(answer, exercise.correctAnswer))) errors.push({ code: "correct-answer-in-distractors", exerciseId: exercise.id });
    const uniqueDistractors = new Set((exercise.distractors || []).map((answer) => JSON.stringify(answer)));
    if (uniqueDistractors.size !== (exercise.distractors || []).length) errors.push({ code: "duplicate-distractor", exerciseId: exercise.id });
  }

  for (const coverage of curriculum.coverage || []) {
    if (!lessonIds.has(coverage.lessonId)) errors.push({ code: "unknown-coverage-lesson", lessonId: coverage.lessonId });
    if (coverage.reusePercentage < 90 || coverage.publishable !== true) errors.push({ code: "vocabulary-reuse-below-threshold", lessonId: coverage.lessonId, percentage: coverage.reusePercentage });
  }
  if ((curriculum.coverage || []).length !== (curriculum.lessons || []).length) errors.push({ code: "missing-lesson-coverage-records" });
  if ((curriculum.statistics?.overallVocabularyReusePercentage || 0) < 90) errors.push({ code: "overall-vocabulary-reuse-below-threshold" });
  warnings.push({ code: "editorial-review-required-before-publication", count: reviewItems.filter((item) => item.type === "generated-lesson").length });
  return { valid: errors.length === 0, errors, warnings, reviewItems };
}

function validateManifest(manifest) {
  const errors = [];
  const languageCode = /^[a-z]{2,3}(?:-[A-Z][a-z]{3})?(?:-(?:[A-Z]{2}|[0-9]{3}))?$/;
  if (manifest.schemaVersion !== "1.0.0") errors.push({ code: "unsupported-manifest-schema" });
  if (!Array.isArray(manifest.languages) || manifest.languages.length === 0) errors.push({ code: "manifest-languages-empty" });
  for (const language of manifest.languages || []) {
    if (!languageCode.test(language.targetLanguage)) errors.push({ code: "invalid-target-language", value: language.targetLanguage });
    if (!languageCode.test(language.sourceLanguage)) errors.push({ code: "invalid-source-language", value: language.sourceLanguage });
    if (!/^[a-f0-9]{64}$/.test(language.checksum || "")) errors.push({ code: "invalid-checksum", value: language.checksum });
    if (language.packageStrategy !== "category-packages") errors.push({ code: "unsupported-package-strategy" });
    if (!Array.isArray(language.categories) || language.categories.length === 0) errors.push({ code: "manifest-categories-empty" });
    for (const category of language.categories || []) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(category.slug || "")) errors.push({ code: "invalid-category-slug", value: category.slug });
      if (!/^[a-f0-9]{64}$/.test(category.checksum || "")) errors.push({ code: "invalid-category-checksum", value: category.checksum });
      if (!Number.isInteger(category.bytes) || category.bytes < 1) errors.push({ code: "invalid-category-bytes", value: category.bytes });
      if (!category.name || !Number.isInteger(category.lessonCount) || typeof category.required !== "boolean" || !("prerequisiteCategoryId" in category)) errors.push({ code: "invalid-category-progress-metadata", id: category.id });
    }
    validateChain(language.categories || [], "prerequisiteCategoryId", errors);
  }
  return { valid: errors.length === 0, errors };
}

module.exports = { validateCurriculum, validateManifest };
