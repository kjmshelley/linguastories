function snapshot(type, value, parentWord = null) {
  return { id: value.id, type, difficulty: value.difficulty || parentWord?.difficulty || 5, content: { ...value, parentWord: parentWord ? { id: parentWord.id, traditional: parentWord.traditional, englishMeaning: parentWord.englishMeaning } : null } };
}

export function lessonReviewTargets(bundle, lesson, pairKey = null) {
  const targets = [];
  const words = new Map((bundle.words || []).map((item) => [item.id, item]));
  for (const id of lesson.wordIds || []) {
    const word = words.get(id); if (!word) continue;
    targets.push(snapshot("vocabulary", word));
    for (const [field, type] of [["collocations", "collocation"], ["phrases", "phrase"], ["sentences", "sentence"]]) for (const entry of word[field] || []) targets.push(snapshot(type, entry, word));
  }
  const dialogue = (bundle.dialogues || []).find((item) => item.id === lesson.dialogueId); if (dialogue) targets.push(snapshot("dialogue", dialogue));
  const story = (bundle.stories || []).find((item) => item.id === lesson.storyId); if (story) targets.push(snapshot("story", story));
  return targets.map((target) => pairKey ? { ...target, pairKey } : target);
}

export function targetByStableId(bundle, id) {
  for (const lesson of bundle.lessons || []) {
    const target = lessonReviewTargets(bundle, lesson).find((item) => item.id === id);
    if (target) return target;
  }
  return null;
}
