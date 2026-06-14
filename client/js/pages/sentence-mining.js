import { browseButton, escapeHtml, formatDate, icon, progressBar, ui } from "../ui.js";
import { languageName, languageSelectOptions } from "../languages.js";

const DECK_COLORS = [
  "from-brand-red via-brand-amber to-brand-panel",
  "from-brand-blue via-brand-teal to-brand-panel",
  "from-brand-sidebar via-brand-slate to-brand-red",
  "from-brand-charcoal via-brand-graphite to-brand-mist"
];

const CATEGORY_LABELS = {
  "Daily Life": "Daily Conversations",
  Workplace: "Business",
  Study: "Grammar Patterns",
  Friendship: "Daily Conversations"
};

function isReviewDue(sentence) {
  return sentence.dueDate && sentence.dueDate <= new Date().toISOString().slice(0, 10) && sentence.state !== "Mastered";
}

function isUserSentence(sentence, savedSentences) {
  return savedSentences.includes(sentence.id) || sentence.state !== "New" || sentence.source === "Sentence Mining" || isReviewDue(sentence);
}

function deckStatus(sentences) {
  if (sentences.every((sentence) => sentence.state === "Mastered")) return "Mastered";
  if (sentences.some(isReviewDue)) return "Review Due";
  if (sentences.every((sentence) => sentence.state === "Review" || sentence.state === "Mastered")) return "Completed";
  if (sentences.some((sentence) => sentence.state !== "New")) return "In Progress";
  return "New";
}

function deckAction(deck) {
  if (deck.status === "Mastered") return "Mastered";
  if (deck.status === "Completed") return "Completed";
  if (deck.status === "Review Due") return "Review";
  if (deck.status === "In Progress") return "Continue";
  return "Start Deck";
}

function buildDeck(title, category, sentences, mine = false) {
  const completed = sentences.filter((sentence) => sentence.state === "Review" || sentence.state === "Mastered").length;
  const mastered = sentences.filter((sentence) => sentence.state === "Mastered").length;
  const due = sentences.filter(isReviewDue);
  const status = deckStatus(sentences);
  const next = due[0] || sentences.find((sentence) => sentence.dueDate) || sentences[0];
  return {
    id: title.replace(/[^a-z0-9]+/gi, "-").toLowerCase(),
    title,
    category,
    level: sentences[0]?.level || "A1",
    sentences,
    count: sentences.length,
    progress: sentences.length ? Math.round(((completed + mastered) / 2 / sentences.length) * 100) : 0,
    status,
    nextReview: next?.dueDate || "",
    points: sentences.length * (mine ? 2 : 10),
    dueCount: due.length,
    action: deckAction({ status }),
    mine
  };
}

function groupDecks(sentences, getTitle, getCategory, mine = false) {
  const grouped = sentences.reduce((groups, sentence) => {
    const title = getTitle(sentence);
    groups[title] = groups[title] || [];
    groups[title].push(sentence);
    return groups;
  }, {});
  return Object.entries(grouped).map(([title, items]) => buildDeck(title, getCategory(items[0]), items, mine));
}

function statPill(label, value, iconName) {
  return `
    <div class="rounded-lg border border-brand-line/80 bg-white/65 p-4 text-brand-ink shadow-[0_8px_18px_rgba(29,41,63,.06)]">
      <div class="flex items-center justify-between gap-3 text-brand-graphite">
        <span class="text-xs font-semibold uppercase">${escapeHtml(label)}</span>
        <span class="text-brand-redDark">${icon(iconName, "h-4 w-4")}</span>
      </div>
      <strong class="mt-2 block text-2xl font-bold tracking-tight">${escapeHtml(value)}</strong>
    </div>
  `;
}

