import { button, escapeHtml, ui } from "../ui.js";

export function reviewView({ state }) {
  const due = state.sentences.filter((sentence) => sentence.dueDate <= new Date().toISOString().slice(0, 10));
  const list = due.length ? due : state.sentences.slice(0, 2);
  return `<div class="grid gap-4">${list
    .map(
      (sentence) => `
        <article class="${ui.card}">
          <span class="${ui.tagDark}">${escapeHtml(sentence.state)}</span>
          <h2 class="mt-4 text-4xl font-bold">${escapeHtml(sentence.target)}</h2>
          <p class="mt-2 text-lg text-brand-charcoal">${escapeHtml(sentence.translation)}</p>
          <div class="mt-5 flex flex-wrap gap-2">
            ${["Again", "Hard", "Good", "Easy"].map((rating) => button(rating, `review:${sentence.id}:${rating}`, rating === "Again" ? ui.danger : ui.secondary)).join("")}
          </div>
        </article>
      `
    )
    .join("")}</div>`;
}
