const { inspectWorkbook } = require("./xlsx-reader");
const { loadOverrides, resolvePinyin } = require("./pinyin");
const { stableId } = require("./ids");

const HEADER_ALIASES = {
  sourceOrder: ["source order", "source row", "order"],
  traditional: ["chinese", "traditional chinese", "traditional"],
  numberedPinyin: ["pinyin", "hanyu pinyin"],
  english: ["english meanings", "english meaning", "english"],
  category: ["category"],
  categoryBasis: ["category basis", "basis"],
  translationSource: ["translation source", "source"]
};

const SIMPLIFIED_ONLY_CHARACTERS = new Set([..."门车书东长发后里这国话语见听买卖边万与为从众会体关兴养写军农冲决净准备几刘别办务动区医华协单卫却厂历压县参双变叶号员响团园围图圆场坏块坚坛坝壮声处头夹夺奋奖妇妈孙学宁宝实审对导层岁归当录彻忆忧怀态总战户扑执扩扫扬护报担拟拢拥拦拨择挂挤挥损换据掷掺搀摄摆摇敌数断无旧时显晓术机杀杂权条来杨极构标样树桥检楼欢气汉汤沟没沪洁浓测济涂涛润涨渐温湾湿满滤滥灭灯灵灾炉点炼烂爱爷牵状独狮环现电画畅疗盘着矿码礼离种积称稳窍竞笔笼签简粮红约级纪纬纯纳纵纸纹线练组细织终绍经结绕绘给绝统绿维绵综绷网罗罚职联聪肃肠肤肾胆胜胶脑脚脱脸腊腾舰艺节范荐药获莲虽虾蚁蚂蚕补装裤览觉观规视览订计认讨让议讯记讲许论设访证评词译试诗诚话该详语误诱说请诸诺读课谁调谈谊谋谓谢谨贝负财责贤败账货质贫购贺资赞赵赶趋跃践踪车轨转轮软轰轻载较辉辑输边辽达迁过运还进远违连迟选递逻邮邻郑酿里鉴针钓铁铅银铜铝铭锐错锦键镇镜长门闪闭问间闷闻阅队阳阴阵阶陆陈险随隐难雏离电雾静顶须顾顿颁颂预领额风飞饥饭饮馆马驰驱验骑骗骚鱼鸟鸡鸭麦黄齐齿龙"]);
const HAN_RE = /[\u3400-\u9fff]/u;
const SUPERSCRIPT_RE = /[ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖʳˢᵗᵘᵛʷˣʸᶻ]/gu;

