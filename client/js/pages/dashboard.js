import { escapeHtml, ui } from "../ui.js";
import { myLearningView } from "./learning.js";

function metric(label, value) {
  return `
    <div class="rounded-lg border border-brand-line/75 bg-white/65 p-4">
      <span class="block text-xs font-bold uppercase text-brand-graphite">${escapeHtml(label)}</span>
      <strong class="mt-2 block text-2xl font-bold text-brand-ink">${escapeHtml(value)}</strong>
    </div>
  `;
}

export function dashboardView({ state, appPath = (route) => `/app/${route}`, teacherStudentData = {}, myLearningTab = "lessons", myLearningWeekStart = "" }) {
  const followedLearners = (state.learners || []).filter((learner) => learner.following);
  const recentPosts = state.posts || [];
  const lessons = teacherStudentData.lessons || state.lessons || state.myLessons || [];
  const upcomingLessons = lessons.filter((lesson) => !["completed", "cancelled_by_student", "cancelled_by_teacher"].includes(lesson.status));
  const unreadMessages = Number(state.directChat?.unreadCount || 0);

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

      ${myLearningView({ teacherStudentData: { ...teacherStudentData, lessons }, state, appPath, myLearningTab, myLearningWeekStart })}
    </div>
  `;
}