function deckCard(deck, index = 0) {
  const deckSentences = deck.topics?.flatMap((topic) => topic.sentences || []) || deck.sentences || [];
  const firstSentence = deckSentences[0];
  const palette = DECK_COLORS[index % DECK_COLORS.length];
  const cardLabel = deck.system || deck.deckKind === "System" ? "LinguaStories Deck" : deck.category;
  const cardDescription = deck.description || "Start with a useful sentence and build recall over time.";
  const hasTopics = (deck.topics || []).length > 0;
  const openLabel = hasTopics ? "Open Deck" : "View Sentences";
  const openAction = browseButton(openLabel, `openDeck:${deck.id}`);
  const saveAction = deck.marketplace ? `<button class="${ui.primary}" data-action="savePublicDeck:${escapeHtml(deck.id)}">${icon("bookmark", "h-4 w-4")}<span>Save</span></button>` : "";
  const unsaveAction = deck.savedByUser && !deck.owner ? `<button class="${ui.danger}" data-action="unsavePublicDeck:${escapeHtml(deck.id)}">${icon("trash", "h-4 w-4")}<span>Remove</span></button>` : "";
  const deleteDeckAction = deck.owner && !deck.system ? `<button class="${ui.danger} !px-3" data-action="openDeleteDeckModal:${escapeHtml(deck.id)}" aria-label="Delete deck">${icon("trash", "h-4 w-4")}</button>` : "";
  const mediaStyle = deck.imageUrl
    ? `<img class="absolute inset-0 h-full w-full object-cover" src="${escapeHtml(deck.imageUrl)}" alt="">`
    : "";
  return `
    <article class="group relative w-[254px] shrink-0 overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.06)] transition duration-200 hover:-translate-y-1 hover:scale-[1.015] hover:border-brand-orange/45 hover:shadow-[0_22px_42px_rgba(29,41,63,.13)] sm:w-[282px]">
      <div class="relative flex aspect-[16/10] flex-col justify-between overflow-hidden bg-gradient-to-br ${palette} p-4">
        ${mediaStyle}
        <div class="absolute inset-0 bg-[linear-gradient(130deg,rgba(0,0,0,.38),rgba(0,0,0,.08)_58%)]"></div>
        <div class="relative flex items-start justify-between gap-2">
          <span class="rounded-full bg-black/35 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">${escapeHtml(deck.level)}</span>
          ${deck.reviewStatus === "Review Due" ? `<span class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-brand-redDark">Review Due</span>` : `<span class="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-ink">${escapeHtml(deck.reviewStatus || deck.status)}</span>`}
        </div>
        <div class="relative">
          <p class="text-xs font-bold uppercase text-white/70">${escapeHtml(cardLabel)}</p>
          <h3 class="mt-1 line-clamp-2 text-2xl font-bold leading-tight text-white drop-shadow">${escapeHtml(deck.name || deck.title)}</h3>
        </div>
      </div>
      <div class="grid gap-3 p-4">
        <div class="flex flex-wrap gap-2">
          <span class="${ui.tag}">${deck.sentenceCount ?? deck.count} sentences</span>
          <span class="${ui.tagGold}">${deck.coins ?? deck.points} coins</span>
        </div>
        <div>
          <div class="mb-1 flex items-center justify-between gap-3 text-xs font-semibold text-brand-graphite">
            <span>${deck.progress}% complete</span>
            <span>${deck.nextReviewDate || deck.nextReview ? formatDate(deck.nextReviewDate || deck.nextReview) : "No review date"}</span>
          </div>
          ${progressBar(deck.progress)}
        </div>
        <p class="line-clamp-2 min-h-10 text-sm leading-5 text-brand-charcoal">${escapeHtml(cardDescription)}</p>
        <div class="grid grid-cols-[1fr_auto_auto] gap-2">
          ${openAction}
          ${saveAction}
          ${unsaveAction}
          ${deleteDeckAction}
          ${deck.mine ? `<button class="${ui.secondary} !px-3" data-action="openEditSentenceModal:${firstSentence?.id}" aria-label="Edit sentence">${icon("edit", "h-4 w-4")}</button>` : ""}
          ${deck.mine ? `<button class="${ui.danger} !px-3" data-action="openDeleteSentenceModal:${firstSentence?.id}" aria-label="Delete sentence">${icon("trash", "h-4 w-4")}</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function deckRow(title, decks, startIndex = 0) {
  if (!decks.length) return "";
  const carouselId = `deck-carousel-${title.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "row"}`;
  return `
    <section class="min-w-0">
      <div class="mb-3 flex items-end justify-between gap-3">
        <h3 class="text-xl font-bold tracking-tight text-brand-ink">${escapeHtml(title)}</h3>
        <div class="flex items-center gap-2">
          <span class="shrink-0 text-xs font-bold uppercase text-brand-graphite">${decks.length} decks</span>
          <div class="hidden gap-1 md:flex">
            <button class="grid h-9 w-9 place-items-center rounded-lg border border-brand-line/80 bg-white/70 text-brand-ink transition hover:border-brand-orange/50 hover:bg-white" data-action="scrollCarousel:${carouselId}:prev" aria-label="Scroll ${escapeHtml(title)} left">${icon("chevronLeft", "h-4 w-4")}</button>
            <button class="grid h-9 w-9 place-items-center rounded-lg border border-brand-line/80 bg-white/70 text-brand-ink transition hover:border-brand-orange/50 hover:bg-white" data-action="scrollCarousel:${carouselId}:next" aria-label="Scroll ${escapeHtml(title)} right">${icon("chevronRight", "h-4 w-4")}</button>
          </div>
        </div>
      </div>
      <div id="${carouselId}" data-carousel class="-mx-4 flex cursor-grab snap-x gap-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-7 lg:px-7 [&::-webkit-scrollbar]:hidden">
        ${decks.map((deck, index) => deckCard(deck, index + startIndex)).join("")}
      </div>
    </section>
  `;
}

function deckGrid(decks, startIndex = 0) {
  if (!decks.length) {
    return `
      <section class="rounded-lg border border-dashed border-brand-line bg-white/70 p-8 text-center">
        <h3 class="text-xl font-bold text-brand-ink">No public decks yet</h3>
        <p class="mt-2 text-sm leading-6 text-brand-charcoal">When learners publish decks for this language, they will appear here.</p>
      </section>
    `;
  }
  return `
    <section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      ${decks.map((deck, index) => `<div class="min-w-0 [&>article]:w-full">${deckCard(deck, index + startIndex)}</div>`).join("")}
    </section>
  `;
}

function sourceLanguageOptions(appConfig, selected) {
  return languageSelectOptions(appConfig, selected);
}

function levelOptions(selected) {
  return ["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => `<option value="${level}" ${level === selected ? "selected" : ""}>${level}</option>`).join("");
}

export function addMinedSentenceModal({ state, appConfig }) {
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Add Mined Sentence</h2>
      <form class="mt-5 grid gap-3" data-form="customSentence">
        <label class="${ui.label}">Sentence<textarea class="${ui.input} min-h-24" name="target" required placeholder="駅はどこですか。"></textarea></label>
        <label class="${ui.label}">Translation<input class="${ui.input}" name="translation" required placeholder="Where is the train station?"></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Source Language<select class="${ui.input}" name="sourceLanguage">${sourceLanguageOptions(appConfig, state.user.sourceLanguage || "en-US")}</select></label>
          <label class="${ui.label}">Target Language<select class="${ui.input}" name="targetLanguage">${sourceLanguageOptions(appConfig, state.user.targetLanguage)}</select></label>
        </div>
        <label class="${ui.label}">CEFR Level<select class="${ui.input}" name="level">${levelOptions(state.user.currentLevel || "A1")}</select></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Audio MP3<input class="${ui.input}" name="sentenceAudio" type="file" accept="audio/mpeg,audio/mp3,.mp3"></label>
          <label class="${ui.label}">Image<input class="${ui.input}" name="sentenceImage" type="file" accept="image/jpeg,image/png,image/webp"></label>
        </div>
        <label class="${ui.label}">Video<input class="${ui.input}" name="sentenceVideo" type="file" accept="video/mp4,video/webm,video/quicktime"></label>
        <label class="${ui.label}">Notes<textarea class="${ui.input} min-h-24" name="notes" placeholder="Why this sentence matters"></textarea></label>
        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button class="${ui.primary}" type="submit">${icon("save")}<span>Save</span></button>
        </div>
      </form>
    </div>
  `;
}

export function createDeckModal({ state, appConfig }) {
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Create Deck</h2>
      <form class="mt-5 grid gap-3" data-form="sentenceDeck">
        <label class="${ui.label}">Name<input class="${ui.input}" name="name" required maxlength="120" placeholder="Travel sentences I want to keep"></label>
        <label class="${ui.label}">Description<textarea class="${ui.input} min-h-24" name="description" maxlength="1000" placeholder="What this deck helps you practice"></textarea></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Source Language<select class="${ui.input}" name="sourceLanguage">${sourceLanguageOptions(appConfig, state.user.sourceLanguage || "en-US")}</select></label>
          <label class="${ui.label}">Target Language<select class="${ui.input}" name="targetLanguage">${sourceLanguageOptions(appConfig, state.user.targetLanguage)}</select></label>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <label class="${ui.label}">Coins<input class="${ui.input}" name="coins" type="number" min="0" step="1" value="0"></label>
          <label class="${ui.label}">Level<select class="${ui.input}" name="level">${levelOptions(state.user.currentLevel || "A1")}</select></label>
          <label class="${ui.label}">Visibility<select class="${ui.input}" name="visibility"><option value="Private">Private</option><option value="Public">Public</option></select></label>
        </div>
        <label class="${ui.label}">Deck image<input class="${ui.input}" name="deckImage" type="file" accept="image/jpeg,image/png,image/webp"></label>
        <div class="mt-2 flex flex-col justify-end gap-2 border-t border-brand-line pt-4 sm:flex-row">
          <button class="${ui.primary}" type="submit">${icon("add")}<span>Create Deck</span></button>
        </div>
      </form>
    </div>
  `;
}

export function topicModal(_ctx, deckId) {
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Add Topic</h2>
      <form class="mt-5 grid gap-3" data-form="sentenceDeckTopic">
        <input type="hidden" name="deckId" value="${escapeHtml(deckId)}">
        <label class="${ui.label}">Topic name<input class="${ui.input}" name="name" required maxlength="120" placeholder="Airport problems"></label>
        <label class="${ui.label}">Topic description<textarea class="${ui.input} min-h-24" name="description" maxlength="1000" placeholder="Optional notes about this topic"></textarea></label>
        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button class="${ui.primary}" type="submit">${icon("add")}<span>Add Topic</span></button>
        </div>
      </form>
    </div>
  `;
}

export function editTopicModal({ state }, topicId) {
  const topic = state.sentenceDecks?.flatMap((deck) => deck.topics || []).find((item) => item.id === topicId);
  if (!topic) return `<h2 class="text-xl font-bold text-brand-ink">Topic unavailable</h2>`;
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Edit Topic</h2>
      <form class="mt-5 grid gap-3" data-form="editSentenceDeckTopic">
        <input type="hidden" name="id" value="${escapeHtml(topic.id)}">
        <label class="${ui.label}">Topic name<input class="${ui.input}" name="name" required maxlength="120" value="${escapeHtml(topic.name)}"></label>
        <label class="${ui.label}">Topic description<textarea class="${ui.input} min-h-24" name="description" maxlength="1000">${escapeHtml(topic.description || "")}</textarea></label>
        <input type="hidden" name="sortOrder" value="${escapeHtml(topic.sortOrder || 0)}">
        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button class="${ui.primary}" type="submit">${icon("save")}<span>Save</span></button>
        </div>
      </form>
    </div>
  `;
}

export function deleteTopicConfirmModal({ state }, topicId) {
  const topic = state.sentenceDecks?.flatMap((deck) => deck.topics || []).find((item) => item.id === topicId);
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Delete Topic?</h2>
      <p class="mt-2 ${ui.muted}">This deletes the topic and its deck sentence links.</p>
      <blockquote class="mt-4 rounded-lg border border-brand-line/80 bg-white/70 p-4 text-lg font-bold leading-7 text-brand-ink">${escapeHtml(topic?.name || "Topic unavailable")}</blockquote>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="${ui.danger}" data-action="deleteTopic:${topicId}">${icon("trash")}<span>Delete</span></button>
      </div>
    </div>
  `;
}

export function deleteDeckConfirmModal({ state }, deckId) {
  const deck = state.sentenceDecks?.find((item) => item.id === deckId);
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Delete Deck?</h2>
      <p class="mt-2 ${ui.muted}">This removes the deck from My Decks.</p>
      <blockquote class="mt-4 rounded-lg border border-brand-line/80 bg-white/70 p-4 text-lg font-bold leading-7 text-brand-ink">${escapeHtml(deck?.name || "Deck unavailable")}</blockquote>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="${ui.danger}" data-action="deleteDeck:${deckId}">${icon("trash")}<span>Delete</span></button>
      </div>
    </div>
  `;
}

export function deleteDeckSentenceConfirmModal({ state }, itemId) {
  const sentence = state.sentenceDecks
    ?.filter((deck) => deck.owner && !deck.system)
    .flatMap((deck) => [
      ...(deck.sentences || []),
      ...(deck.topics || []).flatMap((topic) => topic.sentences || [])
    ])
    .find((item) => item.itemId === itemId);
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Remove Sentence?</h2>
      <p class="mt-2 ${ui.muted}">This removes the sentence from this deck.</p>
      <blockquote class="mt-4 rounded-lg border border-brand-line/80 bg-white/70 p-4 text-lg font-bold leading-7 text-brand-ink">${escapeHtml(sentence?.target || "Sentence unavailable")}</blockquote>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="${ui.danger}" data-action="deleteDeckSentence:${itemId}">${icon("trash")}<span>Remove</span></button>
      </div>
    </div>
  `;
}

export function addDeckSentenceModal({ state }, deckId) {
  const deck = state.sentenceDecks?.find((item) => item.id === deckId);
  if (!deck?.owner) return `<h2 class="text-xl font-bold text-brand-ink">Deck unavailable</h2>`;
  const topicSelect = deck.topics?.length
    ? `<label class="${ui.label}">Topic<select class="${ui.input}" name="topicId">${deck.topics.map((topic) => `<option value="${escapeHtml(topic.id)}">${escapeHtml(topic.name)}</option>`).join("")}</select></label>`
    : "";
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Add Sentence</h2>
      <form class="mt-5 grid gap-3" data-form="deckSentence">
        <input type="hidden" name="deckId" value="${escapeHtml(deck.id)}">
        <label class="${ui.label}">Sentence<textarea class="${ui.input} min-h-24" name="target" required maxlength="500" placeholder="駅はどこですか。"></textarea></label>
        <label class="${ui.label}">Translation<input class="${ui.input}" name="translation" required maxlength="500" placeholder="Where is the train station?"></label>
        ${topicSelect}
        <label class="${ui.label}">Notes<textarea class="${ui.input} min-h-24" name="notes" maxlength="1000" placeholder="Why this sentence matters"></textarea></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Audio MP3<input class="${ui.input}" name="sentenceAudio" type="file" accept="audio/mpeg,audio/mp3,.mp3"></label>
          <label class="${ui.label}">Image<input class="${ui.input}" name="sentenceImage" type="file" accept="image/jpeg,image/png,image/webp"></label>
        </div>
        <label class="${ui.label}">Video<input class="${ui.input}" name="sentenceVideo" type="file" accept="video/mp4,video/webm,video/quicktime"></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Sort order<input class="${ui.input}" name="sortOrder" type="number" min="0" step="1" value="0"></label>
          <label class="${ui.label}">Level<select class="${ui.input}" name="level">${levelOptions(deck.level || state.user.currentLevel || "A1")}</select></label>
        </div>
        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button class="${ui.primary}" type="submit">${icon("add")}<span>Add Sentence</span></button>
        </div>
      </form>
    </div>
  `;
}

export function editMinedSentenceModal({ state, appConfig }, sentenceId) {
  const sentence = state.sentences.find((item) => item.id === sentenceId);
  if (!sentence) return `<h2 class="text-xl font-bold text-brand-ink">Sentence unavailable</h2>`;
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Edit Sentence</h2>
      <form class="mt-5 grid gap-3" data-form="editSentence">
        <input type="hidden" name="id" value="${escapeHtml(sentence.id)}">
        <label class="${ui.label}">Sentence<textarea class="${ui.input} min-h-24" name="target" required>${escapeHtml(sentence.target)}</textarea></label>
        <label class="${ui.label}">Translation<input class="${ui.input}" name="translation" required value="${escapeHtml(sentence.translation)}"></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Source Language<select class="${ui.input}" name="sourceLanguage">${sourceLanguageOptions(appConfig, state.user.sourceLanguage || "en-US")}</select></label>
          <label class="${ui.label}">Target Language<select class="${ui.input}" name="targetLanguage">${sourceLanguageOptions(appConfig, sentence.targetLanguage || state.user.targetLanguage)}</select></label>
        </div>
        <label class="${ui.label}">CEFR Level<select class="${ui.input}" name="level">${levelOptions(sentence.level || "A1")}</select></label>
        <div class="grid gap-3 sm:grid-cols-2">
          <label class="${ui.label}">Audio MP3<input class="${ui.input}" name="sentenceAudio" type="file" accept="audio/mpeg,audio/mp3,.mp3">${sentence.audioUrl ? `<span class="text-xs font-semibold text-brand-graphite">Current audio saved</span>` : ""}</label>
          <label class="${ui.label}">Image<input class="${ui.input}" name="sentenceImage" type="file" accept="image/jpeg,image/png,image/webp">${sentence.imageUrl ? `<span class="text-xs font-semibold text-brand-graphite">Current image saved</span>` : ""}</label>
        </div>
        <label class="${ui.label}">Video<input class="${ui.input}" name="sentenceVideo" type="file" accept="video/mp4,video/webm,video/quicktime">${sentence.videoUrl ? `<span class="text-xs font-semibold text-brand-graphite">Current video saved</span>` : ""}</label>
        <label class="${ui.label}">Notes<textarea class="${ui.input} min-h-24" name="notes">${escapeHtml(sentence.notes || "")}</textarea></label>
        <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button class="${ui.primary}" type="submit">${icon("save")}<span>Save</span></button>
        </div>
      </form>
    </div>
  `;
}

export function deleteMinedSentenceModal({ state }, sentenceId) {
  const sentence = state.sentences.find((item) => item.id === sentenceId);
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">Delete Sentence?</h2>
      <p class="mt-2 ${ui.muted}">This removes the sentence from your mined deck.</p>
      <blockquote class="mt-4 rounded-lg border border-brand-line/80 bg-white/70 p-4 text-lg font-bold leading-7 text-brand-ink">${escapeHtml(sentence?.target || "Sentence unavailable")}</blockquote>
      <div class="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" class="${ui.danger}" data-action="deleteSentence:${sentenceId}">${icon("trash")}<span>Delete</span></button>
      </div>
    </div>
  `;
}

export function sentenceMiningView({ appConfig, state, selectedProfileLanguage }) {
  const activeLanguage = selectedProfileLanguage || state.user.targetLanguage;
  const activeLanguageName = languageName(appConfig, activeLanguage);
  const decks = (state.sentenceDecks || []).filter((deck) => !deck.targetLanguage || deck.targetLanguage === activeLanguage);
  const myDecks = decks.filter((deck) => deck.owner || deck.category === "My Decks");
  const savedDecks = decks.filter((deck) => deck.custom && !deck.owner && deck.savedByUser);
  const publicDecks = (state.publicSentenceDecks || []).filter((deck) => !deck.targetLanguage || deck.targetLanguage === activeLanguage);
  const systemDecks = decks.filter((deck) => !deck.custom);
  const byCategory = systemDecks.reduce((groups, deck) => {
    groups[deck.category] = groups[deck.category] || [];
    groups[deck.category].push(deck);
    return groups;
  }, {});
  const totalMined = decks.reduce((sum, deck) => sum + (deck.custom ? Number(deck.sentenceCount || 0) : 0), 0);
  const completedDecks = decks.filter((deck) => deck.reviewStatus === "Mastered").length;
  const sentencePoints = (state.wallet.transactions || []).filter((item) => /sentence/i.test(item.label)).reduce((sum, item) => sum + Math.max(0, Number(item.amount) || 0), 0);
  const dueToday = decks.reduce((sum, deck) => sum + (deck.reviewStatus === "Review Due" ? 1 : 0), 0);
  const capabilities = state.subscription?.capabilities || state.user?.subscription?.capabilities || {};
  const personalDeckLimit = capabilities.personalDeckLimit;
  const canCreateDeck = !Number.isInteger(personalDeckLimit) || myDecks.length < personalDeckLimit;

  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] overflow-hidden bg-brand-cream text-brand-ink sm:-m-6 lg:-m-7">
      <section class="relative overflow-hidden border-b border-brand-line/80 bg-brand-panel px-4 py-6 sm:px-6 lg:px-7">
        <img class="absolute inset-0 h-full w-full object-cover object-center opacity-80" src="/assets/img/sentence-mining-hero.png" alt="">
        <div class="absolute inset-0 bg-[linear-gradient(100deg,rgba(255,250,244,.96)_0%,rgba(255,250,244,.9)_42%,rgba(255,250,244,.6)_67%,rgba(255,250,244,.28)_100%)]"></div>
        <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,250,244,.18)_0%,rgba(255,250,244,.72)_100%)]"></div>
        <div class="relative grid gap-6">
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
            <div class="max-w-3xl py-4">
              <span class="inline-flex min-h-6 items-center rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-bold uppercase text-brand-redDark ring-1 ring-brand-red/15">Sentence Mining</span>
              <h2 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl">Build fluency from sentences worth keeping.</h2>
              <p class="mt-4 max-w-2xl text-base leading-7 text-brand-charcoal">Browse decks, mine useful lines, and keep due reviews close without turning practice into an admin screen.</p>
              <p class="mt-2 text-sm font-bold text-brand-graphite">Showing ${escapeHtml(activeLanguageName)} decks</p>
              <div class="mt-5 flex flex-wrap gap-2">
                ${canCreateDeck ? `<button class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand-ink px-4 py-2 text-sm font-bold text-white shadow-[0_10px_20px_rgba(29,41,63,.14)] transition hover:bg-brand-redDark" data-action="openCreateDeckModal">${icon("add")}<span>Create Deck</span></button>` : ""}
                <button class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-line/90 bg-white/65 px-4 py-2 text-sm font-bold text-brand-charcoal transition hover:border-brand-orange/50 hover:bg-white" data-action="openReview">${icon("book")}<span>Practice Reviews</span></button>
                <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-brand-line/90 bg-white/65 px-4 py-2 text-sm font-bold text-brand-charcoal no-underline transition hover:border-brand-orange/50 hover:bg-white" href="/app/sentence-mining/deck-library" data-app-link>${icon("book", "h-4 w-4")}<span>View Sentence Deck Library</span></a>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              ${statPill("Decks started", myDecks.length + savedDecks.length, "book")}
              ${statPill("Decks completed", completedDecks, "check")}
              ${statPill("Mined sentences", totalMined, "bookmark")}
              ${statPill("Coins earned", sentencePoints, "coins")}
              ${statPill("Reviews due", dueToday, "bell")}
              ${statPill("Daily streak", `${state.dashboard?.streak || 0} days`, "star")}
            </div>
          </div>
        </div>
      </section>
      <div class="grid gap-8 px-4 py-7 sm:px-6 lg:px-7">
        ${deckRow("My Decks", myDecks, 0)}
        ${deckRow("Sentence Deck Library", savedDecks, 2)}
        ${Object.entries(byCategory)
          .map(([category, decks], index) => deckRow(category, decks, index + 5))
          .join("")}
      </div>
    </div>
  `;
}

export function sentenceDeckLibraryView({ appConfig, state, selectedProfileLanguage }) {
  const activeLanguage = selectedProfileLanguage || state.user.targetLanguage;
  const activeLanguageName = languageName(appConfig, activeLanguage);
  const publicDecks = (state.publicSentenceDecks || []).filter((deck) => !deck.targetLanguage || deck.targetLanguage === activeLanguage);

  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-brand-cream px-4 py-5 text-brand-ink sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <div class="mb-4">
        <a class="${ui.secondary} no-underline" href="/app/sentence-mining" data-app-link>${icon("arrowLeft")}<span>Back to Sentence Mining</span></a>
      </div>
      <section class="mb-6 overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.08)]">
        <div class="relative p-5 sm:p-7">
          <div class="absolute inset-0 bg-[linear-gradient(125deg,rgba(255,250,244,.98)_0%,rgba(248,246,242,.95)_58%,rgba(43,165,154,.14)_100%)]"></div>
          <div class="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div class="max-w-3xl">
              <span class="inline-flex min-h-6 items-center rounded-full bg-brand-red/10 px-2.5 py-1 text-xs font-bold uppercase text-brand-redDark ring-1 ring-brand-red/15">Public Decks</span>
              <h2 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-brand-ink sm:text-5xl">Sentence Deck Library</h2>
              <p class="mt-4 max-w-2xl text-base leading-7 text-brand-charcoal">Browse public decks created by other learners and save useful ones to your profile.</p>
              <p class="mt-2 text-sm font-bold text-brand-graphite">Showing ${escapeHtml(activeLanguageName)} decks</p>
            </div>
            <div class="rounded-lg border border-brand-line/80 bg-white/75 p-4 text-sm font-bold text-brand-charcoal">
              ${publicDecks.length} public ${publicDecks.length === 1 ? "deck" : "decks"}
            </div>
          </div>
        </div>
      </section>
      ${deckGrid(publicDecks)}
    </div>
  `;
}

function topicSection(topic, deck) {
  return `
    <article class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.06)] transition hover:-translate-y-1 hover:border-brand-orange/45 hover:shadow-[0_18px_36px_rgba(29,41,63,.12)]">
      <div class="bg-gradient-to-br from-brand-blue via-brand-teal to-brand-panel p-4 text-white">
        <div class="flex items-start justify-between gap-3">
          <h3 class="line-clamp-2 text-xl font-bold leading-tight drop-shadow">${escapeHtml(topic.name)}</h3>
          <span class="rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-brand-ink">${topic.progress || 0}%</span>
        </div>
      </div>
      <div class="grid gap-3 p-4">
        <div class="flex flex-wrap gap-2">
          <span class="${ui.tag}">${topic.sentenceCount || topic.sentences?.length || 0} sentences</span>
          <span class="${ui.tagGold}">${escapeHtml(deck.level || "A1")}</span>
          <a class="${ui.secondary} !min-h-8 !px-2.5 !py-1 text-xs no-underline" href="/app/sentence-mining/decks/${encodeURIComponent(deck.id)}/topics/${encodeURIComponent(topic.id)}" data-app-link>${icon("book", "h-3.5 w-3.5")}<span>Show Sentences</span></a>
        </div>
        <p class="line-clamp-3 min-h-16 text-sm leading-6 text-brand-charcoal">${escapeHtml(topic.description || "Open this topic in review to practice the sentences inside.")}</p>
        <div class="${deck.owner && !deck.system ? "grid grid-cols-3 gap-2" : "grid gap-2"}">
          <button class="${ui.primary}" data-action="reviewTopic:${deck.id}:${topic.id}">${icon("book")}<span>Review</span></button>
          ${deck.owner && !deck.system ? `<button class="${ui.secondary}" data-action="openEditTopicModal:${topic.id}">${icon("edit")}<span>Edit</span></button><button class="${ui.danger}" data-action="openDeleteTopicModal:${topic.id}">${icon("trash")}<span>Delete</span></button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function topicSentenceRows(topic, deck) {
  const canManage = deck.owner && !deck.system;
  return (topic.sentences || []).map((sentence, index) => `
    <tr class="border-t border-brand-line/70 transition-colors" data-topic-audio-row>
      <td class="whitespace-nowrap px-4 py-3 text-sm font-bold text-brand-ink">${index + 1}</td>
      <td class="px-4 py-3 text-sm leading-6 text-brand-charcoal">${escapeHtml(sentence.translation || "")}</td>
      <td class="px-4 py-3 text-sm font-semibold leading-6 text-brand-ink">${escapeHtml(sentence.target || "")}</td>
      <td class="px-4 py-3 text-sm leading-6 text-brand-graphite">${escapeHtml(sentence.romanization || "")}</td>
      <td class="whitespace-nowrap px-4 py-3">
        <button class="${sentence.audioUrl ? ui.secondary : `${ui.secondary} opacity-50`} !min-h-8 !px-2.5 !py-1" data-action="playSentenceAudio" data-audio-url="${escapeHtml(sentence.audioUrl || "")}" aria-label="Play sentence audio" ${sentence.audioUrl ? "" : "disabled"}>${icon("play", "h-3.5 w-3.5")}</button>
      </td>
      ${canManage ? `<td class="whitespace-nowrap px-4 py-3"><button class="${ui.danger} !min-h-8 !px-2.5 !py-1 text-xs" data-action="openDeleteDeckSentenceModal:${escapeHtml(sentence.itemId || "")}">${icon("trash", "h-3.5 w-3.5")}<span>Remove</span></button></td>` : ""}
    </tr>
  `).join("");
}

export function sentenceDeckTopicSentencesView({ appConfig, state, activeDeckId, activeTopicId }) {
  const deck = state.sentenceDecks?.find((item) => item.id === activeDeckId);
  const topic = deck?.topics?.find((item) => item.id === activeTopicId);
  if (!deck || !topic) {
    return `<section class="${ui.card}"><h2 class="text-2xl font-bold text-brand-ink">Topic not found</h2><p class="mt-2 ${ui.muted}">This topic may be private or unavailable.</p></section>`;
  }
  const rows = topicSentenceRows(topic, deck);
  const hasAudio = (topic.sentences || []).some((sentence) => sentence.audioUrl);
  const canManage = deck.owner && !deck.system;
  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-brand-cream px-4 py-5 text-brand-ink sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <div class="mb-4">
        <button class="${ui.secondary}" data-action="openDeck:${deck.id}">${icon("arrowLeft")}<span>Go Back</span></button>
      </div>
      <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.08)]">
        <div class="relative bg-gradient-to-br from-brand-red via-brand-amber to-brand-panel p-5 sm:p-7">
          ${deck.imageUrl ? `<img class="absolute inset-0 h-full w-full object-cover" src="${escapeHtml(deck.imageUrl)}" alt="">` : ""}
          <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,250,244,.94),rgba(255,250,244,.76)_52%,rgba(29,41,63,.24))]"></div>
          <div class="relative flex flex-wrap items-start justify-between gap-4">
            <div class="max-w-4xl">
              <span class="${ui.tagGold}">${escapeHtml(deck.visibility || "Deck")}</span>
              <h2 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-brand-ink">${escapeHtml(deck.name)}</h2>
              <p class="mt-2 text-xl font-bold text-brand-charcoal">${escapeHtml(topic.name)}</p>
            </div>
            <button class="${hasAudio ? ui.primary : `${ui.secondary} opacity-50`}" data-action="playAllTopicAudio" ${hasAudio ? "" : "disabled"}>${icon("play")}<span>Play All</span></button>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead class="bg-white/70 text-left text-xs font-bold uppercase text-brand-graphite">
              <tr>
                <th class="px-4 py-3">Row No</th>
                <th class="px-4 py-3">Source Language</th>
                <th class="px-4 py-3">Target Language</th>
                <th class="px-4 py-3">Romanization</th>
                <th class="px-4 py-3">Audio</th>
                ${canManage ? `<th class="px-4 py-3">Actions</th>` : ""}
              </tr>
            </thead>
            <tbody>${rows || `<tr><td class="px-4 py-6 text-sm text-brand-graphite" colspan="${canManage ? 6 : 5}">No sentences yet.</td></tr>`}</tbody>
          </table>
        </div>
      </section>
    </div>
  `;
}

function reviewStatus(sentence) {
  if (sentence.lastRating === "Hard") return "Hard";
  if (sentence.lastRating === "Good") return "Easy";
  if (sentence.lastRating === "Easy" || sentence.state === "Mastered") return "I Know";
  return "Need Review";
}

function sentenceDeckTable(deck, appConfig = {}) {
  const canManage = deck.owner && !deck.system;
  const rows = (deck.sentences || []).map((sentence) => `
    <tr class="border-t border-brand-line/70">
      <td class="px-4 py-3 text-sm font-semibold text-brand-ink">${escapeHtml(languageName(appConfig, sentence.sourceLanguage || deck.sourceLanguage || "en-US"))}</td>
      <td class="px-4 py-3 text-sm text-brand-charcoal">
        <div class="font-bold text-brand-ink">${escapeHtml(sentence.target)}</div>
        <div class="mt-1">${escapeHtml(sentence.translation)}</div>
        ${sentence.imageUrl ? `<img class="mt-3 h-28 w-full rounded-lg object-cover" src="${escapeHtml(sentence.imageUrl)}" alt="">` : ""}
        ${sentence.audioUrl ? `<audio class="mt-3 w-full" controls src="${escapeHtml(sentence.audioUrl)}"></audio>` : ""}
        ${sentence.videoUrl ? `<video class="mt-3 max-h-64 w-full rounded-lg bg-black object-contain" controls src="${escapeHtml(sentence.videoUrl)}"></video>` : ""}
      </td>
      <td class="px-4 py-3 text-sm text-brand-graphite">${sentence.dueDate ? formatDate(sentence.dueDate) : "Not reviewed"}</td>
      <td class="px-4 py-3"><span class="${ui.tagDark}">${escapeHtml(reviewStatus(sentence))}</span></td>
      ${canManage ? `<td class="whitespace-nowrap px-4 py-3"><button class="${ui.danger} !min-h-8 !px-2.5 !py-1 text-xs" data-action="openDeleteDeckSentenceModal:${escapeHtml(sentence.itemId || "")}">${icon("trash", "h-3.5 w-3.5")}<span>Remove</span></button></td>` : ""}
    </tr>
  `).join("");

  return `
    <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-brand-line/70 bg-white/60 px-4 py-3">
        <div>
          <h3 class="text-lg font-bold tracking-tight text-brand-ink">Sentences</h3>
          <p class="text-sm text-brand-graphite">${deck.sentences?.length || 0} deck sentences</p>
        </div>
        <button class="${ui.primary}" data-action="practiceDeck:${deck.id}">${icon("book")}<span>Review</span></button>
      </div>
      <div class="overflow-x-auto">
        <table class="min-w-full border-collapse">
          <thead class="bg-white/70 text-left text-xs font-bold uppercase text-brand-graphite">
            <tr>
              <th class="px-4 py-3">Source Language</th>
              <th class="px-4 py-3">Target Language</th>
              <th class="px-4 py-3">Last Reviewed</th>
              <th class="px-4 py-3">Review Status</th>
              ${canManage ? `<th class="px-4 py-3">Actions</th>` : ""}
            </tr>
          </thead>
          <tbody>${rows || `<tr><td class="px-4 py-6 text-sm text-brand-graphite" colspan="${canManage ? 5 : 4}">No sentences yet.</td></tr>`}</tbody>
        </table>
      </div>
    </section>
  `;
}

export function sentenceDeckDetailView({ appConfig, state, activeDeckId }) {
  const deck = state.sentenceDecks?.find((item) => item.id === activeDeckId);
  if (!deck) {
    return `<section class="${ui.card}"><h2 class="text-2xl font-bold text-brand-ink">Deck not found</h2><p class="mt-2 ${ui.muted}">This deck may be private or unavailable.</p></section>`;
  }
  const hasTopics = (deck.topics || []).length > 0;
  return `
    <div class="-m-4 min-h-[calc(100vh-80px)] bg-brand-cream px-4 py-5 text-brand-ink sm:-m-6 sm:px-6 lg:-m-7 lg:px-7">
      <section class="overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.08)]">
        <div class="relative min-h-44 bg-gradient-to-br from-brand-red via-brand-amber to-brand-panel p-5 sm:p-7">
          ${deck.imageUrl ? `<img class="absolute inset-0 h-full w-full object-cover" src="${escapeHtml(deck.imageUrl)}" alt="">` : ""}
          <div class="absolute inset-0 bg-[linear-gradient(115deg,rgba(255,250,244,.94),rgba(255,250,244,.76)_52%,rgba(29,41,63,.28))]"></div>
          <div class="relative flex flex-wrap items-start justify-between gap-4">
          <div class="max-w-3xl">
            <span class="${deck.visibility === "Public" ? ui.tagRed : ui.tagGold}">${escapeHtml(deck.visibility)}</span>
            <h2 class="mt-4 text-4xl font-bold leading-tight tracking-tight text-brand-ink">${escapeHtml(deck.name)}</h2>
            <p class="mt-3 max-w-2xl text-base leading-7 text-brand-charcoal">${escapeHtml(deck.description || "No description yet.")}</p>
            <div class="mt-4 flex flex-wrap gap-2">
              <span class="${ui.tag}">Creator: ${escapeHtml(deck.ownerName || deck.creator)}</span>
              <span class="${ui.tag}">Level ${escapeHtml(deck.level)}</span>
              <span class="${ui.tagGold}">${escapeHtml(deck.coins)} coins</span>
              <span class="${ui.tagDark}">${escapeHtml(deck.reviewStatus)}</span>
              <span class="${ui.tag}">${escapeHtml(languageName(appConfig, deck.sourceLanguage || "en-US"))} to ${escapeHtml(languageName(appConfig, deck.targetLanguage || state.user.targetLanguage))}</span>
            </div>
          </div>
          <div class="grid gap-2">
            <button class="${ui.primary}" data-action="practiceDeck:${deck.id}">${icon("book")}<span>Review</span></button>
            <button class="${ui.secondary}" data-action="openReviewSettingsModal">${icon("bell")}<span>Settings</span></button>
            ${deck.owner && !deck.system ? `<button class="${ui.secondary}" data-action="openAddTopicModal:${deck.id}">${icon("add")}<span>Add Topic</span></button><button class="${ui.secondary}" data-action="openAddDeckSentenceModal:${deck.id}">${icon("add")}<span>Add Sentence</span></button><button class="${ui.danger}" data-action="openDeleteDeckModal:${deck.id}">${icon("trash")}<span>Delete Deck</span></button>` : ""}
          </div>
          </div>
        </div>
        <div class="grid gap-3 p-5 sm:grid-cols-4 sm:p-7">
          ${statPill("Progress", `${deck.progress || 0}%`, "target")}
          ${statPill("Sentences", deck.sentenceCount || 0, "book")}
          ${statPill("Next review", deck.nextReviewDate ? formatDate(deck.nextReviewDate) : "Not scheduled", "bell")}
          ${statPill("Topics", deck.topics?.length || 0, "bookmark")}
        </div>
      </section>
      <div class="mt-6 grid gap-4">
        ${hasTopics ? `<section class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">${deck.topics.map((topic) => topicSection(topic, deck)).join("")}</section>` : sentenceDeckTable(deck, appConfig)}
      </div>
    </div>
  `;
}
