import { escapeHtml, formatDate, icon, stat, ui } from "../ui.js";

function transactionAmount(amount) {
  const value = Number(amount) || 0;
  const earned = value > 0;
  const spent = value < 0;
  const className = earned ? "text-emerald-700" : spent ? "text-brand-redDark" : "text-brand-graphite";
  const label = `${earned ? "+" : ""}${value}`;

  return `<span class="font-black ${className}">${label}</span>`;
}

function ruleDescription(rule) {
  const labels = {
    daily_review: "Complete a due review session.",
    sentence_pack_completed: "Finish all sentences in a sentence pack.",
    story_completed: "Complete a story after reading it.",
    goal_completed: "Finish one of your learning goals.",
    learning_post_created: "Share a learning post with the community.",
    sentence_mining: "Save or mine a useful sentence.",
    shadowing_session: "Complete a shadowing practice session.",
    review_saved_sentences: "Review your saved sentence deck.",
    create_goal: "Create a learning goal.",
    follow_learner: "Follow a learner from the community.",
    receive_like: "Receive a like on a community post.",
    receive_comment: "Receive a comment on a community post.",
    welcome_bonus: "Create your account and start learning.",
    goal_support_received: "Receive coin support on a public goal.",
    moment_appreciation_received: "Receive appreciation coins on a moment.",
    direct_message_received: "Receive a paid encouragement message."
  };
  return labels[rule.ruleKey] || `Earn coins from ${rule.label.toLowerCase()}.`;
}

export function coinRulesModal({ state }) {
  const earnRules = (state.coinRules || []).filter((rule) => rule.ruleType === "earn" && Number(rule.amount) > 0);
  return `
    <div>
      <h2 class="text-2xl font-bold tracking-tight text-brand-ink">How Coins Are Earned</h2>
      <p class="mt-2 ${ui.muted}">Coins reward learning actions, community encouragement, and steady progress.</p>
      <div class="mt-5 grid gap-3">
        ${
          earnRules.length
            ? earnRules
                .map(
                  (rule) => `
                    <article class="rounded-lg border border-brand-line/80 bg-white/60 p-4">
                      <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 class="text-sm font-bold text-brand-ink">${escapeHtml(rule.label)}</h3>
                          <p class="mt-1 text-sm leading-6 text-brand-charcoal">${escapeHtml(ruleDescription(rule))}</p>
                        </div>
                        <span class="${ui.tagGold}">+${Number(rule.amount)} ${Number(rule.amount) === 1 ? "coin" : "coins"}</span>
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<p class="${ui.muted}">No active earning rules are configured yet.</p>`
        }
      </div>
    </div>
  `;
}

export function walletView({ state }) {
  return `
    <section class="mb-5">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div class="max-w-3xl">
          <h2 class="text-2xl font-black tracking-tight text-brand-ink">Coin Activity</h2>
          <p class="mt-2 ${ui.muted}">Review your coin balance, earnings, and spending history across lessons, stories, goals, and community activity.</p>
        </div>
        <button class="inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-lg bg-brand-orange px-4 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(224,114,88,.22)] transition hover:bg-brand-redDark" data-action="openCoinRulesModal">
          ${icon("coins", "h-4 w-4")}
          <span>How Coins Are Earned</span>
        </button>
      </div>
    </section>
    <section class="${ui.grid4}">
      ${stat("Current balance", state.wallet.balance)}
      ${stat("Lifetime earned", state.wallet.lifetimeEarned)}
      ${stat("Lifetime spent", state.wallet.lifetimeSpent)}
      ${stat("Weekly earned", state.wallet.weeklyEarned)}
    </section>
    <section class="${ui.card} mt-4">
      <h2 class="text-xl font-black">Transaction History</h2>
      <div class="mt-3 grid gap-3 md:hidden">
        ${
          state.wallet.transactions.length
            ? state.wallet.transactions
                .map(
                  (item) => `
                    <article class="rounded-lg border border-brand-line/80 bg-white/60 p-4">
                      <div class="flex items-start justify-between gap-3">
                        <div class="min-w-0">
                          <h3 class="text-sm font-bold leading-6 text-brand-ink">${escapeHtml(item.label)}</h3>
                          <p class="mt-1 text-sm font-semibold text-brand-graphite">${escapeHtml(formatDate(item.date))}</p>
                        </div>
                        <div class="shrink-0 text-right">${transactionAmount(item.amount)}</div>
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<p class="${ui.muted}">No wallet activity yet.</p>`
        }
      </div>
      <table class="mt-3 hidden w-full border-collapse text-sm md:table">
        <tbody>${state.wallet.transactions.map((item) => `<tr class="border-b border-zinc-100"><td class="py-3">${escapeHtml(item.label)}</td><td class="py-3 text-brand-graphite">${escapeHtml(formatDate(item.date))}</td><td class="py-3 text-right">${transactionAmount(item.amount)}</td></tr>`).join("")}</tbody>
      </table>
    </section>
  `;
}
