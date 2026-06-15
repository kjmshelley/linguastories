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
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#teachers">Teachers</a>
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#how-it-works">How it works</a>
              <a class="inline-flex min-h-11 min-w-11 items-center transition hover:text-brand-red" href="#community">Community</a>
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
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#teachers">Teachers</a>
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#how-it-works">How it works</a>
                <a class="rounded-lg px-3 py-3 text-sm font-bold text-brand-charcoal no-underline hover:bg-brand-mist" href="#community">Community</a>
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

export function landingView({ appConfig }) {
  const steps = [
    ["Find a verified teacher", "Browse professional teachers by language, availability, and lesson price.", "search"],
    ["Book a live lesson", "Choose a time, pay securely, and join your online classroom.", "calendar"],
    ["Practice with the community", "Connect with learners and teachers between lessons.", "users"]
  ];
  const communityBullets = ["Meet learners and teachers", "Share community posts", "Find conversation partners", "Stay connected between lessons"];
  return `
    <section class="min-h-screen bg-brand-snow">
      ${publicNav()}
      <main>
        <section class="relative overflow-hidden bg-brand-ink text-white">
          <div class="absolute inset-0">
            <img class="h-full w-full object-cover object-center" src="/assets/img/landing-live-lesson.png" alt="" fetchpriority="high" />
            <div class="absolute inset-0 bg-brand-ink/60"></div>
            <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(29,41,63,.96)_0%,rgba(29,41,63,.82)_46%,rgba(29,41,63,.34)_100%)]"></div>
          </div>
          <div class="relative mx-auto grid min-h-[calc(100dvh-170px)] w-[min(1180px,calc(100%_-_32px))] content-center px-4 py-12 sm:min-h-[calc(100dvh-120px)] sm:py-16 lg:min-h-[76vh]">
            <div class="max-w-3xl">
              <span class="inline-flex min-h-6 items-center rounded-full bg-white/12 px-3 py-1 text-xs font-bold text-white ring-1 ring-white/20">Free membership for students and teachers</span>
              <h1 class="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">Learn languages with professional teachers and a supportive community.</h1>
              <p class="mt-5 max-w-2xl text-base leading-7 text-white/84 sm:text-lg sm:leading-8">Book live online lessons, meet other learners, and keep practicing between sessions.</p>
              <div class="mt-7 flex flex-col gap-3 sm:flex-row">
                <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-brand-ink no-underline shadow-[0_14px_28px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-brand-snow" href="/signup" data-link>${icon("search")}<span>Find a Teacher</span></a>
                <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white no-underline backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/16" href="/signup" data-link>${icon("add")}<span>Join Free</span></a>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" class="bg-brand-panel py-14">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "How it works",
              title: "Start learning in three simple steps.",
              body: "Find the right teacher, book a live lesson, then keep practicing with the community between sessions."
            })}
            <div class="mt-8 grid gap-4 md:grid-cols-3">
              ${steps.map(([title, body, iconName], index) => featureCard({ title, body, iconName, tone: index === 1 ? "teal" : "red" })).join("")}
            </div>
          </div>
        </section>

        <section id="teachers" class="bg-brand-mist py-16">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] gap-10 px-4 lg:grid-cols-[.85fr_1.15fr]">
            <div>
              ${sectionIntro({
                eyebrow: "For teachers",
                title: "Teach your language. Keep your lesson price.",
                body: "Create a free teacher profile, set your availability, choose your rate, and meet students online. LinguaStories does not take a commission from your lesson price.",
                align: "left"
              })}
              <a class="${ui.primary} mt-7" href="/signup" data-link>${icon("user")}<span>Become a Teacher</span></a>
            </div>
            <div class="overflow-hidden rounded-lg border border-brand-line bg-brand-panel shadow-[0_18px_42px_rgba(29,41,63,.09)]">
              <img class="aspect-[16/10] w-full object-cover" src="/assets/img/landing-booking.png" alt="Teacher profile and booking calendar for a live language lesson" loading="lazy" />
            </div>
          </div>
        </section>

        <section id="community" class="bg-brand-panel py-16">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 lg:grid-cols-[1.05fr_.95fr]">
            <div class="overflow-hidden rounded-lg border border-brand-line bg-brand-snow shadow-[0_18px_42px_rgba(29,41,63,.08)]">
              <img class="aspect-[16/10] w-full object-cover" src="/assets/img/landing-community.png" alt="Language learners practicing together in a supportive community" loading="lazy" />
            </div>
            <div>
              ${sectionIntro({
                eyebrow: "Community",
                title: "Practice does not stop after class.",
                body: "Join a language-learning community where students and teachers can connect, share progress, ask questions, and practice together.",
                align: "left"
              })}
              <ul class="mt-7 grid gap-3">
                ${communityBullets.map((item) => `<li class="flex gap-3 rounded-lg border border-brand-line/80 bg-white/70 p-3 text-sm font-bold text-brand-charcoal">${icon("check", "mt-0.5 h-4 w-4 text-brand-redDark")}<span>${escapeHtml(item)}</span></li>`).join("")}
              </ul>
              <a class="${ui.secondary} mt-7" href="/signup" data-link>${icon("users")}<span>Join the Community</span></a>
            </div>
          </div>
        </section>

        <section id="pricing" class="bg-brand-snow py-16">
          <div class="mx-auto w-[min(980px,calc(100%_-_32px))] px-4">
            ${sectionIntro({
              eyebrow: "Pricing",
              title: "Simple, transparent pricing.",
              body: "Membership is free. Students pay for lessons when they book, and teachers keep their listed lesson price."
            })}
            <div class="mt-8 grid gap-4 md:grid-cols-2">
              <article class="rounded-lg border border-brand-line bg-brand-panel p-6 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
                <h3 class="text-xl font-black text-brand-ink">Free Membership</h3>
                <p class="mt-3 text-4xl font-black text-brand-ink">$0</p>
                <ul class="mt-5 grid gap-3 text-sm font-semibold text-brand-graphite">
                  ${["Create an account", "Browse teachers", "Join the community", "Book lessons anytime"].map((item) => `<li class="flex gap-2">${icon("check", "mt-0.5 h-4 w-4 text-brand-redDark")}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
              <article class="rounded-lg border border-brand-red/25 bg-brand-red/10 p-6 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
                <h3 class="text-xl font-black text-brand-ink">Paid Lessons</h3>
                <p class="mt-3 text-3xl font-black text-brand-ink">Teacher price + small system fee</p>
                <ul class="mt-5 grid gap-3 text-sm font-semibold text-brand-charcoal">
                  ${["Verified professional teachers", "Teachers set their own prices", "Teachers keep 100%", "Students pay a small booking fee", "No monthly subscription required"].map((item) => `<li class="flex gap-2">${icon("check", "mt-0.5 h-4 w-4 text-brand-redDark")}<span>${escapeHtml(item)}</span></li>`).join("")}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section class="bg-brand-ink py-16 text-white">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-6 px-4 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <h2 class="text-3xl font-black leading-tight tracking-tight sm:text-4xl">Ready to learn with real people?</h2>
              <p class="mt-3 max-w-2xl text-base leading-7 text-white/78">Join LinguaStories for free and start connecting with teachers and learners today.</p>
            </div>
            <div class="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-black text-brand-ink no-underline shadow-[0_14px_28px_rgba(0,0,0,.22)] transition hover:-translate-y-0.5 hover:bg-brand-snow" href="/signup" data-link>${icon("search")}<span>Find a Teacher</span></a>
              <a class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-black text-white no-underline transition hover:-translate-y-0.5 hover:bg-white/16" href="/signup" data-link>${icon("user")}<span>Become a Teacher</span></a>
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
      ${publicNav(mode, { hideActions: true })}
      <main class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 py-12 ${isLogin ? "lg:grid-cols-[1fr_430px]" : "lg:grid-cols-[.8fr_1.2fr]"} lg:py-20">
        <section>
          <span class="${isLogin ? ui.tagGold : ui.tagRed}">${isLogin ? "Welcome back" : "Join free"}</span>
          <h1 class="mt-5 max-w-3xl text-3xl font-black leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">${isLogin ? "Continue learning with your teachers and community." : "Create your free LinguaStories account."}</h1>
          <p class="mt-5 max-w-xl text-base leading-7 text-brand-charcoal sm:text-lg sm:leading-8">${isLogin ? "Log in to manage lessons, connect with learners, and keep practicing between sessions." : "Find professional teachers, join the community, and book live lessons when you are ready."}</p>
          <div class="mt-7 grid max-w-2xl gap-3 sm:grid-cols-3">
            ${authHighlights.map(([title, body]) => `<article class="rounded-lg border border-brand-line/80 bg-brand-panel/75 p-4 shadow-[0_1px_2px_rgba(29,41,63,.04)]"><h2 class="text-sm font-black text-brand-ink">${escapeHtml(title)}</h2><p class="mt-2 text-xs leading-5 text-brand-graphite">${escapeHtml(body)}</p></article>`).join("")}
          </div>
        </section>
        <section class="${ui.card} p-6 shadow-2xl">
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
