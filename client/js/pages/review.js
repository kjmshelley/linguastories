import { button, escapeHtml, icon, progressBar, ui } from "../ui.js";

function dueSentences(state, deckId) {
  if (deckId) {
    const deck = state.sentenceDecks?.find((item) => item.id === deckId);
    if (!deck) return [];
    const topicSentences = deck.topics?.flatMap((topic) => topic.sentences.map((sentence) => ({ ...sentence, deckId, topicId: topic.id }))) || [];
    return topicSentences.length ? topicSentences : (deck.sentences || []).map((sentence) => ({ ...sentence, deckId, topicId: "" }));
  }
  const due = state.sentences.filter((sentence) => sentence.dueDate <= new Date().toISOString().slice(0, 10));
  return due.length ? due : state.sentences.slice(0, 2);
}

function reviewButton(label, action, className = ui.secondary) {
  return `<button class="${className}" data-action="${action}">${icon(label === "I know this" ? "check" : "book")}<span>${label}</span></button>`;
}

export function reviewView({ state }) {
  const params = new URLSearchParams(location.search);
  const deckId = params.get("deckId") || "";
  const requestedCardIndex = Math.max(0, Number(params.get("card") || 0) || 0);
  const deck = deckId ? state.sentenceDecks?.find((item) => item.id === deckId) : null;
  const list = dueSentences(state, deckId);
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
        <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">${deck ? escapeHtml(deck.name) : "All caught up"}</h2>
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

  return `
    <section class="mx-auto grid max-w-4xl gap-4">
      <div class="${ui.card}">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span class="${ui.tagGold}">${deck ? escapeHtml(deck.name) : "Daily Review"}</span>
            <h2 class="mt-3 text-2xl font-bold tracking-tight text-brand-ink">Card ${cardNumber} of ${list.length}</h2>
          </div>
          ${deck ? `<a class="${ui.secondary}" href="/app/sentence-mining/decks/${escapeHtml(deck.id)}" data-app-link>${icon("arrowLeft")}<span>Back to Deck</span></a>` : ""}
        </div>
        <div class="mt-4">${progressBar(progress)}</div>
      </div>
      <article class="group min-h-[320px] rounded-lg border border-brand-line/80 bg-brand-panel p-6 shadow-[0_18px_42px_rgba(29,41,63,.08)]" data-review-card data-card-index="${currentIndex}" data-card-count="${list.length}" data-audio-url="${escapeHtml(current.audioUrl || "")}">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${ui.tagDark}">${escapeHtml(current.state || "New")}</span>
          <span class="${ui.tag}">${escapeHtml(current.level || deck?.level || "A1")}</span>
        </div>
        <div class="mt-8 rounded-lg bg-brand-mist/45 p-6 text-center">
          ${current.imageUrl ? `<img class="mx-auto mb-5 max-h-72 rounded-lg object-cover" src="${escapeHtml(current.imageUrl)}" alt="">` : ""}
          <p class="text-4xl font-bold leading-tight text-brand-ink">${escapeHtml(current.target)}</p>
          ${current.audioUrl ? `<audio class="mx-auto mt-5 w-full max-w-xl" controls src="${escapeHtml(current.audioUrl)}"></audio>` : ""}
          <button class="${ui.secondary} mt-6" data-action="flipReviewCard">${icon("eye")}<span>Show Translation</span></button>
          <div class="mt-5 hidden rounded-lg bg-white/70 p-4" data-review-answer>
            <p class="text-xl font-bold text-brand-charcoal">${escapeHtml(current.translation)}</p>
            ${current.notes ? `<p class="mt-2 text-sm leading-6 text-brand-graphite">${escapeHtml(current.notes)}</p>` : ""}
          </div>
        </div>
        <p class="mt-4 text-xs font-semibold text-brand-graphite">This card automatically advances after 5 seconds unless you choose a response.</p>
      </article>
      <div class="grid gap-2 sm:grid-cols-4">
        ${responseActions.map(([label, action, className]) => reviewButton(label, action, className)).join("")}
      </div>
    </section>
  `;
}
