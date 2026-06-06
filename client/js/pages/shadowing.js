import { button, escapeHtml, ui } from "../ui.js";

export function shadowingView({ state }) {
  const sentence = state.sentences[0];
  return `
    <section class="relative overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel p-6 text-brand-ink shadow-[0_18px_42px_rgba(29,41,63,.09)]">
      <span class="${ui.tagGold}">Shadowing</span>
      <h2 class="mt-4 text-5xl font-bold leading-tight">${escapeHtml(sentence.target)}</h2>
      <p class="mt-3 text-xl text-brand-charcoal">${escapeHtml(sentence.romanization)}</p>
      <p class="mt-4 text-sm leading-6 text-brand-graphite">Listen, repeat, listen again, repeat again, then self-rate.</p>
      <div class="mt-6 flex flex-wrap gap-2">
        <button class="${ui.secondary}">Normal speed</button>
        <button class="${ui.secondary}">Slow speed</button>
        <button class="${ui.secondary}">Auto replay</button>
        <button class="${ui.secondary}">Loop</button>
      </div>
      <p class="mt-5 text-xs font-semibold text-brand-graphite">Completing this shadowing session gives 5 coins.</p>
      <div class="mt-2">${button("Complete", "completeShadowing")}</div>
    </section>
  `;
}
