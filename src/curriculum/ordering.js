const { slugify, stableId } = require("./ids");

const FOUNDATIONAL_ORDER = [
  "Grammar — Pronouns", "Numbers", "People", "Everyday Actions", "Everyday Objects", "Time", "Location", "Quantity",
  "Grammar — Measure Words", "Grammar — Sentence Patterns", "Grammar — Connectors", "Grammar — Interjections", "Language",
  "Physical Actions", "Physical States", "Physical Properties", "Sensory Qualities", "Position", "Direction", "Comparison",
  "Home", "Rooms", "Furniture", "Household Tools", "Personal Items", "Clothing", "Body Parts", "Appearance", "Personality",
  "Food", "Drinks", "Cooking", "Dining", "Shopping", "Money", "Relationships", "Emotions", "Needs", "Interests",
  "Calendar", "Seasons", "Weather", "Nature", "Animals", "Plants", "Places", "Transportation", "Travel", "Appointments",
  "Education", "Study", "Work", "Occupations", "Communication", "Social Events", "Entertainment", "Games", "Sports",
  "Health", "Symptoms", "Illnesses", "Medicine", "Healthcare", "Exercise", "Public Safety", "Electronics", "Technology",
  "Information", "Media", "Documents", "Meetings", "Plans", "Decisions", "Reasons", "Possibility", "Situations",
  "Movement", "Change", "States", "Processes", "Methods", "Effects", "Circumstances", "Evaluation", "Attitudes",
  "Ideas", "Thought", "Culture", "Music", "Visual Arts", "Performing Arts", "Literature", "Events", "Dating",
  "Buildings", "Structures", "Materials", "Shapes", "Measurement", "Space", "Geography", "Regions", "Environment",
  "Business", "Banking", "Administration", "Systems", "Types", "Degree", "Law", "Government", "Religion"
];

const EVERYDAY = new Set(FOUNDATIONAL_ORDER.slice(0, 55));
const SITUATIONAL = new Set(["Travel", "Transportation", "Dining", "Shopping", "Appointments", "Healthcare", "Public Safety", "Meetings", "Banking", "Administration"]);
const ABSTRACT = new Set(["Ideas", "Thought", "Possibility", "Circumstances", "Evaluation", "Attitudes", "Effects", "Systems", "Types", "Degree", "Religion", "Law", "Government"]);

function categoryRationale(name, order) {
  const reasons = [];
  if (/^Grammar —/.test(name)) reasons.push("foundational grammar supports later sentences, dialogues, and stories");
  if (EVERYDAY.has(name)) reasons.push("common everyday language precedes specialized situations");
  if (SITUATIONAL.has(name)) reasons.push("situational vocabulary follows reusable foundations");
  if (ABSTRACT.has(name)) reasons.push("abstract or institution-specific language is deferred until concrete language is established");
  if (!reasons.length) reasons.push("placed after more common, concrete prerequisites and before more specialized dependents");
  return `Position ${order}: ${reasons.join("; ")}.`;
}

function orderCategories(categoryDefinitions, words) {
  const definitions = new Map(categoryDefinitions.map((category) => [category.name, category]));
  const names = [...new Set(words.map((word) => word.category))];
  const ranked = names.map((name) => {
    const preferred = FOUNDATIONAL_ORDER.indexOf(name);
    const score = preferred >= 0 ? preferred : FOUNDATIONAL_ORDER.length + name.localeCompare("", "en");
    return { name, preferred, score };
  }).sort((left, right) => {
    if (left.preferred >= 0 && right.preferred >= 0) return left.preferred - right.preferred;
    if (left.preferred >= 0) return -1;
    if (right.preferred >= 0) return 1;
    return left.name.localeCompare(right.name, "en");
  });
  return ranked.map((item, index) => {
    const source = definitions.get(item.name) || {};
    return {
      id: stableId("category", item.name),
      slug: slugify(item.name),
      name: item.name,
      description: source.definition || `Practical vocabulary related to ${item.name.toLowerCase()}.`,
      order: index + 1,
      difficulty: Math.min(10, 1 + Math.floor(index / Math.max(1, Math.ceil(ranked.length / 10)))),
      wordCount: words.filter((word) => word.category === item.name).length,
      rationale: categoryRationale(item.name, index + 1)
    };
  });
}

function exactGroupSizes(count) {
  let best = null;
  for (let fours = 0; fours <= Math.ceil(count / 4); fours += 1) {
    for (let fives = 0; fives <= Math.ceil(count / 5); fives += 1) {
      if (fours * 4 + fives * 5 !== count) continue;
      const candidate = [...Array(fives).fill(5), ...Array(fours).fill(4)];
      if (!best || candidate.filter((size) => size === 5).length > best.filter((size) => size === 5).length) best = candidate;
    }
  }
  return best;
}

function semanticSort(words) {
  const partOrder = { pronoun: 0, classifier: 1, noun: 2, verb: 3, adjective: 4, adverb: 5, preposition: 6, conjunction: 7 };
  return [...words].sort((left, right) => {
    const partDifference = (partOrder[left.partOfSpeech] ?? 9) - (partOrder[right.partOfSpeech] ?? 9);
    if (partDifference) return partDifference;
    return (left.sourceOrder ?? left.sourceRow) - (right.sourceOrder ?? right.sourceRow);
  });
}

function groupCategoryWords(words) {
  const ordered = semanticSort(words);
  const exact = exactGroupSizes(ordered.length);
  const sizes = exact || [5, 4, 4];
  const groups = [];
  let cursor = 0;
  for (const size of sizes) {
    const newWords = ordered.slice(cursor, cursor + size);
    cursor += newWords.length;
    const reviewWords = newWords.length < size ? ordered.slice(0, size - newWords.length) : [];
    groups.push({ words: [...newWords, ...reviewWords], newWordIds: newWords.map((word) => word.id), reviewWordIds: reviewWords.map((word) => word.id) });
  }
  if (cursor < ordered.length) throw new Error(`Grouping failed to include ${ordered.length - cursor} words`);
  return groups;
}

module.exports = { FOUNDATIONAL_ORDER, exactGroupSizes, groupCategoryWords, orderCategories, semanticSort };
