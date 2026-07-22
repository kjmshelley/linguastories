const fs = require("fs");
const path = require("path");
const { stableId } = require("./ids");
const { groupCategoryWords, orderCategories } = require("./ordering");

const EXERCISE_TYPES = [
  "word_to_meaning", "meaning_to_word", "match_pairs", "listen_and_select", "listen_and_type", "phrase_ordering",
  "sentence_ordering", "fill_in_the_blank", "natural_collocation_selection", "classifier_selection", "translation",
  "target_language_typing", "source_language_typing", "dialogue_completion", "dialogue_ordering", "dialogue_comprehension",
  "story_comprehension", "true_or_false", "best_response", "correct_pinyin", "unnatural_phrase_identification"
];

function loadFoundation(configPath = path.join(__dirname, "..", "..", "curriculum", "config", "foundational-vocabulary.json")) {
  return JSON.parse(fs.readFileSync(configPath, "utf8"));
}

function joinPinyin(parts) {
  return parts.map((part) => part.pinyin).filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

function contentLine(parts, english, vocabularyReferences = []) {
  const punctuation = String(english).trim().endsWith("?") ? "？" : String(english).trim().endsWith(".") ? "。" : "";
  return {
    traditional: `${parts.map((part) => part.traditional).join("")}${punctuation}`,
    pinyin: joinPinyin(parts),
    english,
    vocabularyReferences,
    foundationalVocabularyReferences: [...new Set(parts.filter((part) => part.foundationId).map((part) => part.foundationId))]
  };
}

function generatorContext(foundationalVocabulary) {
  const byTraditional = new Map(foundationalVocabulary.items.map((item) => [item.traditional, { ...item, foundationId: item.id }]));
  return {
    foundation(value) {
      const item = byTraditional.get(value);
      if (!item) throw new Error(`Missing foundational vocabulary entry: ${value}`);
      return item;
    },
    target(word) {
      return { traditional: word.traditional, pinyin: word.pinyin, wordId: word.id };
    }
  };
}

function wordTemplates(word, context) {
  const w = context.target(word);
  const f = context.foundation;
  const reference = [word.id];
  if (word.partOfSpeech === "verb") {
    return {
      collocations: [
        contentLine([f("想"), w], `want to ${word.englishMeaning.replace(/^to\s+/i, "")}`, reference),
        contentLine([f("可以"), w], `can ${word.englishMeaning.replace(/^to\s+/i, "")}`, reference),
        contentLine([f("一起"), w], `${word.englishMeaning.replace(/^to\s+/i, "")} together`, reference)
      ],
      phrases: [
        contentLine([f("我"), f("想"), w], `I want to ${word.englishMeaning.replace(/^to\s+/i, "")}`, reference),
        contentLine([f("我們"), f("可以"), w], `we can ${word.englishMeaning.replace(/^to\s+/i, "")}`, reference),
        contentLine([f("今天"), f("一起"), w], `${word.englishMeaning.replace(/^to\s+/i, "")} together today`, reference)
      ],
      sentences: [
        contentLine([f("今天"), f("我"), f("想"), w], `Today I want to ${word.englishMeaning.replace(/^to\s+/i, "")}.`, reference),
        contentLine([f("我們"), f("可以"), f("在"), f("這裡"), w], `We can ${word.englishMeaning.replace(/^to\s+/i, "")} here.`, reference),
        contentLine([f("你"), f("也"), f("想"), w, f("嗎")], `Do you also want to ${word.englishMeaning.replace(/^to\s+/i, "")}?`, reference)
      ]
    };
  }
  if (word.partOfSpeech === "adjective" || word.partOfSpeech === "adverb") {
    return {
      collocations: [
        contentLine([f("很"), w], `very ${word.englishMeaning}`, reference),
        contentLine([f("更"), w], `more ${word.englishMeaning}`, reference),
        contentLine([f("真的"), w], `really ${word.englishMeaning}`, reference)
      ],
      phrases: [
        contentLine([f("這個"), f("很"), w], `this is very ${word.englishMeaning}`, reference),
        contentLine([f("現在"), f("更"), w], `more ${word.englishMeaning} now`, reference),
        contentLine([f("真的"), f("很"), w], `really very ${word.englishMeaning}`, reference)
      ],
      sentences: [
        contentLine([f("這個"), f("真的"), f("很"), w], `This is really ${word.englishMeaning}.`, reference),
        contentLine([f("今天"), f("這裡"), f("更"), w], `It is more ${word.englishMeaning} here today.`, reference),
        contentLine([f("我"), f("覺得"), f("很"), w], `I think it is very ${word.englishMeaning}.`, reference)
      ]
    };
  }
  return {
    collocations: [
      contentLine([f("我"), f("的"), w], `my ${word.englishMeaning}`, reference),
      contentLine([f("需要"), w], `need ${word.englishMeaning}`, reference),
      contentLine([f("喜歡"), w], `like ${word.englishMeaning}`, reference)
    ],
    phrases: [
      contentLine([f("這裡"), f("有"), w], `there is ${word.englishMeaning} here`, reference),
      contentLine([f("我"), f("需要"), w], `I need ${word.englishMeaning}`, reference),
      contentLine([f("你"), f("喜歡"), w, f("嗎")], `do you like ${word.englishMeaning}?`, reference)
    ],
    sentences: [
      contentLine([f("今天"), f("我"), f("在"), f("這裡"), f("看到"), w], `Today I saw ${word.englishMeaning} here.`, reference),
      contentLine([f("我"), f("需要"), w], `I need ${word.englishMeaning}.`, reference),
      contentLine([f("我"), f("很"), f("喜歡"), w], `I really like ${word.englishMeaning}.`, reference)
    ]
  };
}

function addStableContentIds(word, templates) {
  return {
    ...word,
    collocations: templates.collocations.map((item, index) => ({ id: stableId("collocation", word.id, index + 1), ...item })),
    phrases: templates.phrases.map((item, index) => ({ id: stableId("phrase", word.id, index + 1), ...item })),
    sentences: templates.sentences.map((item, index) => ({ id: stableId("sentence", word.id, index + 1), ...item }))
  };
}

function dialogueTurns(words, context) {
  const f = context.foundation;
  const turns = [];
  for (const word of words) {
    const w = context.target(word);
    const reference = [word.id];
    if (word.partOfSpeech === "verb") {
      turns.push(contentLine([f("你"), f("今天"), f("想"), w, f("嗎")], `Do you want to ${word.englishMeaning.replace(/^to\s+/i, "")} today?`, reference));
      turns.push(contentLine([f("想"), f("我們"), f("可以"), f("一起"), w], `Yes. We can ${word.englishMeaning.replace(/^to\s+/i, "")} together.`, reference));
    } else if (word.partOfSpeech === "adjective" || word.partOfSpeech === "adverb") {
      turns.push(contentLine([f("這個"), f("很"), w, f("嗎")], `Is this very ${word.englishMeaning}?`, reference));
      turns.push(contentLine([f("是"), f("真的"), f("很"), w], `Yes, it is really ${word.englishMeaning}.`, reference));
    } else {
      turns.push(contentLine([f("你"), f("看到"), w, f("嗎")], `Did you see ${word.englishMeaning}?`, reference));
      turns.push(contentLine([f("看到了"), w, f("在"), f("這裡")], `Yes. ${word.englishMeaning} is here.`, reference));
    }
  }
  return turns.slice(0, 10).map((turn, index) => ({ ...turn, speaker: index % 2 === 0 ? "A" : "B", audioUrl: null }));
}

function storyLines(words, context, difficulty) {
  const f = context.foundation;
  const lines = [contentLine([f("今天"), f("我們"), f("在"), f("這裡")], "Today we are here.")];
  for (const word of words) {
    const w = context.target(word);
    const reference = [word.id];
    if (word.partOfSpeech === "verb") lines.push(contentLine([f("我"), f("想"), w, f("我們"), f("可以"), f("一起"), w], `I want to ${word.englishMeaning.replace(/^to\s+/i, "")}, and we can do it together.`, reference));
    else if (word.partOfSpeech === "adjective" || word.partOfSpeech === "adverb") lines.push(contentLine([f("這個"), f("很"), w, f("我"), f("覺得"), f("很"), f("好")], `This is ${word.englishMeaning}, and I think that is good.`, reference));
    else lines.push(contentLine([f("我"), f("看到"), w, f("也"), f("很"), f("喜歡"), w], `I saw ${word.englishMeaning}, and I liked it.`, reference));
  }
  lines.push(contentLine([f("今天"), f("的"), f("事情"), f("很"), f("有意思")], "Today's experience was interesting."));
  if (difficulty >= 5 && lines.length < 8) lines.push(contentLine([f("明天"), f("我們"), f("也"), f("想"), f("學習")], "Tomorrow we also want to learn."));
  return lines.slice(0, 8);
}

function exercise(idBase, type, stage, prompt, correctAnswer, acceptedAnswers, distractors, feedback, targetContentReferences, difficulty, extra = {}) {
  return {
    id: stableId("exercise", idBase, type), type, stage, prompt, correctAnswer, acceptedAnswers, distractors,
    feedback, explanation: extra.explanation || null, targetContentReferences, difficulty, ...extra
  };
}

function wrongPinyin(pinyin) {
  const replacements = [["ā", "á"], ["á", "ǎ"], ["ǎ", "à"], ["à", "ā"], ["ē", "é"], ["é", "ě"], ["ě", "è"], ["è", "ē"], ["ī", "í"], ["í", "ǐ"], ["ǐ", "ì"], ["ì", "ī"], ["ō", "ó"], ["ó", "ǒ"], ["ǒ", "ò"], ["ò", "ō"], ["ū", "ú"], ["ú", "ǔ"], ["ǔ", "ù"], ["ù", "ū"]];
  for (const [from, to] of replacements) if (pinyin.includes(from)) return pinyin.replace(from, to);
  return `${pinyin}r`;
}

function lessonExercises(lesson, words, dialogue, story) {
  const primary = words[0];
  const secondary = words[1] || primary;
  const otherMeanings = [...new Set(words.slice(1).map((word) => word.englishMeaning))].filter((value) => value !== primary.englishMeaning);
  const otherWords = [...new Set(words.slice(1).map((word) => word.traditional))].filter((value) => value !== primary.traditional);
  const phrase = primary.phrases[0];
  const sentence = primary.sentences[0];
  const collocation = primary.collocations[0];
  const classifier = primary.classifier || "個";
  const base = lesson.id;
  const refs = [primary.id];
  return [
    exercise(base, "word_to_meaning", "word", `What does ${primary.traditional} mean?`, primary.englishMeaning, [primary.englishMeaning], otherMeanings, "Review the word and its primary meaning.", refs, lesson.difficulty),
    exercise(base, "meaning_to_word", "word", `Choose the Traditional Chinese for “${primary.englishMeaning}”.`, primary.traditional, [primary.traditional], otherWords, "Match the meaning to the current lesson word.", refs, lesson.difficulty),
    exercise(base, "match_pairs", "word", "Match each word to its meaning.", words.map((word) => [word.traditional, word.englishMeaning]), [], [], "Each word has one primary meaning in this activity.", words.map((word) => word.id), lesson.difficulty),
    exercise(base, "listen_and_select", "word", "Select the word represented by the listening item.", primary.traditional, [primary.traditional], otherWords, "The audio field is intentionally empty until recorded media is supplied.", refs, lesson.difficulty, { audioUrl: null }),
    exercise(base, "listen_and_type", "word", "Type the Traditional Chinese represented by the listening item.", primary.traditional, [primary.traditional], [], "The audio field is intentionally empty until recorded media is supplied.", refs, lesson.difficulty, { audioUrl: null }),
    exercise(base, "phrase_ordering", "phrase", "Put the phrase in the natural order.", phrase.traditional, [phrase.traditional], [phrase.traditional.split("").reverse().join("")], "Place the function words before the target word.", [phrase.id, primary.id], lesson.difficulty),
    exercise(base, "sentence_ordering", "sentence", "Put the sentence in the natural order.", sentence.traditional, [sentence.traditional], [sentence.traditional.replace(/。$/, "").split("").reverse().join("")], "Follow the model sentence order.", [sentence.id, primary.id], lesson.difficulty),
    exercise(base, "fill_in_the_blank", "sentence", sentence.traditional.replace(primary.traditional, "＿＿"), primary.traditional, [primary.traditional], otherWords, "Use the lesson word that completes the sentence.", [sentence.id, primary.id], lesson.difficulty),
    exercise(base, "natural_collocation_selection", "collocation", `Choose the natural collocation for ${primary.traditional}.`, collocation.traditional, [collocation.traditional], [...new Set([`${primary.traditional}${collocation.traditional.replace(primary.traditional, "")}`, `${primary.traditional}我的`, `${primary.traditional}需要`])].filter((value) => value !== collocation.traditional).slice(0, 2), "The accepted answer follows the lesson's modeled collocation.", [collocation.id, primary.id], lesson.difficulty),
    exercise(base, "classifier_selection", "word", `Choose the classifier recorded for ${primary.traditional}.`, classifier, [classifier], ["本", "位", "次"].filter((value) => value !== classifier), "Classifier answers use the source dictionary when available and 個 otherwise.", refs, lesson.difficulty),
    exercise(base, "translation", "sentence", `Translate into Traditional Chinese: ${sentence.english}`, sentence.traditional, [sentence.traditional], [], "Use the complete model sentence.", [sentence.id, primary.id], lesson.difficulty),
    exercise(base, "target_language_typing", "word", `Type “${primary.englishMeaning}” in Traditional Chinese.`, primary.traditional, [primary.traditional], [], "Use Traditional Chinese characters.", refs, lesson.difficulty),
    exercise(base, "source_language_typing", "word", `Type the primary English meaning of ${primary.traditional}.`, primary.englishMeaning, [primary.englishMeaning], [], "Use the lesson's primary English gloss.", refs, lesson.difficulty),
    exercise(base, "dialogue_completion", "dialogue", dialogue.turns[0].traditional.replace(primary.traditional, "＿＿"), primary.traditional, [primary.traditional], otherWords, "Complete the dialogue with its referenced lesson word.", [dialogue.id, primary.id], lesson.difficulty),
    exercise(base, "dialogue_ordering", "dialogue", "Put the first two dialogue turns in order.", dialogue.turns.slice(0, 2).map((turn) => turn.traditional), [], [dialogue.turns.slice(0, 2).reverse().map((turn) => turn.traditional)], "A question is followed by its response.", [dialogue.id, primary.id], lesson.difficulty),
    exercise(base, "dialogue_comprehension", "dialogue", `Which lesson word is discussed first?`, primary.traditional, [primary.traditional], otherWords, "The first exchange references the first lesson word.", [dialogue.id, primary.id], lesson.difficulty),
    exercise(base, "story_comprehension", "story", "Which lesson word appears first in the story?", primary.traditional, [primary.traditional], otherWords, "Read the first vocabulary-bearing story line.", [story.id, primary.id], lesson.difficulty),
    exercise(base, "true_or_false", "story", `${primary.traditional} means “${primary.englishMeaning}”.`, "true", ["true"], ["false"], "The statement uses the source workbook's primary meaning.", [story.id, primary.id], lesson.difficulty),
    exercise(base, "best_response", "dialogue", dialogue.turns[0].traditional, dialogue.turns[1].traditional, [dialogue.turns[1].traditional], dialogue.turns.slice(2, 5).map((turn) => turn.traditional), "Choose the response paired with the prompt in the connected dialogue.", [dialogue.id, primary.id], lesson.difficulty),
    exercise(base, "correct_pinyin", "word", `Choose the correct pinyin for ${primary.traditional}.`, primary.pinyin, [primary.pinyin], [wrongPinyin(primary.pinyin), secondary.pinyin].filter((value, index, array) => value !== primary.pinyin && array.indexOf(value) === index), "Tone marks must match the published pronunciation.", refs, lesson.difficulty),
    exercise(base, "unnatural_phrase_identification", "collocation", "Choose the unnatural phrase.", `${primary.traditional}我的`, [`${primary.traditional}我的`], [collocation.traditional, primary.phrases[1].traditional], "The possessive marker belongs before the noun in this model.", [collocation.id, primary.id], lesson.difficulty)
  ];
}

function calculateCoverage(items, allowedWordIds, allowedFoundationIds) {
  let meaningful = 0;
  let covered = 0;
  for (const item of items) {
    const wordRefs = item.vocabularyReferences || [];
    const foundationRefs = item.foundationalVocabularyReferences || [];
    meaningful += wordRefs.length + foundationRefs.length;
    covered += wordRefs.filter((id) => allowedWordIds.has(id)).length + foundationRefs.filter((id) => allowedFoundationIds.has(id)).length;
  }
  return { meaningfulTokenReferences: meaningful, coveredTokenReferences: covered, reusePercentage: meaningful ? Number(((covered / meaningful) * 100).toFixed(2)) : 100 };
}

function generateCurriculum(normalized, { curriculumVersion = "1.0.0", generatedAt = new Date().toISOString(), categoryFilter = null } = {}) {
  const foundation = loadFoundation();
  const context = generatorContext(foundation);
  const orderedCategories = orderCategories(normalized.categories, normalized.words);
  const categoryPrerequisites = new Map(orderedCategories.map((category, index) => [category.id, index ? orderedCategories[index - 1].id : null]));
  const filteredCategories = categoryFilter ? orderedCategories.filter((category) => category.slug === categoryFilter || category.name === categoryFilter) : orderedCategories;
  const allPriorWordIds = new Set();
  const foundationIds = new Set(foundation.items.map((item) => item.id));
  const words = [];
  const categories = [];
  const lessons = [];
  const dialogues = [];
  const stories = [];
  const exercises = [];
  const coverage = [];

  for (const category of filteredCategories) {
    const sourceWords = normalized.words.filter((word) => word.category === category.name).map((word) => ({ ...word, difficulty: category.difficulty }));
    const generatedWords = sourceWords.map((word) => addStableContentIds(word, wordTemplates(word, context)));
    const byId = new Map(generatedWords.map((word) => [word.id, word]));
    const groups = groupCategoryWords(generatedWords);
    const categoryLessonIds = [];
    for (let index = 0; index < groups.length; index += 1) {
      const group = groups[index];
      const lessonWords = group.words.map((word) => byId.get(word.id) || word);
      const lessonId = stableId("lesson", category.id, index + 1);
      const lesson = {
        id: lessonId,
        categoryId: category.id,
        order: index + 1,
        title: `${category.name}: ${lessonWords.map((word) => word.englishMeaning).slice(0, 3).join(", ")}`,
        difficulty: category.difficulty,
        prerequisiteLessonId: index ? categoryLessonIds[index - 1] : null,
        required: true,
        wordIds: lessonWords.map((word) => word.id),
        newWordIds: group.newWordIds,
        reviewWordIds: group.reviewWordIds,
        stages: ["word", "collocation", "phrase", "sentence", "dialogue", "story"],
        publicationStatus: "draft_pending_human_review"
      };
      const dialogue = {
        id: stableId("dialogue", lessonId), lessonId, title: `${category.name} conversation`, situation: `A practical exchange using the current ${category.name.toLowerCase()} vocabulary.`,
        turns: dialogueTurns(lessonWords, context), vocabularyReferences: lesson.wordIds, audioUrl: null
      };
      const story = {
        id: stableId("story", lessonId), lessonId,
        title: { traditional: `${lessonWords[0].traditional}的一天`, pinyin: `${lessonWords[0].pinyin} de yì tiān`, english: `A day with ${lessonWords[0].englishMeaning}` },
        lines: storyLines(lessonWords, context, lesson.difficulty),
        vocabularyReferences: lesson.wordIds,
        comprehensionQuestions: [
          { id: stableId("question", lessonId, 1), prompt: "Which lesson word appears first?", correctAnswer: lessonWords[0].traditional, vocabularyReferences: [lessonWords[0].id] },
          { id: stableId("question", lessonId, 2), prompt: "When does the story happen?", correctAnswer: "今天", vocabularyReferences: [], foundationalVocabularyReferences: [context.foundation("今天").id] }
        ],
        imageUrl: null, audioUrl: null
      };
      const lessonExerciseDefinitions = lessonExercises(lesson, lessonWords, dialogue, story);
      lesson.dialogueId = dialogue.id;
      lesson.storyId = story.id;
      lesson.exerciseIds = lessonExerciseDefinitions.map((item) => item.id);
      const coveredItems = [
        ...lessonWords.flatMap((word) => [...word.collocations, ...word.phrases, ...word.sentences]),
        ...dialogue.turns,
        ...story.lines
      ];
      const allowedWordIds = new Set([...allPriorWordIds, ...lesson.wordIds]);
      const lessonCoverage = calculateCoverage(coveredItems, allowedWordIds, foundationIds);
      coverage.push({ lessonId, categoryId: category.id, publishable: lessonCoverage.reusePercentage >= 90, ...lessonCoverage });
      lessons.push(lesson);
      dialogues.push(dialogue);
      stories.push(story);
      exercises.push(...lessonExerciseDefinitions);
      categoryLessonIds.push(lessonId);
      for (const wordId of group.newWordIds) allPriorWordIds.add(wordId);
    }
    words.push(...generatedWords);
    categories.push({ ...category, prerequisiteCategoryId: categoryPrerequisites.get(category.id), required: true, lessonIds: categoryLessonIds });
  }
  const overallMeaningful = coverage.reduce((sum, item) => sum + item.meaningfulTokenReferences, 0);
  const overallCovered = coverage.reduce((sum, item) => sum + item.coveredTokenReferences, 0);
  return {
    schemaVersion: "1.0.0",
    curriculumVersion,
    generatedAt,
    targetLanguage: { code: "zh-TW", language: "Chinese", script: "Traditional Chinese", region: "Taiwan" },
    sourceLanguage: { code: "en", language: "English" },
    foundationalVocabulary: foundation.items,
    categories,
    lessons,
    words,
    dialogues,
    stories,
    exercises,
    coverage,
    statistics: {
      categories: categories.length,
      lessons: lessons.length,
      words: words.length,
      collocations: words.reduce((sum, word) => sum + word.collocations.length, 0),
      phrases: words.reduce((sum, word) => sum + word.phrases.length, 0),
      sentences: words.reduce((sum, word) => sum + word.sentences.length, 0),
      dialogues: dialogues.length,
      stories: stories.length,
      exercises: exercises.length,
      overallVocabularyReusePercentage: overallMeaningful ? Number(((overallCovered / overallMeaningful) * 100).toFixed(2)) : 100
    }
  };
}

module.exports = { EXERCISE_TYPES, calculateCoverage, generateCurriculum, loadFoundation, wordTemplates };
