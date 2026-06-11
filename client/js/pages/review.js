import { button, escapeHtml, icon, progressBar, ui } from "../ui.js";

function dueSentences(state, deckId, topicId = "") {
  if (deckId) {
    const deck = state.sentenceDecks?.find((item) => item.id === deckId);
    if (!deck) return [];
    const topics = topicId ? (deck.topics || []).filter((topic) => topic.id === topicId) : deck.topics || [];
    const topicSentences = topics.flatMap((topic) => (topic.sentences || []).map((sentence) => ({ ...sentence, deckId, topicId: topic.id, topicName: topic.name })));
    if (topicId) return topicSentences;
    return topicSentences.length ? topicSentences : (deck.sentences || []).map((sentence) => ({ ...sentence, deckId, topicId: "" }));
  }
  const due = state.sentences.filter((sentence) => sentence.dueDate <= new Date().toISOString().slice(0, 10));
  return due.length ? due : state.sentences.slice(0, 2);
}

function reviewButton(label, action, className = ui.secondary) {
  return `<button class="${className}" data-action="${action}">${icon(label === "I know this" ? "check" : "book")}<span>${label}</span></button>`;
}

export function reviewView({ state, reviewSettings = {} }) {
  const params = new URLSearchParams(location.search);
  const deckId = params.get("deckId") || "";
  const topicId = params.get("topicId") || "";
  const requestedCardIndex = Math.max(0, Number(params.get("card") || 0) || 0);
  const deck = deckId ? state.sentenceDecks?.find((item) => item.id === deckId) : null;
  const topic = topicId && deck ? (deck.topics || []).find((item) => item.id === topicId) : null;
  const list = dueSentences(state, deckId, topicId);
  const currentIndex = list.length ? Math.min(requestedCardIndex, list.length - 1) : 0;
  if (list.length && requestedCardIndex !== currentIndex) {
    params.set("card", String(currentIndex));
    history.replaceState({}, "", `${location.pathname}?${params.toString()}`);
  }
  const current = list[currentIndex];
  if (!current) {
    return `
      <section class="${ui.card}">
        <span class="${ui.tagGold}">Review Complete</span>
        <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">${topic ? escapeHtml(topic.name) : deck ? escapeHtml(deck.name) : "All caught up"}</h2>
        <p class="mt-2 ${ui.muted}">No cards are waiting in this review session.</p>
      </section>
    `;
  }

  const cardNumber = currentIndex + 1;
  const progress = Math.round((cardNumber / list.length) * 100);
  const responseActions = deck
    ? [
        ["Show again", `deckReview:${deck.id}:${current.id}:show_again`, ui.danger],
        ["Hard", `deckReview:${deck.id}:${current.id}:hard`, ui.secondary],
        ["Easy", `deckReview:${deck.id}:${current.id}:easy`, ui.secondary],
        ["I know this", `deckReview:${deck.id}:${current.id}:known`, ui.primary]
      ]
    : [
        ["Show again", `review:${current.id}:Again`, ui.danger],
        ["Hard", `review:${current.id}:Hard`, ui.secondary],
        ["Easy", `review:${current.id}:Good`, ui.secondary],
        ["I know this", `review:${current.id}:Easy`, ui.primary]
      ];

  const shouldShowSource = Boolean(reviewSettings.showSourceLanguage);
  const shouldShowRomanization = Boolean(reviewSettings.showRomanization);
  return `
    <section class="mx-auto grid max-w-4xl gap-4">
      <div class="${ui.card}">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="${ui.tagGold}">${topic ? `${escapeHtml(deck.name)} / ${escapeHtml(topic.name)}` : deck ? escapeHtml(deck.name) : "Daily Review"}</span>
            <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Card ${cardNumber} of ${list.length}</h2>
          </div>
          ${deck ? `<a class="${ui.secondary}" href="/app/sentence-mining/decks/${escapeHtml(deck.id)}" data-app-link>${icon("arrowLeft")}<span>Back to Deck</span></a>` : ""}
        </div>
        <div class="mt-4">${progressBar(progress)}</div>
      </div>
      <article class="group min-h-[320px] rounded-lg border border-brand-line/80 bg-brand-panel p-6 shadow-[0_18px_42px_rgba(29,41,63,.08)]" data-review-card data-card-index="${currentIndex}" data-card-count="${list.length}" data-audio-url="${escapeHtml(current.audioUrl || "")}" data-auto-play-audio="${reviewSettings.playAudioAutomatically ? "true" : "false"}" data-auto-next-card="${reviewSettings.goToNextCardAutomatically ? "true" : "false"}">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${ui.tagDark}">${escapeHtml(current.state || "New")}</span>
          <span class="${ui.tag}">${escapeHtml(current.level || deck?.level || "A1")}</span>
        </div>
        <div class="mt-8 rounded-lg bg-brand-mist/45 p-6 text-center">
          ${current.imageUrl ? `<img class="mx-auto mb-5 max-h-72 rounded-lg object-cover" src="${escapeHtml(current.imageUrl)}" alt="">` : ""}
          <p class="text-4xl font-bold leading-tight text-brand-ink">${escapeHtml(current.target)}</p>
          ${shouldShowRomanization && current.romanization ? `<p class="mt-3 text-lg font-semibold leading-7 text-brand-graphite">${escapeHtml(current.romanization)}</p>` : ""}
          ${shouldShowSource ? `<p class="mx-auto mt-5 max-w-2xl rounded-lg bg-white/70 p-4 text-xl font-bold leading-8 text-brand-charcoal">${escapeHtml(current.translation)}</p>` : ""}
          ${current.audioUrl ? `<audio class="mx-auto mt-5 w-full max-w-xl" controls src="${escapeHtml(current.audioUrl)}"></audio>` : ""}
          ${current.videoUrl ? `<video class="mx-auto mt-5 max-h-80 w-full max-w-xl rounded-lg bg-black object-contain" controls src="${escapeHtml(current.videoUrl)}"></video>` : ""}
          <button class="${ui.secondary} mt-6" data-action="flipReviewCard">${icon("eye")}<span>Show Translation</span></button>
          <div class="mt-5 hidden rounded-lg bg-white/70 p-4" data-review-answer>
            <p class="text-xl font-bold text-brand-charcoal">${escapeHtml(current.translation)}</p>
            ${current.notes ? `<p class="mt-2 text-sm leading-6 text-brand-graphite">${escapeHtml(current.notes)}</p>` : ""}
          </div>
        </div>
      </article>
      <div class="grid gap-2 sm:grid-cols-4">
        ${responseActions.map(([label, action, className]) => reviewButton(label, action, className)).join("")}
      </div>
    </section>
  `;
}
