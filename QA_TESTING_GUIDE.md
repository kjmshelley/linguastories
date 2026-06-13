# LinguaStories QA Testing Guide

Use this guide to test LinguaStories as a browser user. It assumes the app is already deployed or running locally and seeded with demo data. Test through the UI unless a developer specifically asks for API or database checks.

## Before You Start

- Use Chrome, Safari, or Firefox on desktop.
- Test at least one mobile width, ideally a real phone or browser device mode.
- Refresh after important actions to confirm the change persists.
- Keep an eye on the top wallet balance before and after coin actions.
- Use two different accounts when testing follows, messages, goal support, appreciation, room joining, or teacher/student flows.
- Record the route, account, device/browser, steps, expected result, actual result, and screenshots for every bug.

## Seeded Tester Accounts

All seeded accounts use this password:

```text
Juy90n1!
```

| Tester | Email | Suggested Use |
| --- | --- | --- |
| Mika Tan | `demo@linguastories.local` | General learner, Japanese story/sentence flows |
| Noah Reed | `noah@linguastories.local` | Second learner for messages, follows, support, bookings |
| Sofia Rivera | `sofia@linguastories.local` | Spanish learner profile checks |
| Hana Park | `hana@linguastories.local` | Korean learner profile checks |
| Amara Okafor | `amara@linguastories.local` | Community and wallet transfer checks |

Other seeded accounts may also be available, but the five above are enough for a full QA pass.

## Test Result Labels

Use these labels in notes or tickets:

- Pass: Works as expected.
- Fail: User-facing behavior is broken.
- Blocked: Cannot test because setup, auth, missing data, permissions, or an external provider prevents progress.
- Needs Review: Behavior works, but copy, layout, speed, or product behavior feels questionable.

## Core Smoke Test

Run this first after every deploy or major change.

1. Open `/`.
2. Confirm the public landing page loads and does not show the logged-in app shell.
3. Open `/login`.
4. Log in as `demo@linguastories.local`.
5. Confirm the app opens to Short Stories or another valid authenticated app route.
6. Navigate to Short Stories, Sentence Mining, Connect, Moments, Find a Teacher, My Schedule, My Account, My Profiles, My Goals, My Moments, and My Wallet.
7. Refresh on each major route.
8. Log out from My Account.
9. Confirm logout returns to a public page and protected app routes require login again.

Expected result: Public/authenticated shells stay separate, navigation works after refresh, and no page shows a blank view or raw error.

## Public Website and Auth

### Landing Page

1. Open `/`.
2. Check the brand, headline, pricing, language, community, and FAQ sections.
3. Click Login.
4. Return to `/` and click Get Started or Create Account.

Expected result: Public CTAs route correctly and the page remains readable on desktop and mobile.

### Signup

1. Open `/signup`.
2. Create a new account with a unique email.
3. Choose native language and first learning language.
4. Submit.
5. Refresh the first app page after signup.

Expected result: Signup logs the user in, creates the first language profile, creates a wallet, and keeps the session after refresh.

### Login Validation

1. Try a seeded email with a wrong password.
2. Try a blank email or blank password.
3. Try a malformed email if the browser allows submission.
4. Log in with valid seeded credentials.

Expected result: Invalid attempts show clear errors and valid credentials open the app.

### Logout

1. Log in.
2. Open My Account.
3. Click Log Out.
4. Try to open `/app/short-stories` directly.

Expected result: Logout clears the session and protected routes require a fresh login.

## App Shell and Navigation

### Desktop Navigation

1. Log in.
2. Use the sidebar groups: Menu, Community, Learning, Profile.
3. Click wallet balance in the top bar.
4. Open notifications if a badge is visible.
5. Use the browser Back and Forward buttons.

Expected result: Active nav state, page title, wallet shortcut, notifications, and browser history all behave predictably.

### Mobile Navigation

1. Resize to a phone width or use a phone.
2. Open the mobile menu.
3. Navigate to every visible section.
4. Close and reopen the menu.
5. Confirm buttons and tabs are easy to tap.

Expected result: The app has no horizontal scrolling, no overlapping text, and common controls remain usable at mobile width.

