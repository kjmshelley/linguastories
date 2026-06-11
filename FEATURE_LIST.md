# LinguaStories Feature List

LinguaStories is a story-based language learning app with sentence practice, adaptive story reading, goals, coins, community moments, direct messages, and multi-language learner profiles.

## Public Website and Authentication

- Public landing page with product sections for story learning, supported languages, CEFR levels, community, pricing, and FAQs.
- Signup flow with display name, email, password, native language, and first learning language.
- Login and logout flows.
- Session-based authenticated app shell.
- Account deletion flow with confirmation modal.

## App Navigation and Shell

- Logged-in sidebar navigation grouped by Short Stories, Community, and Profile.
- Mobile top bar and mobile navigation drawer.
- Top bar language indicator and language switcher.
- Wallet balance shortcut.
- Notification badge for reviews, goals, wallet state, and unread messages.
- Right-side direct message drawer with desktop and mobile layouts.

## Dashboard and Progress

- Dashboard review prompt for a due sentence.
- Dashboard stats for reviews due, new sentences, stories ready, and coins to earn.
- Learning path cards with progress bars.
- Progress dashboard with sentence, story, coin, streak, listening, shadowing, and goal completion metrics.

## Sentence Learning

- Sentence Library grouped by review status, new sentences, and topic.
- Sentence cards with target sentence, translation, romanization, notes, level, topic, and state.
- Learn action that moves a sentence into learning state and awards coins.
- SRS Review page with Again, Hard, Good, and Easy ratings.
- Review ratings update due dates and sentence state.
- Saved sentence deck.
- Add custom sentence form with sentence, translation, topic, level, and notes.
- Custom sentence creation saves the sentence and awards coins.
- Save key sentences from story details.

## Short Stories and Reading

- Short Stories page with featured story carousel.
- Story category rails.
- Story search page with filters for text query, progress, max reading length, coin reward, engagement signal, and sort order.
- Story unlock flow that spends coins.
- Story detail page for unlocked and locked stories.
- Adaptive reading levels from A1 through C2 where translations exist.
- Story language selector based on the user's active language profiles.
- Reader tools for audio playback, source text, target text, romanization, and share link.
- Story completion action that awards coins.
- Like and favorite story actions.
- Story tabs for key sentences, key words, grammar points, and community discussion.
- Story comments and one-level replies.

## Shadowing

- Shadowing practice screen showing a target sentence and romanization.
- UI controls for normal speed, slow speed, auto replay, and loop.
- Complete shadowing action that adds shadowing time and awards coins.

## Goals

- Create language-specific goals.
- Create global goals that apply to all language profiles.
- Edit goal title, type, target, due date, and visibility.
- Goal progress display with progress bars.
- Public/private goal visibility.
- Supporter modal for global goals with supporter list.
- Community goal support where users can give coins and optional encouragement messages.

## Wallet and Coin Economy

- Wallet summary for current balance, lifetime earned, lifetime spent, and weekly earned.
- Transaction history.
- Coin rules modal explaining how coins are earned.
- Coin rewards for reviews, sentence learning, custom sentence mining, story completion, shadowing, goal creation, learning posts, follows, likes received, goal support received, moment appreciation, direct messages received, and signup.
- Coin spending for story unlocks, goal support sent, moment appreciation sent, and direct messages sent.
- Wallet gain animation after coin-earning actions.

## Profile and Language Profiles

- Account details edit form for display name, email, native language, and bio.
- Profile picture upload with crop flow.
- Active language profiles page.
- Add language profile.
- Edit language level and profile visibility.
- Make a language profile current.
- Remove non-current language profiles.
- Language-specific progress summary for stories and goals.

## Community

- Connect page with My Community and New Connects tabs.
- Learner matching based on active language profiles and recent activity.
- Learner profile pages with bio, learning languages, native language, stats, latest focus, public goals, recent learning activity, and moments.
- Follow and unfollow learners.
- Encourage Message action that opens the direct message drawer.
- Moments feed for user's own and like-minded learner posts.
- My Moments page for the current user's posts, views, likes, and comments.
- Create Moment flow with post type, optional sentence/story/goal link, optional picture, and post body.
- Moment image thumbnail display in feeds and larger image modal/detail view.
- Moment detail page with comments.
- Like moments.
- View count tracking when opening moment detail.
- Send appreciation coins to another user's moment.
- Save public goal-related posts.

## Direct Messaging

- Right-side message drawer.
- Conversation list with unread counts.
- Message thread view.
- New message flow from learner profiles.
- Sending a direct message transfers 1 coin from sender to recipient.
- Mark conversation as read when opened.
- Mobile contacts/message split view.

## Admin and Health

- Admin stats page for sentence packs, stories, coin rules, moderation queue, and goal templates.
- API health endpoint.

## Seeded Demo Data

Seeded accounts all use this password:

```text
Juy90n1!
```

Available seeded emails include:

- `demo@linguastories.local`
- `noah@linguastories.local`
- `ari@linguastories.local`
- `sofia@linguastories.local`
- `mateo@linguastories.local`
- `camille@linguastories.local`
- `hana@linguastories.local`
- `eli@linguastories.local`
- `priya@linguastories.local`
- `lucas@linguastories.local`
- `nora@linguastories.local`
- `kenji@linguastories.local`
- `amara@linguastories.local`
- `theo@linguastories.local`
- `lina@linguastories.local`
- `owen@linguastories.local`

