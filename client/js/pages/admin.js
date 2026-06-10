import { stat, ui } from "../ui.js";

export function adminView({ state }) {
  return `
    <section class="${ui.grid3}">
      ${stat("Sentence decks", state.admin.sentenceDecks)}
      ${stat("Stories", state.admin.stories)}
      ${stat("Coin rules", state.admin.coinRules)}
      ${stat("Moderation queue", state.admin.moderationQueue)}
      ${stat("Goal templates", state.admin.goalTemplates)}
    </section>
  `;
}