### Direct Route Refresh

Open and refresh these routes after login:

- `/app/short-stories`
- `/app/sentence-mining`
- `/app/community/connect`
- `/app/community/moments`
- `/app/community/voice-video-rooms`
- `/app/learning/find-teacher`
- `/app/learning/my-learning`
- `/app/learning/teacher-dashboard`
- `/app/profile/my-info`
- `/app/profile/my-profiles`
- `/app/profile/subscriptions`
- `/app/profile/goals`
- `/app/profile/moments`
- `/app/profile/wallet`

Expected result: Each route reloads into the app instead of a 404 or login loop.

## Short Stories and Reading

### Short Stories Home

1. Open Short Stories.
2. Use the featured story previous/next arrows.
3. Use dot controls if present.
4. Open a category rail item.
5. Confirm images, titles, levels, costs, and rewards are readable.

Expected result: Carousel and story cards update without layout jumps or broken images.

### Search Short Stories

1. Open Search Short Stories.
2. Search by title, topic, or level.
3. Test progress, length, coin reward, engagement, and sort filters.
4. Click Reset.

Expected result: Results and counts update immediately and Reset clears all filters.

### Unlock Story

1. Find a locked story.
2. Note the wallet balance.
3. Click Unlock.
4. Refresh the story list and the story detail page.

Expected result: The story unlocks, the wallet decreases by the unlock cost, and unlock state persists.

### Story Detail and Reader Tools

1. Open an unlocked story.
2. Change reading level.
3. Change story language if multiple language profiles are available.
4. Toggle source text, target text, and romanization.
5. Click Play Audio.
6. Click Share Story.

Expected result: Reader content updates correctly, toggles persist within the view, audio attempts to play, and share uses browser share or copy behavior.

### Story Tabs and Community

1. Open Key Sentences, Key Words, Key Grammar Points, and Community tabs.
2. Save a key sentence.
3. Post a story comment.
4. Reply to an existing story comment.
5. Refresh.

Expected result: Tabs switch cleanly, saved sentences persist, and comments/replies remain visible.

### Complete, Like, and Favorite

1. Open an unlocked incomplete story.
2. Click Complete.
3. Click Like and Favorite.
4. Refresh.

Expected result: Completion awards coins only once, and like/favorite states persist.

## Sentence Mining and Review

### Sentence Mining Home

1. Open Sentence Mining.
2. Confirm deck cards, review entry points, and browse actions are visible.
3. Open the deck library.
4. Open a deck.
5. Open a topic if topic links are available.

Expected result: Deck navigation works from home to library to deck/topic detail, including browser refresh.

### Create Personal Deck

1. Open Sentence Mining or Sentence Deck Library.
2. Create a personal deck.
3. Fill name, description, source language, target language, level, visibility, and coin settings if shown.
4. Submit and refresh.

Expected result: The new deck appears and opens without losing data.

### Add Mined Sentence

1. Open a personal deck.
2. Add a sentence with target sentence, translation, topic, level, notes, and variations if available.
3. Submit.
4. Refresh the deck.

Expected result: The sentence appears in the deck/topic and any coin reward or wallet history appears correctly.

### Edit and Delete Mined Content

1. Edit a mined sentence.
2. Change text, translation, notes, level, or topic.
3. Save and refresh.
4. Delete a sentence only if it was created during this QA run.
5. Delete a deck only if it was created during this QA run.

Expected result: Edits persist, delete confirmations are clear, and deleted QA-created content disappears.

### Review Saved Sentences

1. Open SRS Review from Sentence Mining or direct route.
2. Test Show again or Again.
3. Test Hard.
4. Test Easy or I know this.
5. Refresh after a rating.

Expected result: Ratings submit successfully, due state changes sensibly, and the review flow never gets stuck on the same card after completion.

### Language-Scoped Decks

1. Switch the current language profile in My Profiles.
2. Return to Sentence Mining.
3. Compare visible decks and sentences.

Expected result: Language-specific decks and review items match the selected profile language.

## Shadowing and Progress

### Shadowing Practice

