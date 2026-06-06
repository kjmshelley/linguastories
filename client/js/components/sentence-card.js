import { button, escapeHtml, ui } from "../ui.js";

export function sentenceCard(sentence) {
  return `
    <article class="${ui.cardHover}">
      <div class="${ui.row}">
        <span class="${ui.tagGold}">${escapeHtml(sentence.level)}</span>
        <span class="${ui.tag}">${escapeHtml(sentence.topic)}</span>
        <span class="${ui.tagDark}">${escapeHtml(sentence.state)}</span>
      </div>
      <h3 class="mt-4 text-2xl font-black">${escapeHtml(sentence.target)}</h3>
      <p class="mt-2 text-brand-charcoal">${escapeHtml(sentence.translation)}</p>
      <p class="mt-1 text-sm text-brand-graphite">${escapeHtml(sentence.romanization)}</p>
      <p class="mt-3 text-sm leading-6 text-brand-graphite">${escapeHtml(sentence.notes)}</p>
      <p class="mt-4 text-xs font-semibold text-brand-graphite">Learning this sentence gives 10 coins.</p>
      <div class="mt-2 flex flex-wrap gap-2">${button("Learn", `learn:${sentence.id}`)}${button("Details", `sentence:${sentence.id}`, ui.secondary)}</div>
    </article>
  `;
}
