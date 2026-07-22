const HAN_PUNCTUATION = /[，。！？、；：「」『』（）《》〈〉…—]/g;
const LATIN_PUNCTUATION = /[.,!?;:'"`()\[\]{}\-]/g;
const SIMPLIFIED_HINTS = new Map([["里", "裡"], ["台", "臺"], ["这", "這"], ["个", "個"], ["么", "麼"], ["吗", "嗎"], ["发", "發"], ["车", "車"], ["门", "門"]]);

export function normalizeAnswer(value, options = {}) {
  const preserveToneMarks = options.preserveToneMarks !== false;
  let normalized = Array.isArray(value) ? value.map((item) => normalizeAnswer(item, options)) : String(value ?? "");
  if (Array.isArray(normalized)) return normalized;
  normalized = normalized.normalize("NFC").trim().toLocaleLowerCase("en");
  normalized = normalized.replace(HAN_PUNCTUATION, " ").replace(LATIN_PUNCTUATION, " ").replace(/\s+/g, " ").trim();
  if (!preserveToneMarks) normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "").normalize("NFC");
  return normalized;
}

function levenshtein(left, right) {
  const rows = Array.from({ length: left.length + 1 }, (_, index) => [index]);
  for (let column = 1; column <= right.length; column += 1) rows[0][column] = column;
  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
      );
    }
  }
  return rows[left.length][right.length];
}

function simplifiedHint(answer) {
  for (const [simplified, traditional] of SIMPLIFIED_HINTS) {
    if (answer.includes(simplified)) return `Use Traditional Chinese here. Try ${answer.replaceAll(simplified, traditional)}.`;
  }
  return "";
}

export function evaluateAnswer(definition, rawAnswer, options = {}) {
  if (!definition?.scored) return { correct: true, normalizedAnswer: rawAnswer, instructional: true, feedback: "Continue when you are ready." };
  const answers = [definition.correctAnswer, ...(definition.acceptedAnswers || [])];
  const arrayAnswer = Array.isArray(definition.correctAnswer);
  const normalizedAnswer = arrayAnswer
    ? (Array.isArray(rawAnswer) ? rawAnswer : []).map((value) => normalizeAnswer(value))
    : normalizeAnswer(rawAnswer, { preserveToneMarks: definition.type === "correct_pinyin" });
  if (definition.type === "match_pairs") {
    const expectedPairs = definition.correctAnswer.map((pair) => pair.map((value) => normalizeAnswer(value)).join("|"));
    const actualPairs = (Array.isArray(rawAnswer) ? rawAnswer : []).map((pair) => (Array.isArray(pair) ? pair : []).map((value) => normalizeAnswer(value)).join("|"));
    const correct = expectedPairs.length === actualPairs.length && expectedPairs.every((pair) => actualPairs.includes(pair));
    return { correct, normalizedAnswer: actualPairs, expectedAnswer: definition.correctAnswer, feedback: correct ? "That’s right." : definition.feedback || "Match every word with its published meaning.", explanation: definition.explanation || "" };
  }
  const accepted = answers.some((candidate) => {
    if (Array.isArray(candidate)) {
      if (!Array.isArray(normalizedAnswer) || candidate.length !== normalizedAnswer.length) return false;
      return candidate.every((value, index) => {
        if (Array.isArray(value)) return normalizeAnswer(value.join("|")) === normalizeAnswer((normalizedAnswer[index] || []).join("|"));
        return normalizeAnswer(value) === normalizedAnswer[index];
      });
    }
    const expected = normalizeAnswer(candidate, { preserveToneMarks: definition.type === "correct_pinyin" });
    if (normalizedAnswer === expected) return true;
    return Boolean(options.typoTolerance && expected.length >= 6 && levenshtein(normalizedAnswer, expected) <= options.typoTolerance);
  });
  const expectedAnswer = Array.isArray(definition.correctAnswer) ? definition.correctAnswer : String(definition.correctAnswer ?? "");
  return {
    correct: accepted,
    normalizedAnswer,
    expectedAnswer,
    feedback: accepted ? "That’s right." : simplifiedHint(String(rawAnswer || "")) || definition.feedback || `The expected answer is ${expectedAnswer}.`,
    explanation: definition.explanation || ""
  };
}