1. Open Shadowing if linked or directly available.
2. Confirm the target sentence and romanization are visible.
3. Try Normal speed, Slow speed, Auto replay, and Loop.
4. Click Complete.

Expected result: Controls respond, completion adds shadowing progress, and coins are awarded once per eligible action.

### Progress Dashboard

1. Open Progress Dashboard if linked or directly available.
2. Review sentence, story, coin, streak, listening, shadowing, and goal metrics.
3. Complete a story, sentence review, or shadowing session.
4. Return to Progress and refresh.

Expected result: Metrics are readable and reflect recent activity where applicable.

## Goals

### Create Language Goal

1. Open My Goals.
2. Click Create Goal.
3. Fill title, type, target, due date, and visibility.
4. Leave Global goal unchecked.
5. Submit and refresh.

Expected result: The new language-specific goal appears and awards coins if eligible.

### Create Global Goal

1. Open My Goals.
2. Create a goal with Global goal checked.
3. Submit and refresh.

Expected result: The goal appears under Global Goals and can be viewed by other users if public.

### Edit Goal

1. Edit a QA-created goal.
2. Change title, target, due date, and visibility.
3. Save and refresh.

Expected result: Goal updates persist.

### Support Another User's Goal

1. Log in as one seeded user.
2. Open another learner profile from Connect.
3. Find a public goal.
4. Click Support.
5. Enter a coin amount and optional message.
6. Submit.
7. Log in as the recipient and check wallet/history if needed.

Expected result: Sender balance decreases, recipient support increases, and wallet history records the transfer.

## Wallet and Coins

### Wallet Summary

1. Open My Wallet.
2. Confirm current balance, lifetime earned, lifetime spent, and weekly earned.
3. Review transaction history.
4. Open How Coins Are Earned.

Expected result: Wallet totals and history rows are readable, and the coin rules modal opens and closes.

### Earning Coins

1. Note the wallet balance.
2. Complete an earning action: sentence review, sentence mining, story completion, shadowing, goal creation, moment creation, follow, or received like.
3. Recheck balance and wallet history.

Expected result: Balance increases by the expected amount and the transaction appears.

### Spending Coins

1. Note the wallet balance.
2. Spend coins through story unlock, goal support, moment appreciation, direct message, or voice/video room.
3. Recheck balance and wallet history.

Expected result: Balance decreases correctly, never becomes negative, and failed low-balance actions show a clear error.

### Coin Animation

1. Note the top-bar wallet balance.
2. Perform a coin-earning action.
3. Watch the action area and wallet area.

Expected result: The visible balance updates and any coin animation does not block controls or overlap text.

## Community

### Connect

1. Open Connect.
2. Switch between My Community and New Connects.
3. Open a learner profile.
4. Follow and unfollow the learner.
5. Refresh.

Expected result: Lists update by tab, learner profile opens, and follow state persists.

### Learner Profile

1. Open another learner's profile.
2. Review bio, languages, native language, stats, latest focus, public goals, activity, and moments.
3. Switch between Recent Learning Activity and Moments.
4. Click Encourage Message.

Expected result: Profile data is readable, tabs switch correctly, and messaging opens the direct message drawer.

### Moments Feed

1. Open Moments.
2. Confirm image thumbnails render correctly.
3. Create a moment with post type, body, optional linked item, and optional picture.
4. Refresh.

Expected result: New moment appears, image stays thumbnail-sized in feeds, and creating a moment awards coins if eligible.

### Moment Detail

1. Open a moment.
2. Confirm detail page shows a larger image if present.
3. Add a comment.
4. Like another user's moment.
5. Send Appreciation to another user's moment.
6. Refresh.

Expected result: Comments, likes, views, and appreciation coin transfers persist.

### My Moments

1. Open My Moments.
2. Confirm only the current user's posts appear.
3. Review view, like, and comment counts.
4. Open a post detail from the list.

Expected result: Counts are visible and rows open the correct moment.

## Direct Messaging

### Open and Read Messages

1. Click Messages in the app shell.
2. Select a conversation.
3. Confirm unread count decreases after opening.
4. Hide/show contacts on desktop if available.
5. Test the mobile contacts-to-message flow.

