# Learning and mastery

LinguaStories deliberately separates exposure, learning, weakness and durable mastery.

- **Encountered:** content appeared in a lesson.
- **Learned:** the learner completed a perfect lesson pass that targeted the content.
- **Weak:** recent incorrect lesson or review evidence needs attention.
- **Mastered:** scheduled evidence includes four successes, production recall, a 30-day interval and two consecutive successes.

Lesson completion and sequential unlocking continue to depend on one perfect full lesson pass. Review lapses never relock a completed lesson or category. Instead they change the review indicator to weak/due and schedule relearning. This preserves historical achievement while making current recall visible.

The Review dashboard reports mastered items and due work. Progress describes learned and mastered counts separately. Learn uses `review_due`/weak indicators and a direct review callout without replacing the course sequence.

Mastery projections are updated atomically with a review response. The matching content-item record receives review state/due/mastery fields; lesson and category progress records receive `reviewStatus`, `mastered` and `masteredAt`. Deprecated or suspended content does not block mastery for current content.

There are no streak rewards, coins, leagues, loss aversion, or other gamification mechanics. The streak shown on Review is a neutral count of consecutive UTC days with a completed review session.
