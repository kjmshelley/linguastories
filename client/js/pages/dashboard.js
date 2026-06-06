import { button, escapeHtml, progressBar, stat, ui } from "../ui.js";

export function dashboardView({ state }) {
  const due = state.sentences.find((sentence) => sentence.dueDate <= new Date().toISOString().slice(0, 10)) || state.sentences[0];
  return `
    <div class="grid gap-4 xl:grid-cols-[1.15fr_.85fr]">
      <section class="relative overflow-hidden rounded-lg border border-brand-line/80 bg-brand-panel p-6 text-brand-ink shadow-[0_18px_42px_rgba(29,41,63,.09)]">
        <div class="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,250,244,.98),rgba(248,246,242,.9)_55%,rgba(44,122,123,.12))]"></div>
        <div class="relative z-10">
          <span class="${ui.tagGold}">${escapeHtml(due.source)}</span>
          <h2 class="mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-5xl">${escapeHtml(due.target)}</h2>
          <p class="mt-3 text-xl text-brand-charcoal">${escapeHtml(due.translation)}</p>
          <p class="mt-4 max-w-2xl text-sm leading-6 text-brand-graphite">${escapeHtml(due.notes)}</p>
          <p class="mt-6 text-xs font-semibold text-brand-graphite">Completing this review gives 5 coins.</p>
          <div class="mt-2 flex flex-wrap gap-2">${button("Review Now", `review:${due.id}:Good`)}${button("Practice Shadowing", "shadowing", ui.secondary)}</div>
        </div>
        <img class="absolute -bottom-16 -right-10 w-56 opacity-10" src="/assets/img/linguastories.png" alt="" />
      </section>
      <section class="${ui.grid2}">
        ${stat("Reviews due", state.dashboard.reviewsDue)}
        ${stat("New sentences", state.dashboard.newSentences)}
        ${stat("Stories ready", state.dashboard.storiesAvailable)}
        ${stat("Coins to earn", state.dashboard.coinsAvailable)}
      </section>
    </div>
    <section class="${ui.grid3} mt-4">
      ${state.paths
        .map(
          (path) => `
            <article class="${ui.card}">
              <h3 class="text-base font-bold">${escapeHtml(path.title)}</h3>
              <p class="mt-2 min-h-12 text-sm leading-6 text-brand-graphite">${path.items.map(escapeHtml).join(" / ")}</p>
              <div class="mt-3">${progressBar(path.progress)}</div>
            </article>
          `
        )
        .join("")}
    </section>
  `;
}