function normalizeWhitespace(value) {
  return String(value ?? "").normalize("NFC").replace(/[\u00a0\u2000-\u200b\u3000]/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeHeader(value) {
  return normalizeWhitespace(value).toLowerCase().replace(/[_-]+/g, " ");
}

function mapHeaders(values) {
  const normalized = values.map(normalizeHeader);
  const result = {};
  for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
    const index = normalized.findIndex((header) => aliases.includes(header));
    if (index >= 0) result[field] = index;
  }
  return result;
}

function findVocabularySheet(workbook) {
  let best = null;
  for (const sheet of workbook.sheets) {
    for (const row of sheet.rows.slice(0, 20)) {
      const headers = mapHeaders(row.values);
      const score = ["traditional", "numberedPinyin", "english", "category"].filter((field) => headers[field] !== undefined).length;
      if (!best || score > best.score) best = { sheet, headerRow: row, headers, score };
    }
  }
  if (!best || best.score < 4) throw new Error("No worksheet contains the required Chinese, Pinyin, English, and Category headers");
  return best;
}

function inferPartOfSpeech(english) {
  const primary = String(english || "").split(";")[0].trim().toLowerCase();
  if (/^(to |to be |to become )/.test(primary)) return "verb";
  if (/\b(adjective|adj\.|-ful|ous$|ive$)/.test(primary) || /^(beautiful|happy|sad|large|small|hot|cold|good|bad|fast|slow)/.test(primary)) return "adjective";
  if (/\b(adverb|adv\.)/.test(primary)) return "adverb";
  if (/\b(pronoun)/.test(primary)) return "pronoun";
  if (/\b(preposition)/.test(primary)) return "preposition";
  if (/\b(conjunction)/.test(primary)) return "conjunction";
  if (/\b(classifier|measure word|CL:)/i.test(english)) return "classifier";
  return "noun";
}

function extractClassifier(english) {
  const match = String(english || "").match(/CL:([^;]+)/i);
  if (!match) return null;
  return normalizeWhitespace(match[1].split(/[|,\[]/)[0]) || null;
}

function punctuationIssues(traditional, english) {
  const issues = [];
  if (/[，。！？；：「」『』（）]/u.test(traditional)) issues.push("headword-contains-sentence-punctuation");
  if (/[,:;!?]/.test(traditional)) issues.push("headword-contains-ascii-punctuation");
  if (SUPERSCRIPT_RE.test(traditional)) issues.push("headword-contains-superscript-annotation");
  if ((english.match(/\(/g) || []).length !== (english.match(/\)/g) || []).length) issues.push("unbalanced-english-parentheses");
  if ((english.match(/\[/g) || []).length !== (english.match(/\]/g) || []).length) issues.push("unbalanced-english-brackets");
  return issues;
}

function possibleSimplifiedCharacters(value) {
  return [...new Set([...String(value || "")].filter((character) => SIMPLIFIED_ONLY_CHARACTERS.has(character)))];
}

function parseCategoryGuide(workbook) {
  const sheet = workbook.sheets.find((candidate) => normalizeHeader(candidate.name) === "category guide");
  if (!sheet) return { categories: [], duplicateCategories: [] };
  const headerRow = sheet.rows.find((row) => normalizeHeader(row.values[0]) === "category" && normalizeHeader(row.values[1]) === "definition");
  if (!headerRow) return { categories: [], duplicateCategories: [] };
  const categories = sheet.rows.slice(headerRow.rowNumber).filter((row) => normalizeWhitespace(row.values[0])).map((row) => ({
    name: normalizeWhitespace(row.values[0]),
    definition: normalizeWhitespace(row.values[1]),
    declaredWordCount: Number(row.values[2]) || 0,
    sourceRow: row.rowNumber
  }));
  const counts = new Map();
  for (const category of categories) counts.set(category.name.toLowerCase(), (counts.get(category.name.toLowerCase()) || 0) + 1);
  return { categories, duplicateCategories: categories.filter((category) => counts.get(category.name.toLowerCase()) > 1) };
}

function parseCurriculumWorkbook(filePath, { pinyinOverrides } = {}) {
  const overrides = pinyinOverrides || loadOverrides();
  const workbook = inspectWorkbook(filePath);
  const match = findVocabularySheet(workbook);
  const warnings = [];
  const errors = [];
  const rejectedRows = [];
  const emptyRows = [];
  const words = [];
  const seenWords = new Map();
  const rows = match.sheet.rows.slice(match.headerRow.rowNumber);
  for (const row of rows) {
    const raw = Object.fromEntries(Object.entries(match.headers).map(([field, index]) => [field, row.values[index]]));
    const allEmpty = Object.values(raw).every((value) => normalizeWhitespace(value) === "");
    if (allEmpty) {
      emptyRows.push(row.rowNumber);
      continue;
    }
    const traditional = normalizeWhitespace(raw.traditional);
    const sourceNumberedPinyin = normalizeWhitespace(raw.numberedPinyin);
    const numberedPinyin = sourceNumberedPinyin || overrides.words?.[traditional]?.numberedPinyin || "";
    const english = normalizeWhitespace(raw.english);
    const category = normalizeWhitespace(raw.category);
    const rowErrors = [];
    if (!traditional) rowErrors.push("missing-traditional-chinese");
    if (!numberedPinyin) rowErrors.push("missing-pinyin");
    if (!english) rowErrors.push("missing-english-meaning");
    if (!category) rowErrors.push("missing-category");
    if (traditional && !HAN_RE.test(traditional)) rowErrors.push("english-only-or-non-chinese-headword");
    if (rowErrors.length) {
      rejectedRows.push({ sourceRow: row.rowNumber, raw, issues: rowErrors });
      errors.push(...rowErrors.map((code) => ({ code, sourceRow: row.rowNumber, value: traditional })));
      continue;
    }
    const duplicateKey = traditional.replace(SUPERSCRIPT_RE, "");
    const pinyinResult = resolvePinyin(traditional, numberedPinyin, overrides);
    const simplified = possibleSimplifiedCharacters(traditional);
    const punctuation = punctuationIssues(traditional, english);
    const ambiguity = [];
    if (english.split(";").filter(Boolean).length >= 4) ambiguity.push("many-english-senses");
    if (numberedPinyin.includes("/")) ambiguity.push("multiple-pronunciations");
    if (duplicateKey !== traditional) ambiguity.push("annotated-headword");
    if (/disambiguation/i.test(normalizeWhitespace(raw.categoryBasis))) ambiguity.push("source-disambiguation-rule");
    const word = {
      id: stableId("word", raw.sourceOrder || row.rowNumber, traditional),
      traditional,
      pinyin: pinyinResult.pinyin,
      numberedPinyin,
      meanings: english.split(";").map(normalizeWhitespace).filter((meaning) => meaning && !/^CL:/i.test(meaning)),
      englishMeaning: english.split(";")[0].trim(),
      partOfSpeech: inferPartOfSpeech(english),
      classifier: extractClassifier(english),
      usageNote: ambiguity.length ? "Source entry has multiple senses or requires contextual disambiguation." : null,
      taiwanUsageNote: /\(Tw\)|Taiwan/i.test(english) ? "Source explicitly marks Taiwan usage." : "Use follows Taiwan Mandarin orthography; editorial confirmation is recommended for specialized senses.",
      difficulty: null,
      category,
      sourceRow: row.rowNumber,
      sourceOrder: Number(raw.sourceOrder) || null,
      categoryBasis: normalizeWhitespace(raw.categoryBasis),
      translationSource: normalizeWhitespace(raw.translationSource),
      imageUrl: null,
      audioUrl: null,
      issues: [...punctuation, ...simplified.map((character) => `possible-simplified-character:${character}`), ...ambiguity, ...pinyinResult.reasons]
    };
    if (!sourceNumberedPinyin && numberedPinyin) {
      word.issues.push("missing-source-pinyin-repaired-by-override");
      warnings.push({ code: "missing-source-pinyin-repaired", sourceRow: row.rowNumber, value: traditional, numberedPinyin });
    }
    if (seenWords.has(duplicateKey)) {
      const issue = { code: "duplicate-word", sourceRow: row.rowNumber, duplicateOf: seenWords.get(duplicateKey).sourceRow, value: traditional };
      warnings.push(issue);
      word.issues.push("duplicate-word");
      seenWords.get(duplicateKey).issues.push("duplicate-word");
    } else {
      seenWords.set(duplicateKey, word);
    }
    if (simplified.length) warnings.push({ code: "possible-simplified-chinese", sourceRow: row.rowNumber, value: traditional, characters: simplified });
    if (punctuation.length) warnings.push({ code: "punctuation-problem", sourceRow: row.rowNumber, value: traditional, details: punctuation });
    if (ambiguity.length) warnings.push({ code: "ambiguous-entry", sourceRow: row.rowNumber, value: traditional, details: ambiguity });
    if (pinyinResult.reviewRequired) warnings.push({ code: "pinyin-review", sourceRow: row.rowNumber, value: traditional, details: pinyinResult.reasons });
    words.push(word);
  }
  const guide = parseCategoryGuide(workbook);
  for (const category of guide.duplicateCategories) warnings.push({ code: "duplicate-category", sourceRow: category.sourceRow, value: category.name });
  const categoryNames = [...new Set(words.map((word) => word.category))];
  return {
    schemaVersion: "1.0.0",
    source: { file: filePath, worksheetNames: workbook.worksheetNames, vocabularyWorksheet: match.sheet.name, headerRow: match.headerRow.rowNumber, headers: match.headerRow.values.map(normalizeWhitespace) },
    language: { targetLanguage: "zh-TW", script: "Traditional Chinese", region: "Taiwan", sourceLanguage: "en" },
    categories: guide.categories.length ? guide.categories : categoryNames.map((name) => ({ name })),
    words,
    quality: {
      sourceRowCount: rows.length,
      acceptedRowCount: words.length,
      rejectedRowCount: rejectedRows.length,
      emptyRows,
      duplicateWordCount: warnings.filter((warning) => warning.code === "duplicate-word").length,
      duplicateCategoryCount: guide.duplicateCategories.length,
      warningCount: warnings.length,
      errorCount: errors.length,
      warnings,
      errors,
      rejectedRows
    }
  };
}

module.exports = { findVocabularySheet, inferPartOfSpeech, mapHeaders, normalizeHeader, normalizeWhitespace, parseCurriculumWorkbook, possibleSimplifiedCharacters, punctuationIssues };