Expected result: The message drawer behaves correctly and read state persists.

### Send Direct Message

1. Log in as one seeded user.
2. Open another learner profile.
3. Click Encourage Message.
4. Send a message.
5. Note sender wallet balance.
6. Log in as the recipient and open Messages.

Expected result: The message appears for both users, sender spends 1 coin, recipient receives 1 coin, and unread counts update.

## Voice/Video Rooms

### Room List and Filters

1. Open Voice/Video Rooms.
2. Search by keyword.
3. Filter by level and room type.
4. Toggle Past Rooms.

Expected result: Rooms filter correctly, past rooms toggle without losing layout, and room type icons match voice or video.

### Create Room

1. Make sure the account has enough coins for room creation/joining controls.
2. Click Create Room.
3. Fill title, description, room type, CEFR level, languages, max participants, access, and optional image.
4. Submit and refresh.

Expected result: The room appears in the list with the correct type, image, level, language, and status.

### Join and Leave Room

1. Open a room.
2. Start or Join the room.
3. Approve microphone/camera permissions if the browser prompts.
4. Toggle mic, and toggle camera for video rooms.
5. Leave the room.
6. Check wallet history.

Expected result: Live room UI loads, timer/participant state updates, controls respond, and coin charges are recorded correctly.

Note: Camera and microphone prompts usually require localhost or HTTPS. If testing on an insecure LAN URL, mark media permission tests as blocked rather than failed.

## Teacher and Lesson Booking

### Find a Teacher

1. Open Find a Teacher.
2. Search by name, goal, or style.
3. Filter by maximum hourly rate.
4. Open a teacher profile.
5. Click Message.

Expected result: Teacher cards match the selected profile language, filters work, teacher profiles load, and messaging opens correctly.

### Book Lesson

1. Open a teacher profile.
2. Click Book Lesson.
3. Choose lesson type, duration, date, and available time.
4. Continue through the payment step as far as the test environment allows.
5. Refresh My Schedule.

Expected result: Booking calendar shows 7 visible days, unavailable slots are not selectable, and payment or pending-payment state is clear.

### My Schedule

1. Open My Schedule.
2. Switch between My Booked lessons, My Booked Teachers, and My Scheduled Classes.
3. Use previous/next week if available.
4. Open or join a classroom for an eligible lesson.

Expected result: Tabs show the correct data, calendar cards line up by day, and classroom entry is available only where appropriate.

### Teacher Dashboard

1. Open Teacher Dashboard with an account that has teacher workspace access.
2. Confirm stats and active bookings are shown.
3. Toggle Completed and paid.
4. Open Unavailable Blocks.

Expected result: Dashboard defaults to active bookings, completed paid bookings appear only when toggled, and Unavailable Blocks opens as a page.

### My Teacher Profiles

1. Open My Profiles.
2. Switch to My Teacher Profiles if the tab is available.
3. Create a teacher profile with required fields.
4. Edit the profile.
5. Delete only a QA-created teacher profile.

Expected result: Teacher profile create/edit/delete works inside the My Profiles hub and does not disrupt language profiles.

### Teacher Availability and Workspace Pages

Open these teacher workspace pages if visible or directly available:

- `/app/learning/availability`
- `/app/learning/unavailable-blocks`
- `/app/learning/students`
- `/app/learning/lesson-notes`
- `/app/learning/resources`
- `/app/learning/templates`

Expected result: Pages render without blank states, forms validate required fields, and newly created resources/templates persist after refresh.

## Profile, Subscriptions, and Account

### My Account

1. Open My Account.
2. Change display name, native language, and bio.
3. Save and refresh.
4. Upload a JPG, PNG, WebP, or GIF profile picture if supported by the UI.

Expected result: Account changes and avatar updates persist.

### Subscriptions

1. Open My Account.
2. Click Subscriptions.
3. Review learner subscription and teacher subscription sections.
4. Compare highlighted plan and status with visible access to teacher workspace features.

Expected result: Subscription information is readable and access-gated features match the plan/capabilities.

### My Language Profiles

