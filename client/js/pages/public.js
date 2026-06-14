import { escapeHtml, icon, ui } from "../ui.js";
import { languageSelectOptions, supportedLanguageOptions } from "../languages.js";

function languageOptions(languages, selected) {
  return languageSelectOptions({ supportedLanguages: languages }, selected, { placeholder: "Choose a language" });
}

export function publicNav(active = "", options = {}) {
  const inactiveTopButton =
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-line bg-white px-4 py-2 text-sm font-black text-brand-charcoal no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-brand-orange/60 hover:bg-brand-snow";
  const activeTopButton =
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-red px-4 py-2 text-sm font-black text-white no-underline shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-redDark";
  return `
    <nav class="mx-auto flex w-[min(1180px,calc(100%_-_32px))] items-center justify-between gap-4 px-0 py-4 sm:px-4 sm:py-5">
      <a class="flex items-center gap-3 text-brand-ink no-underline" href="/" data-link>
        <img class="h-12 w-12 object-contain" src="/assets/img/linguastories.png" alt="" />
        <span><strong class="block text-base font-black leading-tight">LinguaStories</strong><small class="block text-xs font-semibold text-brand-graphite">Fluency through sentences</small></span>
      </a>
      ${
        options.hideActions
          ? ""
            : `<div class="hidden items-center gap-7 text-sm font-bold text-brand-graphite lg:flex">
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#learn">Learn</a>
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#remember">Remember</a>
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#practice">Practice</a>
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#motivation">Motivation</a>
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#pricing">Pricing</a>
            </div>
            <div class="flex items-center gap-2">
              <a class="${active === "login" ? activeTopButton : inactiveTopButton}" href="/login" data-link>Login</a>
            </div>
            <details class="relative lg:hidden">
              <summary class="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border border-brand-line bg-white text-brand-ink shadow-sm [&::-webkit-details-marker]:hidden" aria-label="Open navigation">
                ${icon("menu", "h-5 w-5")}
              </summary>
              <div class="absolute right-0 top-14 z-30 grid w-[min(260px,calc(100vw-32px))] gap-1 rounded-lg border border-brand-line bg-brand-panel p-2 shadow-2xl">
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#learn">Learn</a>
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#remember">Remember</a>
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#practice">Practice</a>
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#motivation">Motivation</a>
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#pricing">Pricing</a>
              </div>
            </details>`
      }
    </nav>
  `;
}

function sectionIntro({ eyebrow, title, body, align = "center" }) {
  const alignment = align === "left" ? "" : "mx-auto text-center";
  return `
    <div class="${alignment} max-w-3xl">
      <span class="${ui.tagRed}">${escapeHtml(eyebrow)}</span>
      <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight text-brand-ink sm:text-4xl">${escapeHtml(title)}</h2>
      <p class="mt-3 text-base leading-7 text-brand-charcoal">${escapeHtml(body)}</p>
    </div>
  `;
}

function featureCard({ title, body, iconName = "star", tone = "red" }) {
  const toneClass = tone === "blue" ? "bg-brand-blue/10 text-brand-blue" : tone === "teal" ? "bg-brand-teal/10 text-brand-teal" : "bg-brand-red/10 text-brand-redDark";
  return `
    <article class="rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="grid h-11 w-11 place-items-center rounded-lg ${toneClass} ring-1 ring-brand-line/50">${icon(iconName, "h-5 w-5")}</div>
      <h3 class="mt-4 text-lg font-black leading-snug text-brand-ink">${escapeHtml(title)}</h3>
      <p class="mt-2 text-sm leading-6 text-brand-graphite">${escapeHtml(body)}</p>
    </article>
  `;
}

function statCard(value, label) {
  return `
    <div class="rounded-lg border border-white/15 bg-white/10 p-3 text-white backdrop-blur sm:p-4">
      <strong class="block text-xl font-black sm:text-2xl">${escapeHtml(value)}</strong>
      <span class="mt-1 block text-sm font-semibold text-white/78">${escapeHtml(label)}</span>
    </div>
  `;
}

