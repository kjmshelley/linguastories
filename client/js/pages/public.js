import { escapeHtml, icon, progressBar, ui } from "../ui.js";

function languageOptions(languages, selected) {
  return [
    `<option value="" disabled ${selected ? "" : "selected"}>Choose a language</option>`,
    ...languages.map((language) => `<option ${language === selected ? "selected" : ""}>${escapeHtml(language)}</option>`)
  ].join("");
}

export function publicNav(active = "", options = {}) {
  const inactiveTopButton =
    "inline-flex min-h-10 items-center justify-center rounded-lg border border-brand-line bg-white px-4 py-2 text-sm font-black text-brand-charcoal no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-brand-orange/60 hover:bg-brand-snow";
  const activeTopButton =
    "inline-flex min-h-10 items-center justify-center rounded-lg bg-brand-red px-4 py-2 text-sm font-black text-white no-underline shadow-sm transition hover:-translate-y-0.5 hover:bg-brand-redDark";
  return `
    <nav class="mx-auto flex w-[min(1180px,calc(100%_-_32px))] items-center justify-between gap-4 px-4 py-5">
      <a class="flex items-center gap-3 text-brand-ink no-underline" href="/" data-link>
        <img class="h-12 w-12 object-contain" src="/assets/img/linguastories.png" alt="" />
        <span><strong class="block text-base font-black leading-tight">LinguaStories</strong><small class="block text-xs font-semibold text-brand-graphite">Fluency through sentences</small></span>
      </a>
      ${
        options.hideActions
          ? ""
          : `<div class="hidden items-center gap-7 text-sm font-bold text-brand-graphite lg:flex">
              <a class="transition hover:text-brand-red" href="#about">About</a>
              <a class="transition hover:text-brand-red" href="#languages">Languages</a>
              <a class="transition hover:text-brand-red" href="#levels">Levels</a>
              <a class="transition hover:text-brand-red" href="#pricing">Pricing</a>
              <a class="transition hover:text-brand-red" href="#faqs">FAQs</a>
            </div>
            <div class="flex items-center gap-2">
              <a class="${active === "login" ? activeTopButton : inactiveTopButton}" href="/login" data-link>Login</a>
            </div>`
      }
    </nav>
  `;
}