1. Open My Profiles.
2. Confirm My Language Profiles is available.
3. Add a language profile.
4. Edit level and visibility.
5. Make a non-current language current.
6. Try removing the current language.
7. Remove only a QA-created non-current profile.

Expected result: Current language cannot be removed, non-current QA-created profiles can be removed, and selected language affects language-scoped app content.

### Account Deletion Guardrail

1. Open My Account.
2. Click Delete Account.
3. Review the confirmation modal.
4. Cancel/close the modal.

Expected result: The modal clearly explains the destructive action and can be dismissed. Do not confirm deletion for seeded accounts unless the test run explicitly requires it.

## Admin and Health Smoke Tests

### Admin

1. Open Admin if available to the tester.
2. Confirm stats for sentence packs, stories, coin rules, moderation queue, and goal templates.

Expected result: Admin stats render without broken values. If the tester lacks access, mark blocked.

### Health

1. Open `/api/health` in the browser.

Expected result: The endpoint returns a minimal healthy response. If the deployed environment blocks direct API viewing, mark blocked.

## Negative and Edge Cases

### Required Fields

Submit these forms with required fields missing:

- Signup
- Login
- Create personal deck
- Add mined sentence
- Create goal
- Create moment
- Story comment
- Direct message
- Create voice/video room
- Create teacher profile
- Teacher availability
- Teacher resource/template

Expected result: Browser validation or readable app errors prevent incomplete submissions.

### Low Balance

1. Use an account with low coins or spend down a QA account.
2. Try story unlock, goal support, moment appreciation, direct message, and voice/video room join.

Expected result: The app prevents actions that exceed available balance and wallet balance never goes negative.

### File Upload Validation

1. Try unsupported files for avatar, moment image, room image, and teacher profile image.
2. Try a very large image.
3. Try a valid JPG, PNG, or WebP image.

Expected result: Invalid files are rejected with readable errors, and valid files upload or preview correctly.

### Cross-Account Visibility

1. Create public and private content where visibility settings exist.
2. Log in as a second seeded user.
3. Check whether the content is visible.

Expected result: Public content can be seen by other users where intended; private content stays hidden.

### Refresh and Back Button

1. Perform a create/edit action.
2. Refresh.
3. Use browser Back and Forward.
4. Reopen the edited item.

Expected result: Data persists and browser history does not reopen stale modals or blank views.

## Mobile and Layout Checklist

Run this checklist on public pages, app shell, Short Stories, Sentence Mining, Moments, My Schedule, Teacher Dashboard, and My Profiles.

- No horizontal page scrolling at phone width.
- No overlapping text, buttons, cards, tabs, or modals.
- Buttons and form fields are easy to tap.
- Tables become cards or scroll in a controlled way.
- Modals fit within the viewport and can be closed.
- Images keep useful crops and do not stretch.
- Long names, emails, titles, and sentences wrap cleanly.
- Keyboard focus is visible for links, buttons, and fields.

## Regression Checklist

- Public pages stay public and do not show authenticated dashboard links.
- Protected app routes require login.
- Authenticated app routes survive direct refresh.
- Sidebar labels and page titles are consistent.
- Wallet balances and history stay consistent after earn/spend actions.
- Coin balances never become negative.
- Sentence Mining deck, topic, and review flows work for the current language profile.
- Story unlock, completion, like, favorite, comments, and saved sentences persist.
- Community follows, moments, comments, likes, and appreciation persist.
- Direct messages remain in the drawer experience and do not become a full page.
- Voice/video room creation, join, leave, media controls, and charging work where media permissions are available.
- Teacher booking shows real availability and clear payment state.
- My Schedule tabs and calendar remain readable on mobile.
- My Profiles keeps language profiles and teacher profiles separated in the hub.
- Subscriptions show learner and teacher plan status clearly.
- Delete confirmations appear before destructive actions.
- Mobile layout has no overlapping text or unusable controls.

## Bug Report Template

```text
Title:
Environment:
Account:
Route:
Device/browser:
Build/deploy version:

Steps:
1.
2.
3.

Expected:

Actual:

Screenshots/video:

Notes:
```
