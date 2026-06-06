import { sentenceCard } from "../components/sentence-card.js";
import { ui } from "../ui.js";

export function deckView({ state }) {
  const saved = state.sentences.filter((sentence) => state.savedSentences.includes(sentence.id));
  return `
    <div class="${ui.grid2}">
      <section class="${ui.card}">
        <h2 class="text-xl font-black">Add Custom Sentence</h2>
        <form class="mt-4 grid gap-3" data-form="customSentence">
          <label class="${ui.label}">Sentence<input class="${ui.input}" name="target" required placeholder="日本語を勉強しています。"></label>
          <label class="${ui.label}">Translation<input class="${ui.input}" name="translation" required placeholder="I am studying Japanese."></label>
          <label class="${ui.label}">Topic<input class="${ui.input}" name="topic" value="Daily Life"></label>
          <label class="${ui.label}">Level<select class="${ui.input}" name="level"><option>A1</option><option>A2</option><option>B1</option><option>B2</option><option>C1</option></select></label>
          <label class="${ui.label}">Notes<textarea class="${ui.input} min-h-24" name="notes" placeholder="Why this sentence matters"></textarea></label>
          <p class="text-xs font-semibold text-brand-graphite">Adding a custom sentence gives 2 coins.</p>
          <button class="${ui.primary}">Add</button>
        </form>
      </section>
      <section class="grid gap-4">${saved.map(sentenceCard).join("")}</section>
    </div>
  `;
}