export function landingView({ appConfig }) {
  const languages = appConfig.supportedLanguages.length
    ? appConfig.supportedLanguages
    : ["Arabic", "Dutch", "English", "French", "German", "Greek", "Hindi", "Indonesian", "Italian", "Japanese", "Korean", "Mandarin Chinese", "Polish", "Portuguese", "Russian", "Spanish", "Swedish", "Thai", "Turkish", "Vietnamese"];
  const levels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  return `
    <section class="min-h-screen bg-white">
      ${publicNav()}
      <main>
        <section class="bg-brand-cream">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 py-14 lg:grid-cols-[1.05fr_.95fr] lg:py-20">
            <div>
              <h1 class="max-w-4xl text-4xl font-black leading-[1.08] tracking-tight text-brand-charcoal sm:text-6xl">Learn a new language through captivating stories at your exact level</h1>
              <p class="mt-5 max-w-2xl text-lg leading-8 text-brand-graphite">Read the same story at A1, A2, B1, B2, C1, or C2. Vocabulary, grammar, sentence length, and style adapt as your language skills grow.</p>
              <div class="mt-7 grid max-w-xl gap-3">
                <input class="${ui.input} bg-white" type="email" placeholder="Your email address" aria-label="Your email address" />
                <a class="${ui.primary} w-fit" href="/signup" data-link>${icon("arrowRight")}<span>Get Started Now</span></a>
              </div>
              <div class="mt-4 flex flex-wrap items-center gap-3 text-sm font-bold text-brand-graphite">
                <span>14 days free trial</span>
                <span class="text-brand-line">|</span>
                <span>No credit card required</span>
              </div>
            </div>
            <div class="relative min-h-[280px] sm:min-h-[420px]">
              <img class="absolute inset-0 m-auto h-full w-full object-contain" src="/assets/img/linguastories.png" alt="" />
            </div>
          </div>
        </section>

        <section id="about" class="bg-brand-cream py-14">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4 text-center">
            <h2 class="text-4xl font-black tracking-tight text-brand-charcoal">Stories in over 20 languages</h2>
            <p class="mx-auto mt-3 max-w-2xl leading-7 text-brand-graphite">Read and listen to stories in a structured environment built around language level, region, and steady comprehension growth.</p>
            <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              ${["20 languages|Explore a broad story library across major world languages.", "6 CEFR levels|Every story can meet you from A1 through C2.", "Story reuse|Read familiar plots with richer grammar as you improve.", "Sentence practice|Save useful lines and review them later."]
                .map((item) => {
                  const [title, body] = item.split("|");
                  return `<article class="${ui.card} text-left"><strong class="block text-2xl font-black text-brand-charcoal">${title}</strong><span class="mt-2 block text-sm leading-6 text-brand-graphite">${body}</span></article>`;
                })
                .join("")}
            </div>
          </div>
        </section>

        <section id="levels" class="bg-brand-mist py-16">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 lg:grid-cols-[.9fr_1.1fr]">
            <div>
              <span class="${ui.tagRed}">Adaptable and simple</span>
              <h2 class="mt-4 text-4xl font-black leading-tight text-brand-charcoal">Read stories based on your level and interest</h2>
              <p class="mt-4 leading-7 text-brand-graphite">Each story can be rewritten for your current CEFR level. A1 keeps sentences short and direct. C2 gives you richer phrasing, nuance, and a more natural narrative style.</p>
            </div>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              ${levels
                .map(
                  (level, index) => `
                    <article class="rounded-lg border border-brand-line bg-white p-5 shadow-sm">
                      <span class="text-sm font-black text-brand-red">${level}</span>
                      <h3 class="mt-2 text-lg font-black text-brand-charcoal">${["Beginner", "Elementary", "Intermediate", "Upper Intermediate", "Advanced", "Mastery"][index]}</h3>
                      <p class="mt-2 text-sm leading-6 text-brand-graphite">${["Simple vocabulary and clear sentences.", "Common grammar with more context.", "Longer scenes and connected ideas.", "Richer clauses and practical nuance.", "Advanced style and idiomatic phrasing.", "Native-like narration and subtle tone."][index]}</p>
                    </article>
                  `
                )
                .join("")}
            </div>
          </div>
        </section>

        <section id="community" class="bg-brand-snow py-16">
          <div class="mx-auto grid w-[min(1180px,calc(100%_-_32px))] items-center gap-10 px-4 lg:grid-cols-[1fr_.9fr]">
            <div>
              <span class="${ui.tagRed}">Strong Community</span>
              <h2 class="mt-4 text-4xl font-black leading-tight text-brand-charcoal">Improve your learning with a community that practices with you</h2>
              <p class="mt-4 max-w-2xl leading-7 text-brand-graphite">LinguaStories is built for learners who want more than isolated reading. Share progress, discuss stories, practice accents, ask questions, and stay motivated with people learning across different languages and levels.</p>
              <div class="mt-7 grid gap-3 sm:grid-cols-3">
              ${["Share progress", "Practice reading", "Ask teachers"].map((item) => `<div class="flex items-center gap-2 rounded-lg border border-brand-line bg-white px-4 py-3 text-sm font-black text-brand-charcoal shadow-sm">${icon("check", "h-4 w-4 text-brand-redDark")}<span>${item}</span></div>`).join("")}
              </div>
            </div>
            <div class="relative min-h-[260px] overflow-hidden sm:min-h-[360px]">
              <img class="absolute inset-0 h-full w-full object-contain" src="/assets/img/community.png" alt="LinguaStories learners using phones together" />
            </div>
          </div>
        </section>

        <section id="languages" class="bg-brand-cream py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            <div class="text-center">
              <span class="${ui.tag}">Languages & Dialects</span>
              <h2 class="mt-4 text-4xl font-black text-brand-charcoal">Our list of languages extends globally</h2>
              <p class="mx-auto mt-3 max-w-2xl leading-7 text-brand-graphite">Choose the language you want to practice and build comprehension through level-matched stories.</p>
            </div>
            <div class="mt-8 columns-1 gap-10 sm:columns-2 lg:columns-4">
              ${languages.map((language) => `<p class="mb-3 break-inside-avoid text-base font-bold text-brand-charcoal">${escapeHtml(language)}</p>`).join("")}
            </div>
          </div>
        </section>

        <section id="pricing" class="bg-brand-snow py-16">
          <div class="mx-auto w-[min(1180px,calc(100%_-_32px))] px-4">
            <div class="mx-auto max-w-3xl text-center">
              <span class="${ui.tag}">Pricing & Packages</span>
              <h2 class="mt-4 text-4xl font-black text-brand-charcoal">Jump start your language learning with structured stories</h2>
              <p class="mt-3 leading-7 text-brand-graphite">Start with the story library, then expand into level changes, saved sentences, listening tracks, and review tools.</p>
            </div>
            <div class="mt-8 grid gap-4 lg:grid-cols-3">
              ${[
                ["Free Tier", "$0", ["Over 100 stories to read", "Listening Track with 2 accents", "Access our Community", "Limited Access to LinguaStories Teacher", "Accent/Reading Practice"]],
                ["Basic Tier", "$4.99", ["All Stories in Our Database", "Listening Track with all accents", "Access our Community", "Access to Story Activities/Games", "Limited Access to LinguaStories Teacher"]],
                ["Premium Tier", "$10.99", ["All Stories in Our Database", "Listening Track with all accents", "Access our Community", "Access to Story Activities/Games", "Access to LinguaStories Teacher", "Accent/Reading Practice"]]
              ]
                .map(([tier, price, features]) => `<article class="${ui.card}"><h3 class="text-xl font-black text-brand-charcoal">${tier}</h3><p class="mt-4 text-4xl font-black text-brand-ink">${price}</p><ul class="mt-4 grid min-h-48 gap-2 text-sm leading-6 text-brand-graphite">${features.map((feature) => `<li class="flex gap-2">${icon("check", "mt-1 h-4 w-4 text-brand-redDark")}<span>${escapeHtml(feature)}</span></li>`).join("")}</ul><a class="${ui.secondary} mt-5 w-full" href="/signup" data-link>${icon("arrowRight")}<span>Get Started</span></a></article>`)
                .join("")}
            </div>
          </div>
        </section>

        <section id="faqs" class="bg-brand-cream py-16">
          <div class="mx-auto w-[min(900px,calc(100%_-_32px))] px-4">
            <span class="${ui.tag}">Frequently Asked Questions</span>
            <h2 class="mt-4 text-4xl font-black text-brand-charcoal">Everything you need to know before getting started</h2>
            <div class="mt-8 grid gap-3">
              ${["Can I read the same story at different levels?|Yes. The product direction is for each story to support A1, A2, B1, B2, C1, and C2 versions.", "Do I need to know my exact level?|No. Start with a level that feels readable, then move up or down as needed.", "Is this only for reading?|No. Stories connect to sentence saving, review, and listening practice as the app grows."]
                .map((item) => {
                  const [question, answer] = item.split("|");
                  return `<article class="${ui.card}"><h3 class="font-black text-brand-charcoal">${question}</h3><p class="mt-2 text-sm leading-6 text-brand-graphite">${answer}</p></article>`;
                })
                .join("")}
            </div>
          </div>
        </section>
      </main>
    </section>
  `;
}

