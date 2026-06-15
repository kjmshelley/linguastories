import { escapeHtml, icon, ui } from "../ui.js";

function metric(label, value) {
  return `
    <div class="rounded-lg border border-brand-line/75 bg-white/65 p-4">
      <span class="block text-xs font-bold uppercase text-brand-graphite">${escapeHtml(label)}</span>
      <strong class="mt-2 block text-2xl font-bold text-brand-ink">${escapeHtml(value)}</strong>
    </div>
  `;
}

function actionCard({ title, body, meta, iconName, href, buttonLabel, buttonIcon, primary = false }) {
  return `
    <article class="rounded-lg border border-brand-line/80 bg-brand-panel p-5 shadow-[0_1px_2px_rgba(29,41,63,.05)]">
      <div class="flex items-start gap-3">
        <div class="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-redDark">${icon(iconName, "h-5 w-5")}</div>
        <div class="min-w-0">
          <h3 class="text-base font-bold text-brand-ink">${escapeHtml(title)}</h3>
          <p class="mt-1 text-sm leading-6 text-brand-graphite">${escapeHtml(body)}</p>
          ${meta ? `<p class="mt-2 text-xs font-bold text-brand-charcoal">${escapeHtml(meta)}</p>` : ""}
        </div>
      </div>
      <div class="mt-4">
        <a class="${primary ? ui.primary : ui.secondary}" href="${escapeHtml(href)}" data-app-link>${icon(buttonIcon, "h-4 w-4")}<span>${escapeHtml(buttonLabel)}</span></a>
      </div>
    </article>
  `;
}

function listItem(title, body, href, iconName) {
  return `
    <a class="flex items-center gap-3 rounded-lg border border-brand-line/75 bg-white/65 p-3 no-underline transition hover:border-brand-orange/45 hover:bg-white" href="${escapeHtml(href)}" data-app-link>
      <span class="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-redDark">${icon(iconName, "h-4 w-4")}</span>
      <span class="min-w-0">
        <strong class="block truncate text-sm text-brand-ink">${escapeHtml(title)}</strong>
        <span class="block truncate text-xs font-semibold text-brand-graphite">${escapeHtml(body)}</span>
      </span>
      <span class="ml-auto text-brand-graphite">${icon("arrowRight", "h-4 w-4")}</span>
    </a>
  `;
}

export function dashboardView({ state, appPath = (route) => `/app/${route}` }) {
  const followedLearners = (state.learners || []).filter((learner) => learner.following);
  const recentPosts = state.posts || [];
  const upcomingLessons = (state.lessons || state.myLessons || []).filter((lesson) => !["completed", "cancelled_by_student", "cancelled_by_teacher"].includes(lesson.status));
  const unreadMessages = Number(state.directChat?.unreadCount || 0);
  const canUseTeacherWorkspace = Boolean(state.subscription?.capabilities?.teacherWorkspace || state.user?.subscription?.capabilities?.teacherWorkspace);

  const primaryActions = [
    actionCard({
      title: "Find a professional teacher",
      body: "Compare verified teacher profiles, rates, availability, and lesson fit.",
      meta: "Book live online lessons when you are ready.",
      iconName: "search",
      href: appPath("findTeacher"),
      buttonLabel: "Find a Teacher",
      buttonIcon: "search",
      primary: true
    }),
    actionCard({
      title: "Review your lessons",
      body: "Keep upcoming lessons, teacher messages, and classroom links in one place.",
      meta: `${upcomingLessons.length} upcoming or active`,
      iconName: "calendar",
      href: appPath("myLessons"),
      buttonLabel: "My Lessons",
      buttonIcon: "book"
    }),
    actionCard({
      title: "Practice with people",
      body: "Join live voice/video practice rooms and keep speaking between lessons.",
      meta: "Community practice between lessons.",
      iconName: "video",
      href: appPath("voiceVideoRooms"),
      buttonLabel: "Practice",
      buttonIcon: "video"
    }),
    actionCard({
      title: canUseTeacherWorkspace ? "Teacher Workspace" : "Create a teacher profile",
      body: canUseTeacherWorkspace
        ? "Manage profiles, bookings, students, lesson notes, and scheduling."
        : "Apply to teach by submitting a teacher profile for review.",
      meta: canUseTeacherWorkspace ? "Workspace tools unlocked." : "Approval typically takes 1 - 2 days.",
      iconName: "user",
      href: canUseTeacherWorkspace ? appPath("teacherDashboard") : appPath("teacherProfileCreate"),
      buttonLabel: canUseTeacherWorkspace ? "Open Workspace" : "Create Profile",
      buttonIcon: canUseTeacherWorkspace ? "dashboard" : "add"
    })
  ].join("");

  return `
    <div class="grid gap-5">
      <section class="rounded-lg border border-brand-line bg-brand-panel p-5">
        <div>
          <div>
            <span class="${ui.tagGold}">Learning workspace</span>
            <h2 class="mt-3 text-3xl font-bold tracking-tight text-brand-ink">Welcome back ${escapeHtml(state.user?.displayName || "")}</h2>
            <p class="mt-2 max-w-3xl text-sm leading-6 text-brand-graphite">Book lessons with professional teachers, practice with real people, and keep your language routine moving.</p>
          </div>
        </div>
      </section>

      <section class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        ${metric("Upcoming lessons", upcomingLessons.length)}
        ${metric("Unread messages", unreadMessages)}
        ${metric("Community posts", recentPosts.length)}
        ${metric("Following", followedLearners.length)}
      </section>

      <section class="grid gap-4 md:grid-cols-3">
        ${primaryActions}
      </section>

      <section class="grid gap-4">
        <article class="${ui.card}">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-bold text-brand-ink">Community</h3>
              <p class="mt-1 ${ui.muted}">Meet learners, share progress, and keep practice social.</p>
            </div>
            ${icon("users", "h-6 w-6 text-brand-redDark")}
          </div>
          <div class="mt-4 grid gap-2">
            ${listItem("Community", `${recentPosts.length} posts from the last 7 days`, appPath("communityConnect"), "message")}
            ${listItem("Find Learners", `${followedLearners.length} people followed`, appPath("communityConnect"), "users")}
          </div>
        </article>
      </section>
    </div>
  `;
}
