# Progress metric definitions

- **Course completion:** completed required lessons divided by the required lesson count published in the manifest. It is floored to a whole percentage and cannot exceed 100%.
- **Lesson completed:** every scored exercise was correct in one full attempt. A later replay failure never removes historical completion.
- **Category completed:** all required lessons in that category are historically complete.
- **Vocabulary encountered:** distinct vocabulary records with at least one lesson encounter.
- **Vocabulary learned:** distinct vocabulary learned through a perfect lesson pass. This is intentionally different from mastery.
- **Dialogue/story completed:** the dialogue or story attached to a perfectly completed lesson. Reopening a reader does not increment it.
- **Mastered:** the Phase 7 scheduler has durable successful recall and required production evidence.
- **Weak area:** an item classified `weak` or `at_risk`, ranked by weakness score and then most recent activity. The score weighs repeated/recent incorrect answers and recovery.
- **Review accuracy:** correct review responses divided by all persisted review responses. Optional practice remains included because it is a real submitted response.
- **Active study time:** the lesson engine’s accumulated active milliseconds from finished attempts. Idle/background time and app opens are excluded.
- **Recent activity:** completion/failure/practice events plus completed review sessions, ordered by persisted timestamp.
- **Learning streak:** unique UTC calendar days containing a finished lesson attempt or completed review session. Today or yesterday may anchor the current streak. App opens, in-progress sessions, and idle time do not count.
- **Review streak:** retained as the Phase 7 review-only streak and counts consecutive UTC dates with a completed review session.

The lightweight integrity service reports completed lessons without attempts, unmet prerequisites, category mismatches, missing review content, negative time, and invalid pair associations. It does not silently delete history; serious issues recommend repair.