function authPage(mode, { appConfig }) {
  const isLogin = mode === "login";
  return `
    <section class="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#fbfbfd_62%,#f4f4f9_100%)]">
      ${publicNav(mode, { hideActions: true })}
      <main class="mx-auto grid w-[min(1080px,calc(100%_-_32px))] items-center gap-10 px-4 py-12 lg:grid-cols-[1fr_430px] lg:py-20">
        <section>
          <span class="${isLogin ? ui.tagGold : ui.tagRed}">${isLogin ? "Welcome back" : "Start free"}</span>
          <h1 class="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight text-brand-ink sm:text-5xl lg:text-6xl">${isLogin ? "Pick up right where your stories left off." : "Create your story-learning loop in a few seconds."}</h1>
          <p class="mt-5 max-w-xl text-lg leading-8 text-brand-charcoal">${isLogin ? "Review what is due, unlock your next story, and keep the practice rhythm going." : "Choose your first learning language, collect a welcome coin bonus, and begin with level-matched stories."}</p>
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
                : `<label class="${ui.label}">Native Language<select class="${ui.input}" name="nativeLanguage" required>${languageOptions(appConfig.supportedLanguages, "")}</select></label><label class="${ui.label}">First Learning Language<select class="${ui.input}" name="targetLanguage" required>${languageOptions(appConfig.supportedLanguages, "")}</select></label>`
            }
            <button class="${ui.primary} w-full">${icon(isLogin ? "login" : "add")}<span>${isLogin ? "Log in" : "Create account"}</span></button>
          </form>
          <p class="mt-4 text-sm text-brand-graphite">${isLogin ? `New here? <a class="font-black text-brand-red" href="/signup" data-link>Create an account</a>` : `Already have an account? <a class="font-black text-brand-red" href="/login" data-link>Log in</a>`}</p>
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