function journeyStep(index, title, body, iconName) {
  return `
    <article class="grid gap-4 rounded-lg border border-brand-line/80 bg-white/65 p-5 shadow-[0_1px_2px_rgba(29,41,63,.04)] md:grid-cols-[auto_minmax(0,1fr)]">
      <div class="flex items-center gap-3">
        <span class="grid h-11 w-11 place-items-center rounded-lg bg-brand-ink text-white">${icon(iconName, "h-5 w-5")}</span>
        <strong class="text-sm font-black text-brand-redDark">Step ${index}</strong>
      </div>
      <div>
        <h3 class="text-lg font-black text-brand-ink">${escapeHtml(title)}</h3>
        <p class="mt-1 text-sm leading-6 text-brand-graphite">${escapeHtml(body)}</p>
      </div>
    </article>
  `;
}

const fallbackTiers = [
  ["free", "Free Tier", 0, 0, false, 0, "learner", ["read_stories", "sentence_mining", "connect", "moments", "find_teacher"]],
  ["basic", "Basic Tier", 2.99, 29.99, true, 7, "learner", ["read_stories", "sentence_mining", "voice_video_rooms", "language_profiles"]],
  ["teacher", "Teacher Tier", 2.99, 29.99, true, 7, "teacher", ["teacher_workspace", "teacher_profile", "voice_video_rooms"]],
  ["teacher_pro", "Teacher Pro Tier", 6.99, 69.99, true, 7, "teacher", ["teacher_workspace", "teacher_profile", "group_lessons"]]
].map(([key, name, monthlyPriceUsd, yearlyPriceUsd, trialEligible, trialLengthDays, accountType, permissions]) => ({
  key,
  name,
  monthlyPriceUsd,
  yearlyPriceUsd,
  trialEligible,
  trialLengthDays,
  accountType,
  permissions
}));

function accountTiers(appConfig) {
  return appConfig.accountTiers?.length ? appConfig.accountTiers : fallbackTiers;
}

