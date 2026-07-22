# Progress experience

Phase 8 replaces the placeholder Progress page with an offline-first learning report. It contains a learning overview, deterministic Continue Learning action, curriculum/category progress, vocabulary, dialogue and story totals, review retention, weak areas, learning streak, and recent activity.

Category rows link to `/app/progress/category/:slug`. The detail view loads only that installed category and reports required-lesson completion, attempts, active study time, and review availability. Installed stories can be reopened from the category detail. Reading them again never writes a completion event or changes the review schedule.

The Continue Learning action uses the Phase 6 target: an active saved lesson wins, followed by a failed unlocked lesson, then the first unlocked incomplete lesson. If there is no target it returns to the Learn path without inventing progress.

Empty states explain that completed attempts and reviews are required. All percentages have text labels and native progressbar semantics. Review due counts and content-attention badges are announced in navigation.

The page is fully local and remains usable offline when the curriculum is installed. Network-dependent update checks live in Settings and retain their explicit offline state.
