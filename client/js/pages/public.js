import { escapeHtml, icon, ui } from "../ui.js";
import { languageSelectOptions } from "../languages.js";

function languageOptions(languages, selected) {
  return languageSelectOptions({ supportedLanguages: languages }, selected, { placeholder: "Choose a language" });
}

export function publicNav(active = "", options = {}) {
  const inactiveTopButton =
    "inline-flex min-h-11 items-center justify-center rounded-lg border border-brand-line bg-white px-4 py-2 text-sm font-black text-brand-charcoal no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-brand-orange/60 hover:bg-brand-snow";
  const activeTopButton =
    "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand-red px-4 py-2 text-sm font-black text-white no-underline shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-redDark";
  const learningLinks = options.learningOnly
    ? [["#how-it-works", "How it works"], ["#learning-path", "Learning path"], ["#practice", "Practice"]]
    : [["#teachers", "Teachers"], ["#teacher-first", "Teacher-first"], ["#how-it-works", "How it works"], ["#community", "Community"], ["#pricing", "Pricing"]];
  return `
    <nav class="mx-auto flex w-[min(1180px,calc(100%_-_32px))] items-center justify-between gap-4 px-0 py-4 sm:px-4 sm:py-5">
      <a class="flex items-center gap-3 text-brand-ink no-underline" href="/" data-link>
        <img class="h-12 w-12 object-contain" src="/assets/img/linguastories.png" alt="" />
        <span><strong class="block text-base font-black leading-tight">LinguaStories</strong><small class="block text-xs font-semibold text-brand-graphite">Fluency through real practice</small></span>
      </a>
      ${
        options.hideActions
          ? ""
            : `<div class="hidden items-center gap-7 text-sm font-bold text-brand-graphite lg:flex">
              ${learningLinks.map(([href, label]) => `<a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="${href}">${label}</a>`).join("")}
            </div>
            <div class="hidden items-center gap-2 lg:flex">
              <a class="${active === "login" ? activeTopButton : inactiveTopButton}" href="/login" data-link>Login</a>
              ${options.learningOnly ? `<a class="${activeTopButton}" href="/signup" data-link>Start learning</a>` : ""}
            </div>
            <details class="relative lg:hidden" data-public-menu>
              <summary class="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-lg border border-brand-line bg-white text-brand-ink shadow-sm [&::-webkit-details-marker]:hidden" aria-label="Open navigation">
                ${icon("menu", "h-5 w-5")}
              </summary>
              <div class="fixed inset-0 z-40 bg-brand-ink/45 backdrop-blur-sm" data-public-menu-backdrop></div>
              <div class="fixed inset-y-0 right-0 z-50 grid w-[min(286px,calc(100vw-24px))] content-start gap-1 overflow-y-auto border-l border-brand-line bg-brand-panel p-4 pt-[max(1rem,var(--safe-top))] shadow-2xl">
                <div class="mb-2 flex items-center justify-between gap-3">
                  <span class="text-xs font-black uppercase tracking-[.16em] text-brand-graphite">Menu</span>
                  <button class="grid h-11 w-11 place-items-center rounded-lg border border-brand-line bg-white text-brand-ink" type="button" data-action="closePublicMenu" aria-label="Close navigation">x</button>
                </div>
                ${learningLinks.map(([href, label]) => `<a class="flex min-h-11 items-center rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="${href}" data-public-menu-link>${label}</a>`).join("")}
                <a class="${active === "login" ? activeTopButton : inactiveTopButton} mt-3 w-full" href="/login" data-link data-public-menu-link>Login</a>
                ${options.learningOnly ? `<a class="${activeTopButton} mt-2 w-full" href="/signup" data-link data-public-menu-link>Start learning</a>` : ""}
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

const fallbackTiers = [
  ["free", "Free Membership", 0, 0, false, 0, "learner", ["voice_video_rooms", "connect", "community_posts", "find_teacher", "practice"]],
  ["teacher", "Teacher", 0, 0, false, 0, "teacher", ["teacher_workspace", "teacher_profile", "voice_video_rooms"]]
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
  if (Number(tier.monthlyPriceUsd || 0) === 0) return "Free membership. Pay only when booking lessons.";
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

export function searchLandingView() {
  return `
    <section class="lingua-search-home min-h-screen bg-brand-snow text-brand-ink">
      <header class="lingua-search-home__topbar">
        <a class="lingua-search-home__login" href="/login" data-link>Login</a>
      </header>
      <main class="lingua-search-home__main" aria-label="LinguaStories search">
        <img class="lingua-search-home__logo" src="/assets/img/linguastories.png" alt="LinguaStories" fetchpriority="high" />
        <form class="lingua-search-home__form" action="/" role="search">
          <label class="sr-only" for="landingSearch">Search LinguaStories</label>
          <div class="lingua-search-home__searchbox">
            ${icon("search", "h-5 w-5 shrink-0 text-brand-muted")}
            <input id="landingSearch" name="q" type="search" autocomplete="off" spellcheck="false" placeholder="Search for stories, sentences, vocabulary, etc..." aria-label="Search LinguaStories" />
          </div>
          <div class="lingua-search-home__actions" aria-label="Primary actions">
            <a href="/find-teacher" data-link>Find a Teacher</a>
            <a href="/app/community">Lingua World Community</a>
          </div>
        </form>
      </main>
    </section>
  `;
}

export function landingView() {
  const steps = [
    ["Choose your course", "Pick the language you want to learn and download the course for reliable access.", "book"],
    ["Complete quick lessons", "Build useful vocabulary through reading, listening, matching, and sentence practice.", "play"],
    ["Review at the right time", "Smart review brings back words and sentences before they fade.", "clock"]
  ];
  const practiceFeatures = [
    ["Bite-sized lessons", "Make progress in a few focused minutes with one clear task at a time.", "play", "red"],
    ["A guided path", "Lessons unlock in order so you always know what to learn next.", "check", "teal"],
    ["Stories with context", "Meet new words inside practical dialogues and memorable short stories.", "book-open", "blue"],
    ["Personal review", "Practice adapts to completed lessons, recent mistakes, and items due today.", "clock", "red"],
    ["Visible progress", "Track lesson completion, study time, streaks, and areas that need attention.", "star", "teal"],
    ["Learn offline", "Download your course once and keep lessons available when your connection is not.", "download", "blue"]
  ];
  return `
    <section class="min-h-screen bg-brand-snow text-brand-ink">
      ${publicNav("", { learningOnly: true })}
      <main>
        <section class="relative overflow-hidden border-y border-brand-line bg-[radial-gradient(circle_at_78%_28%,rgba(224,114,88,.17),transparent_32%),linear-gradient(180deg,#fffaf4_0%,#f8f6f2_100%)]">
          <div class="mx-auto grid min-h-[72vh] w-[min(1180px,calc(100%_-_32px))] items-center gap-12 px-4 py-14 lg:grid-cols-[.9fr_1.1fr] lg:py-20">
            <div class="max-w-xl">
              <span class="inline-flex items-center gap-2 rounded-full bg-brand-teal/10 px-3 py-1.5 text-xs font-black text-brand-teal ring-1 ring-brand-teal/20">${icon("star", "h-4 w-4")} A clear path to everyday language</span>
              <h1 class="mt-5 text-4xl font-black leading-[1.05] tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">Learn a little every day. Remember it for longer.</h1>
              <p class="mt-5 max-w-lg text-base leading-7 text-brand-charcoal sm:text-lg sm:leading-8">Build real language skills with short interactive lessons, practical stories, and review that follows your progress.</p>
              <div class="mt-8 flex flex-col gap-3 sm:flex-row">
                <a class="${ui.primary} min-w-44" href="/signup" data-link>${icon("play", "h-4 w-4")}<span>Start learning free</span></a>
                <a class="${ui.secondary} min-w-36" href="/login" data-link><span>I have an account</span></a>
              </div>
              <p class="mt-4 flex items-center gap-2 text-xs font-bold text-brand-graphite">${icon("check", "h-4 w-4 text-brand-teal")} Download once, then learn online or offline.</p>
            </div>

            <div class="relative mx-auto w-full max-w-[560px]">
              <div class="absolute -left-4 top-16 hidden rounded-lg border border-brand-line bg-white px-4 py-3 shadow-lg sm:block">
                <span class="block text-[11px] font-black uppercase text-brand-graphite">Current streak</span>
                <strong class="mt-1 flex items-center gap-2 text-xl font-black text-brand-redDark">${icon("star", "h-5 w-5")} 7 days</strong>
              </div>
              <div class="overflow-hidden rounded-[1.5rem] border border-brand-line bg-brand-panel p-4 shadow-[0_28px_70px_rgba(29,41,63,.16)] sm:p-6">
                <div class="flex items-center gap-3 border-b border-brand-line pb-4">
                  <span class="grid h-10 w-10 place-items-center rounded-full bg-brand-red/10 text-brand-redDark">${icon("book-open", "h-5 w-5")}</span>
                  <div class="min-w-0 flex-1"><span class="text-xs font-bold text-brand-graphite">Travel · Lesson 1</span><div class="mt-1 h-2 overflow-hidden rounded-full bg-brand-mist"><span class="block h-full w-[68%] rounded-full bg-brand-red"></span></div></div>
                  <strong class="text-xs font-black text-brand-charcoal">4 of 6</strong>
                </div>
                <div class="px-1 py-8 text-center sm:px-8">
                  <span class="text-xs font-black uppercase text-brand-redDark">Choose the meaning</span>
                  <h2 class="mt-3 text-2xl font-black tracking-normal text-brand-ink">車站</h2>
                  <p class="mt-1 text-sm font-bold text-brand-graphite">chē zhàn</p>
                  <div class="mt-7 grid gap-3 text-left">
                    <button class="flex min-h-14 items-center gap-3 rounded-lg border-2 border-brand-red bg-brand-red/10 px-4 font-black text-brand-ink" type="button"><kbd class="grid h-7 w-7 place-items-center rounded-md border border-brand-red/30 bg-white text-xs">1</kbd><span>train station</span>${icon("check", "ml-auto h-5 w-5 text-brand-teal")}</button>
                    <button class="flex min-h-14 items-center gap-3 rounded-lg border border-brand-line bg-white px-4 font-bold text-brand-charcoal" type="button"><kbd class="grid h-7 w-7 place-items-center rounded-md border border-brand-line bg-brand-snow text-xs">2</kbd><span>airport</span></button>
                    <button class="flex min-h-14 items-center gap-3 rounded-lg border border-brand-line bg-white px-4 font-bold text-brand-charcoal" type="button"><kbd class="grid h-7 w-7 place-items-center rounded-md border border-brand-line bg-brand-snow text-xs">3</kbd><span>hotel</span></button>
                  </div>
                </div>
                <div class="flex items-center justify-between gap-4 rounded-lg bg-brand-teal/10 p-4 text-brand-teal ring-1 ring-brand-teal/15"><div><strong class="block font-black">Correct!</strong><span class="text-xs font-semibold">Nice work—keep going.</span></div><span class="rounded-lg bg-brand-teal px-5 py-3 text-sm font-black text-white">Continue</span></div>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" class="bg-brand-panel py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "How it works",
              title: "Your next step is always clear.",
              body: "Start with the essentials, finish focused lessons, and revisit what needs more practice."
            })}
            <div class="mt-8 grid gap-4 md:grid-cols-3">
              ${steps.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index === 1 ? "teal" : "red" })).join("")}
            </div>
          </div>
        </section>

        <section id="learning-path" class="overflow-hidden bg-brand-mist py-16 sm:py-20">
          <div class="mx-auto grid w-[min(1080px,calc(100%_-_32px))] items-center gap-12 px-4 lg:grid-cols-[.8fr_1.2fr]">
            <div>
              ${sectionIntro({ eyebrow: "Learning path", title: "Progress one lesson at a time.", body: "Each course is arranged into practical categories. Complete a lesson to open the next step and build toward confident comprehension.", align: "left" })}
              <ul class="mt-7 grid gap-3 text-sm font-bold text-brand-charcoal">
                ${["Clear prerequisites and sequential unlocking", "Vocabulary, dialogue, sentence, and story practice", "Progress saved automatically on your device"].map((item) => `<li class="flex items-center gap-3">${icon("check", "h-5 w-5 text-brand-teal")}<span>${item}</span></li>`).join("")}
              </ul>
            </div>
            <div class="relative mx-auto grid w-full max-w-xl justify-items-center gap-4 py-4">
              ${[
                ["1", "Introductions", "Complete", "bg-brand-teal text-white", "border-brand-teal/25 bg-white"],
                ["2", "Getting around", "4 lessons", "bg-brand-red text-white", "border-brand-red/30 bg-brand-red/10"],
                ["3", "Food and drink", "Locked", "bg-brand-mist text-brand-graphite", "border-brand-line bg-white/65"]
              ].map(([number, title, status, numberClass, cardClass], index) => `<div class="relative flex w-[min(100%,440px)] items-center gap-4 rounded-xl border ${cardClass} p-4 shadow-sm ${index === 1 ? "sm:translate-x-12" : index === 2 ? "sm:-translate-x-5" : ""}"><span class="grid h-12 w-12 shrink-0 place-items-center rounded-full text-lg font-black ${numberClass}">${number}</span><span class="min-w-0 flex-1"><strong class="block text-base font-black text-brand-ink">${title}</strong><small class="font-bold text-brand-graphite">${status}</small></span>${icon(index === 2 ? "lock-keyhole" : "check", `h-5 w-5 ${index === 2 ? "text-brand-muted" : "text-brand-teal"}`)}</div>${index < 2 ? `<span class="h-7 w-0.5 bg-brand-line"></span>` : ""}`).join("")}
            </div>
          </div>
        </section>

        <section id="practice" class="bg-brand-snow py-16 sm:py-20">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({ eyebrow: "Built for practice", title: "Everything supports consistent learning.", body: "A focused experience for learning, remembering, and seeing steady progress." })}
            <div class="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              ${practiceFeatures.map(([title, body, iconName, tone]) => featureCard({ title, body, iconName, tone })).join("")}
            </div>
          </div>
        </section>

        <section class="bg-brand-ink py-16 text-white">
          <div class="mx-auto max-w-3xl px-6 text-center">
            <span class="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80 ring-1 ring-white/15">Start your first lesson today</span>
            <h2 class="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-4xl">Turn a few minutes into real progress.</h2>
            <p class="mx-auto mt-3 max-w-2xl text-base leading-7 text-white/75">Choose your language, download the course, and begin with the first guided lesson.</p>
            <a class="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-brand-ink no-underline shadow-[0_14px_28px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-brand-snow" href="/signup" data-link>${icon("play", "h-4 w-4")}<span>Start learning free</span></a>
          </div>
        </section>
      </main>
    </section>
  `;
}

function authPage(mode, { appConfig }) {
  const isLogin = mode === "login";
  const tiers = accountTiers(appConfig);
  const authHighlights = isLogin
    ? [
        ["Your lessons", "Return to booked lessons and teacher conversations."],
        ["Your community", "Keep up with learners and teachers between sessions."],
        ["Your teacher profile", "Manage teaching details from the same account."]
      ]
    : [
        ["Find teachers", "Browse professional teachers and book when you are ready."],
        ["Join community", "Meet learners, ask questions, and practice between lessons."],
        ["Teach online", "Create a teacher profile after signup and set your own lesson price."]
      ];
  return `
    <section class="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfd_62%,#f4f4f9_100%)]">
      <div class="hidden lg:block">${publicNav(mode, { hideActions: true })}</div>
      <main class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-6 px-4 py-8 ${isLogin ? "lg:grid-cols-[1fr_430px]" : "lg:grid-cols-[.8fr_1.2fr]"} sm:py-12 lg:gap-10 lg:py-20">
        <section class="order-1">
          <span class="${isLogin ? ui.tagGold : ui.tagRed} hidden lg:inline-flex">${isLogin ? "Welcome back" : "Join free"}</span>
          <h1 class="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">${isLogin ? "Continue learning with your teachers and community." : "Create your free LinguaStories account."}</h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-brand-charcoal sm:text-lg sm:leading-8">${isLogin ? "Log in to manage lessons, connect with learners, and keep practicing between sessions." : "Find professional teachers, join the community, and book live lessons when you are ready."}</p>
          <div class="mt-7 hidden max-w-2xl gap-3 lg:grid lg:grid-cols-3">
            ${authHighlights.map(([title, body]) => `<article class="rounded-lg border border-brand-line/80 bg-brand-panel/75 p-4 shadow-[0_1px_2px_rgba(29,41,63,.04)]"><h2 class="text-sm font-black text-brand-ink">${escapeHtml(title)}</h2><p class="mt-2 text-xs leading-5 text-brand-graphite">${escapeHtml(body)}</p></article>`).join("")}
          </div>
        </section>
        <section class="${ui.card} order-2 p-6 shadow-2xl">
          <h2 class="text-2xl font-black">${isLogin ? "Log in" : "Create free account"}</h2>
          <form class="mt-5 grid gap-4" data-form="${isLogin ? "login" : "register"}">
            ${isLogin ? "" : `<label class="${ui.label}">Name<input class="${ui.input}" name="displayName" required placeholder="Mika Tan"></label>`}
            <label class="${ui.label}">Email<input class="${ui.input}" name="email" type="email" required placeholder="you@example.com"></label>
            <label class="${ui.label}">Password<input class="${ui.input}" name="password" type="password" required ${isLogin ? "" : `minlength="8"`} placeholder="${isLogin ? "Your password" : "At least 8 characters"}"></label>
            ${
              isLogin
                ? ""
                : `<div class="grid gap-4 sm:grid-cols-2"><label class="${ui.label}">Native Language<select class="${ui.input}" name="nativeLanguage" required>${languageOptions(appConfig.supportedLanguages, "")}</select></label><label class="${ui.label}">Learning Language<select class="${ui.input}" name="targetLanguage" required>${languageOptions(appConfig.supportedLanguages, "")}</select></label></div>
                  <input type="hidden" name="tierKey" value="${escapeHtml(tiers.find((tier) => tier.key === "free")?.key || "free")}" />
                  <p class="rounded-lg bg-brand-red/10 px-3 py-2 text-xs font-bold leading-5 text-brand-redDark ring-1 ring-brand-red/15">Membership is free. Students pay only when booking a lesson.</p>`
            }
            <button class="${ui.primary} w-full">${icon(isLogin ? "login" : "add")}<span>${isLogin ? "Log in" : "Create free account"}</span></button>
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