function permissionLabel(value) {
  return String(value || "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function tierSummary(tier) {
  if (Number(tier.monthlyPriceUsd || 0) === 0) return "No trial. Free-tier permissions only.";
  return `${tier.trialLengthDays || 7}-day free trial. No card required at signup.`;
}

function pricingCard(tier, { selectable = false, selected = false } = {}) {
  const price = Number(tier.monthlyPriceUsd || 0) > 0 ? `$${Number(tier.monthlyPriceUsd).toFixed(2)}` : "$0";
  return `
    <article class="h-full rounded-lg border ${selected ? "border-brand-red/45 bg-brand-red/10" : "border-brand-line bg-brand-panel"} p-4 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="flex items-start justify-between gap-3">
        <div>
          <h3 class="text-lg font-black text-brand-ink">${escapeHtml(tier.name)}</h3>
          <p class="mt-1 text-xs font-bold uppercase text-brand-graphite">${escapeHtml(tier.accountType || "learner")}</p>
        </div>
        ${selectable ? `<input class="mt-1 h-5 w-5 accent-brand-red" type="radio" name="tierKey" value="${escapeHtml(tier.key)}" ${selected ? "checked" : ""} required aria-label="${escapeHtml(tier.name)}">` : ""}
      </div>
      <p class="mt-4 text-3xl font-black text-brand-ink">${escapeHtml(price)}<span class="text-sm font-bold text-brand-graphite">/month</span></p>
      <p class="mt-1 text-sm font-semibold text-brand-graphite">${escapeHtml(Number(tier.yearlyPriceUsd || 0) > 0 ? `$${Number(tier.yearlyPriceUsd).toFixed(2)}/year` : "Free forever")}</p>
      <p class="mt-3 rounded-lg bg-white/70 px-3 py-2 text-xs font-bold leading-5 text-brand-charcoal">${escapeHtml(tierSummary(tier))}</p>
      <ul class="mt-4 grid gap-2 text-sm leading-5 text-brand-graphite">
        ${(tier.permissions || []).slice(0, 5).map((permission) => `<li class="flex gap-2">${icon("check", "mt-0.5 h-4 w-4 text-brand-redDark")}<span>${escapeHtml(permissionLabel(permission))}</span></li>`).join("")}
      </ul>
    </article>
  `;
}

export function landingView({ appConfig }) {
  const tiers = accountTiers(appConfig);
  const languages = supportedLanguageOptions(appConfig);
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  const problems = [
    ["Random words do not stick", "A word list can help for a day. A sentence from a story gives your brain something to hold onto.", "scanText"],
    ["Speaking gets pushed off", "Reading feels safer, so most learners wait too long to talk. LinguaStories gives you low-pressure rooms, exchanges, and teachers.", "mic"],
    ["Progress feels invisible", "When you cannot see what is improving, motivation fades. Reviews, goals, streaks, and coins keep the next step clear.", "target"],
    ["Apps feel disconnected", "Stories, decks, reviews, community, and lessons all live in one place, so your practice does not restart every time you switch tools.", "dashboard"]
  ];
  const contentFeatures = [
    ["Graded Stories", "Read short stories matched to your level, then move up when the same kind of sentence starts to feel easy.", "reading"],
    ["Listening and Reader Tools", "Use audio, source text, target text, romanization, and story notes when you need support.", "play"],
    ["Story Discussions", "Ask about a phrase, reply to other learners, and turn reading into something social instead of silent.", "message"]
  ];
  const memoryFeatures = [
    ["Sentence Mining", "Save the lines you actually want to say. Travel phrases, jokes, grammar patterns, anything worth keeping.", "scanText"],
    ["Learning Decks", "Turn saved sentences into focused decks by topic, level, and language instead of dumping everything into one pile.", "bookmark"],
    ["Flashcard Reviews", "Review at the right time with clear choices: show again, hard, easy, or I know this.", "bell"],
    ["Custom Media", "Add notes, images, audio, or video to a sentence when context makes it easier to remember.", "upload"]
  ];
  const peopleFeatures = [
    ["Community Learning", "Follow learners, share moments, support goals, and see how other people are practicing today.", "users"],
    ["Language Exchange", "Find people learning your language, message them, and build real conversations around real goals.", "message"],
    ["Teacher Lessons", "Search teacher profiles, book paid lessons, and keep lesson notes and schedules organized.", "calendar"],
    ["Voice and Video Practice Rooms", "Create short focused rooms for pronunciation, sentence practice, or a quick speaking challenge.", "video"]
  ];
  const motivationFeatures = [
    ["Progress Tracking", "See stories completed, sentences learned, streaks, listening time, shadowing, and goal progress.", "dashboard"],
    ["Coins and Rewards", "Earn coins for useful practice, then spend them on unlocks, support, messages, and appreciation.", "coins"],
    ["Goals and Achievements", "Set private or public language goals, track progress, and let other learners cheer you on.", "trophy"],
    ["User Profiles", "Manage multiple language profiles so your Spanish, Japanese, and French progress do not blur together.", "user"]
  ];
  return `
    <section class="min-h-screen bg-brand-snow">
      ${publicNav()}
      <main>
        <section class="relative overflow-hidden bg-brand-ink text-white">
          <div class="absolute inset-0">
            <img class="h-full w-full object-cover" src="/assets/img/landing-platform-hero.jpg" alt="" fetchpriority="high" />
            <div class="absolute inset-0 bg-brand-ink/72"></div>
            <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,41,63,.96)_0%,rgba(29,41,63,.78)_48%,rgba(29,41,63,.42)_100%)]"></div>
          </div>
          <div class="relative mx-auto grid min-h-[calc(100dvh-180px)] w-[min(1180px,calc(100%_-_32px))] content-center px-4 py-6 sm:min-h-[calc(100dvh-120px)] sm:py-14 lg:min-h-[76vh] lg:py-10">
            <div class="max-w-3xl">
              <span class="inline-flex min-h-6 items-center rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">Built for the whole language-learning loop</span>
              <h1 class="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Learn from real content. Remember what matters. Practice with real people.</h1>
              <p class="mt-5 max-w-2xl text-base leading-7 text-white/84 sm:text-lg sm:leading-8">LinguaStories started with graded stories. Now it brings reading, sentence mining, flashcards, community, live rooms, teacher lessons, goals, coins, and progress tracking into one calm place to learn.</p>
              <div class="mt-7 flex flex-col gap-3 sm:flex-row">
                <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-brand-ink no-underline shadow-[0_14px_28px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-brand-snow" href="/signup" data-link>${icon("arrowRight")}<span>Start learning free</span></a>
                <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white no-underline backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/16" href="#journey">${icon("play")}<span>See how it works</span></a>
              </div>
              <div class="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:gap-3">
                ${statCard("20+", "supported languages")}
                ${statCard("A1-C2", "graded learning levels")}
                ${statCard("1 loop", "read, save, review, speak")}
              </div>
            </div>
          </div>
        </section>

        <section class="bg-brand-panel py-14">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "Why learners stall",
              title: "Most language apps make practice feel tidy. Real learning is messier.",
              body: "You need context, memory, people, and motivation working together. LinguaStories is built around that full loop."
            })}
            <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              ${problems.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index % 2 ? "teal" : "red" })).join("")}
            </div>
          </div>
        </section>

        <section id="learn" class="bg-brand-snow py-16">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 lg:grid-cols-[.95fr_1.05fr]">
            <div>
              ${sectionIntro({
                eyebrow: "Learn through real content",
                title: "Start with stories you can actually understand.",
                body: "Short, graded stories give you context before memorization. Read, listen, unlock new stories, save useful sentences, and come back when you are ready for a harder level.",
                align: "left"
              })}
              <div class="mt-7 grid gap-3 sm:grid-cols-3">
                ${contentFeatures.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index === 1 ? "blue" : "red" })).join("")}
              </div>
            </div>
            <div class="rounded-lg border border-brand-line bg-brand-panel p-5 shadow-[0_18px_42px_rgba(29,41,63,.09)]">
              <div class="flex items-center justify-between gap-3">
                <span class="${ui.tagGold}">CEFR reading path</span>
                <span class="${ui.tag}">A1-C2</span>
              </div>
              <div class="mt-5 grid gap-3 sm:grid-cols-2">
              ${levels
                .map(
                  (level, index) => `
                    <article class="rounded-lg border border-brand-line/75 bg-white/70 p-4">
                      <span class="text-sm font-black text-brand-red">${level}</span>
                      <h3 class="mt-2 text-lg font-black text-brand-charcoal">${["Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced", "Mastery"][index]}</h3>
                      <p class="mt-2 text-sm leading-6 text-brand-graphite">${["Simple vocabulary and clear sentences.", "Common grammar with more context.", "Longer scenes and connected ideas.", "Richer clauses and practical nuance.", "Advanced style and idiomatic phrasing.", "Native-like narration and subtle tone."][index]}</p>
                    </article>
                  `
                )
                .join("")}
              </div>
            </div>
          </div>
        </section>

        <section id="remember" class="bg-brand-mist py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            <div class="grid items-center gap-10 lg:grid-cols-[.8fr_1.2fr]">
              <div>
                ${sectionIntro({
                  eyebrow: "Build your personal knowledge base",
                  title: "Keep the sentences you wish you could say.",
                  body: "The best flashcards are not random. They come from something you read, heard, needed, or wanted to say. LinguaStories helps you collect those sentences and review them before they fade.",
                  align: "left"
                })}
                <div class="mt-7 overflow-hidden rounded-lg border border-brand-line bg-brand-panel">
                  <img class="aspect-[16/10] w-full object-cover" src="/assets/img/sentence-mining-hero.png" alt="Desk with sentence cards, notes, and audio practice tools" loading="lazy" />
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2">
                ${memoryFeatures.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index % 2 ? "blue" : "red" })).join("")}
              </div>
            </div>
          </div>
        </section>

        <section id="practice" class="bg-brand-panel py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            <div class="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
              <div>
                ${sectionIntro({
                  eyebrow: "Practice with real people",
                  title: "Use the language before it feels perfect.",
                  body: "Follow learners, exchange messages, join focused voice or video rooms, and book teacher lessons when you want guidance. Practice stays connected to the sentences and goals you are already working on.",
                  align: "left"
                })}
                <div class="mt-7 grid gap-4 sm:grid-cols-2">
                  ${peopleFeatures.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index % 2 ? "teal" : "red" })).join("")}
                </div>
              </div>
              <div class="relative min-h-[320px] overflow-hidden rounded-lg border border-brand-line bg-brand-snow p-4 shadow-[0_18px_42px_rgba(29,41,63,.08)]">
                <img class="mx-auto h-full max-h-[420px] w-full object-contain" src="/assets/img/community.png" alt="Group of LinguaStories learners practicing together" loading="lazy" />
              </div>
            </div>
          </div>
        </section>

        <section id="motivation" class="bg-brand-snow py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "Stay motivated",
              title: "Small wins should be visible.",
              body: "LinguaStories gives you reasons to come back that are tied to useful practice, not empty streak pressure."
            })}
            <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              ${motivationFeatures.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index === 0 ? "blue" : index === 1 ? "teal" : "red" })).join("")}
            </div>
          </div>
        </section>

        <section id="journey" class="bg-brand-ink py-16 text-white">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-start gap-10 px-4 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              <span class="inline-flex min-h-6 items-center rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">Everything in one platform</span>
              <h2 class="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-4xl">One learning journey instead of six disconnected apps.</h2>
              <p class="mt-3 text-base leading-7 text-white/78">Read something. Save the useful parts. Review them. Try them with people. Track what changed. That is the loop LinguaStories is built around.</p>
              <div class="mt-6 flex flex-wrap gap-2">
                ${["Stories", "Decks", "Reviews", "Community", "Teachers", "Progress"].map((item) => `<span class="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-white/82 ring-1 ring-white/15">${item}</span>`).join("")}
              </div>
            </div>
            <div class="grid gap-3">
              ${journeyStep(1, "Read or listen", "Pick a short story at your level and use reader tools when you need support.", "reading")}
              ${journeyStep(2, "Save useful sentences", "Mine phrases you want to remember and organize them into decks.", "scanText")}
              ${journeyStep(3, "Review before it fades", "Practice flashcards with settings that fit your pace.", "bell")}
              ${journeyStep(4, "Use it with people", "Talk in rooms, message learners, or book a teacher when you want feedback.", "users")}
            </div>
          </div>
        </section>

        <section id="languages" class="bg-brand-panel py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "Languages and levels",
              title: "Choose a language, then build a profile around it.",
              body: "Create learner profiles for different languages, switch the active language, and keep stories, decks, goals, and progress easier to understand."
            })}
            <div class="mt-8 columns-1 gap-10 sm:columns-2 lg:columns-4">
              ${languages.map((language) => `<p class="mb-3 break-inside-avoid rounded-lg border border-brand-line/70 bg-white/55 px-3 py-2 text-base font-bold text-brand-charcoal">${escapeHtml(language.name)}</p>`).join("")}
            </div>
          </div>
        </section>

        <section id="pricing" class="bg-brand-snow py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            <div class="mx-auto max-w-3xl text-center">
              <span class="${ui.tag}">Pricing & Packages</span>
              <h2 class="mt-4 text-3xl font-black text-brand-charcoal sm:text-4xl">Start small. Add more practice when you need it.</h2>
              <p class="mt-3 leading-7 text-brand-graphite">Begin with the core learner tools, then unlock live rooms, teacher workspace features, and larger coin allowances as your routine grows.</p>
            </div>
            <div class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              ${tiers.map((tier) => `<div>${pricingCard(tier)}<a class="${ui.secondary} mt-3 w-full" href="/signup" data-link>${icon("arrowRight")}<span>Get Started</span></a></div>`).join("")}
            </div>
          </div>
        </section>

        <section class="bg-brand-panel py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "Social proof",
              title: "We are still collecting public learner stories.",
              body: "For now, the product speaks through what is already built: a fuller learning loop for people who want reading, memory, speaking, and motivation in the same place."
            })}
            <div class="mt-8 grid gap-4 md:grid-cols-3">
              ${[
                ["For readers", "A calmer way to move from simple stories to richer language without guessing what to read next."],
                ["For self-study learners", "A place to keep your own sentences, review them, and see whether your practice is adding up."],
                ["For social learners", "Community, exchange, live rooms, and teachers when solo practice is not enough."]
              ].map(([title, body]) => `<article class="${ui.card}"><h3 class="text-lg font-black text-brand-ink">${escapeHtml(title)}</h3><p class="mt-2 text-sm leading-6 text-brand-graphite">${escapeHtml(body)}</p></article>`).join("")}
            </div>
          </div>
        </section>

        <section id="faqs" class="bg-brand-snow py-16">
          <div class="mx-auto w-[min(900px,calc(100%_-_32px))] px-4">
            <span class="${ui.tag}">Frequently Asked Questions</span>
            <h2 class="mt-4 text-3xl font-black text-brand-charcoal sm:text-4xl">A few things people usually ask first.</h2>
            <div class="mt-8 grid gap-3">
              ${["Is LinguaStories only for reading?|No. Reading is the starting point, but the platform also includes sentence mining, decks, reviews, goals, community, direct messages, live rooms, teacher lessons, profiles, coins, and progress tracking.", "Do I need to know my exact level?|No. Start with the level that feels readable. You can adjust as you go and build separate profiles for different languages.", "Can I practice speaking here?|Yes. You can use community exchange, direct messages, focused voice/video rooms, and paid teacher lessons.", "What makes this different from a flashcard app?|Your cards come from real stories, notes, conversations, and goals. The review system is connected to the rest of your practice."]
                .map((item) => {
                  const [question, answer] = item.split("|");
                  return `<article class="${ui.card}"><h3 class="font-black text-brand-charcoal">${question}</h3><p class="mt-2 text-sm leading-6 text-brand-graphite">${answer}</p></article>`;
                })
                .join("")}
            </div>
          </div>
        </section>

        <section class="bg-brand-ink py-16 text-white">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h2 class="text-3xl font-black leading-tight tracking-tight sm:text-4xl">Build a language routine that does not fall apart after week two.</h2>
              <p class="mt-3 max-w-2xl text-base leading-7 text-white/78">Start with one story, save one sentence, review it tomorrow, then use it with someone. That is enough to begin.</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-brand-ink no-underline shadow-[0_14px_28px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-brand-snow" href="/signup" data-link>${icon("arrowRight")}<span>Create account</span></a>
              <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white no-underline transition hover:-translate-y-0.5 hover:bg-white/16" href="/login" data-link>${icon("login")}<span>Log in</span></a>
            </div>
          </div>
        </section>
      </main>
    </section>
  `;
}

function authPage(mode, { appConfig }) {
  const isLogin = mode === "login";
  const tiers = accountTiers(appConfig);
  return `
    <section class="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfd_62%,#f4f4f9_100%)]">
      ${publicNav(mode, { hideActions: true })}
      <main class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 py-12 ${isLogin ? "lg:grid-cols-[1fr_430px]" : "lg:grid-cols-[.8fr_1.2fr]"} lg:py-20">
        <section>
          <span class="${isLogin ? ui.tagGold : ui.tagRed}">${isLogin ? "Welcome back" : "Start free"}</span>
          <h1 class="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">${isLogin ? "Pick up right where your stories left off." : "Create your story-learning loop in a few seconds."}</h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-brand-charcoal sm:text-lg sm:leading-8">${isLogin ? "Review what is due, unlock your next story, and keep the practice rhythm going." : "Choose your first learning language, collect a welcome coin bonus, and begin with level-matched stories."}</p>
        </section>
        <section class="${ui.card} p-6 shadow-2xl">
          <h2 class="text-2xl font-black">${isLogin ? "Log in" : "Create account"}</h2>
          <form class="mt-5 grid gap-4" data-form="${isLogin ? "login" : "register"}">
            ${isLogin ? "" : `<label class="${ui.label}">Name<input class="${ui.input}" name="displayName" required placeholder="Mika Tan"></label>`}
            <label class="${ui.label}">Email<input class="${ui.input}" name="email" type="email" required placeholder="you@example.com"></label>
            <label class="${ui.label}">Password<input class="${ui.input}" name="password" type="password" required ${isLogin ? "" : `minlength="8"`} placeholder="${isLogin ? "Your password" : "At least 8 characters"}"></label>
            ${
              isLogin
                ? ""
                : `<div class="grid gap-4 sm:grid-cols-2"><label class="${ui.label}">Native Language<select class="${ui.input}" name="nativeLanguage" required>${languageOptions(appConfig.supportedLanguages, "")}</select></label><label class="${ui.label}">First Learning Language<select class="${ui.input}" name="targetLanguage" required>${languageOptions(appConfig.supportedLanguages, "")}</select></label></div>
                  <fieldset class="grid gap-3">
                    <legend class="text-sm font-black text-brand-ink">Choose account tier</legend>
                    <div class="grid max-h-[520px] gap-3 overflow-y-auto pr-1 sm:grid-cols-2">
                      ${tiers.map((tier, index) => `<label class="block cursor-pointer">${pricingCard(tier, { selectable: true, selected: index === 0 })}</label>`).join("")}
                    </div>
                  </fieldset>`
            }
            <button class="${ui.primary} w-full">${icon(isLogin ? "login" : "add")}<span>${isLogin ? "Log in" : "Create account"}</span></button>
          </form>
          <p class="mt-4 flex flex-wrap items-center gap-x-1 text-sm text-brand-graphite">${isLogin ? `New here? <a class="inline-flex min-h-11 min-w-11 items-center font-black text-brand-red" href="/signup" data-link>Create an account</a>` : `Already have an account? <a class="inline-flex min-h-11 min-w-11 items-center font-black text-brand-red" href="/login" data-link>Log in</a>`}</p>
        </section>
      </main>
    </section>
  `;
}

export function loginView(ctx) {
  return authPage("login", ctx);
}

export function signupView(ctx) {
  return authPage("signup", ctx);
}
