# LinguaStories QA Testing Guide

This guide is for browser-based QA testing of the LinguaStories app. It assumes the app is already deployed or running locally and seeded with demo data.

## Seeded Tester Accounts

Use any of these accounts:

| User | Email | Password |
| --- | --- | --- |
| Mika Tan | `demo@linguastories.local` | `Juy90n1!` |
| Noah Reed | `noah@linguastories.local` | `Juy90n1!` |
| Sofia Rivera | `sofia@linguastories.local` | `Juy90n1!` |
| Hana Park | `hana@linguastories.local` | `Juy90n1!` |
| Amara Okafor | `amara@linguastories.local` | `Juy90n1!` |

Use at least two different accounts when testing community, messages, likes, follows, goal support, and coin transfers.

## General QA Notes

- Test desktop and mobile widths.
- Refresh after major actions to confirm changes persist.
- Watch the wallet balance before and after coin-related actions.
- Confirm modals close after successful submissions.
- Confirm empty states and error messages are readable.
- Do not delete seeded accounts unless specifically testing account deletion.

## Public Website

### Landing Page

1. Open `/`.
2. Confirm the LinguaStories logo and product headline are visible.
3. Scroll through About, Levels, Community, Languages, Pricing, and FAQs.
4. Click Login.
5. Return to `/` and click Get Started Now.

Expected result: Public navigation works and the landing page never shows logged-in dashboard links.

### Signup

1. Open `/signup`.
2. Create a new account with a unique email.
3. Choose native language and first learning language.
4. Submit the form.

Expected result: New user is logged into the app, receives a wallet balance, and sees the authenticated app shell.

### Login and Logout

1. Open `/login`.
2. Log in with `demo@linguastories.local` and `Juy90n1!`.
3. Confirm the app shell loads.
4. Use Log Out from My Account.

Expected result: Login succeeds and logout returns to the public site.

## App Shell

### Navigation

1. Log in.
2. Visit Short Stories, Connect, Moments, My Account, My Language Profiles, My Goals, My Moments, and My Wallet.
3. On mobile width, open and close the mobile menu.
4. Click the wallet balance shortcut.
5. Click notifications if visible.

Expected result: Pages route without full-page breakage, titles update, mobile menu behaves correctly, and wallet shortcut opens My Wallet.

## Dashboard and Progress

### Dashboard Review Prompt

1. Open the main app dashboard if available.
2. Click Review Now on the featured sentence.
3. Watch for wallet balance changes.

Expected result: Review action completes, the sentence state updates, and coins are awarded.

### Progress Stats

1. Visit Progress Dashboard if linked or directly available.
2. Review all metric cards.
3. Complete a review or story, then revisit progress.

Expected result: Metrics are readable and reflect learning activity after refresh.

## Sentence Features

### Sentence Library

1. Open Sentence Library if available from hidden routes or direct navigation.
2. Confirm rails for due reviews, new sentences, and topics.
3. Click Learn on a sentence.

Expected result: The sentence moves into learning/review state and awards coins.

### SRS Review

1. Open the SRS Review page.
2. Test each rating: Again, Hard, Good, and Easy.
3. Refresh after one rating.

Expected result: Ratings submit successfully; Easy can move a sentence toward Mastered, while other ratings keep it in Review.

### Saved Sentence Deck

1. Open My Sentence Deck.
2. Add a custom sentence with sentence, translation, topic, level, and notes.
3. Submit the form.
4. Refresh the page.

Expected result: The new custom sentence appears in the saved deck and the user receives coins.

## Short Stories

### Featured Story Carousel

1. Open Short Stories.
2. Use previous and next arrows.
3. Use dot controls.

Expected result: Featured story changes without layout overlap or broken images.

### Story Search and Filters

1. Open Search Short Stories.
2. Search by title, topic, or level.
3. Test each filter: progress, length, coins, signals, and sort.
4. Click Reset.

Expected result: Story results update immediately, counts are correct, and Reset clears filters.

### Unlock Story

1. Find a locked story.
2. Note wallet balance.
3. Click Unlock.
4. Refresh the page.

Expected result: Story becomes unlocked and wallet balance decreases by the story cost.

### Story Detail and Reader Tools

1. Open an unlocked story.
2. Change reading level.
3. Change story language if multiple language profiles are available.
4. Toggle source language, target language, and romanization.
5. Click Play Audio.
6. Click Share Story.

Expected result: Reader content updates, toggles work, audio attempts to play through browser speech synthesis, and share copies or opens browser share UI.

### Story Tabs

1. Open a story detail page.
2. Test Key Sentences, Key Words, Key Grammar Points, and Community tabs.
3. Save a key sentence.
4. Post a story comment.
5. Reply to an existing story comment.

Expected result: Tabs switch cleanly, saved sentences persist, comments and replies appear after submission.

### Complete, Like, and Favorite Story

1. Open an unlocked incomplete story.
2. Click Complete.
3. Click Like and Favorite.
4. Refresh the page.

Expected result: Completion persists and awards coins once; like and favorite states persist.

## Shadowing

### Shadowing Practice

1. Open Shadowing.
2. Confirm the target sentence and romanization are visible.
3. Click Normal speed, Slow speed, Auto replay, and Loop.
4. Click Complete.

Expected result: Speed/replay buttons are visible UI controls; Complete awards coins and adds shadowing time.

## Goals

### Create Language Goal

1. Open My Goals.
2. Click Create Goal.
3. Fill title, type, target, due date, and visibility.
4. Leave Global goal unchecked.
5. Submit.

Expected result: New language-specific goal appears and awards coins.

### Create Global Goal

1. Open My Goals.
2. Click Create Goal.
3. Fill all required fields.
4. Check Global goal.
5. Submit.

Expected result: New goal appears under Global Goals.

### Edit Goal

1. Click Edit on an existing goal.
2. Change title, target, due date, and visibility.
3. Save.

Expected result: Goal updates persist after refresh.

### Goal Supporters

1. Find a global goal with coins received.
2. Open the supporters modal.
3. Click a supporter.

Expected result: Modal lists supporters and clicking a supporter opens that learner profile.

## Wallet

### Wallet Summary and History

1. Open My Wallet.
2. Confirm current balance, lifetime earned, lifetime spent, and weekly earned.
3. Review transaction history.
4. Click How Coins Are Earned.

Expected result: Wallet stats and transaction rows are readable, and coin rules modal lists earning actions.

### Coin Animation

1. Note wallet balance in the top bar.
2. Perform an earning action such as review, shadowing complete, create goal, or create moment.

Expected result: Balance increases and a coin gain animation plays from the action area to the wallet area.

## Profile and Language Profiles

### Edit Account Details

1. Open My Account.
2. Change display name, native language, and bio.
3. Save.
4. Refresh.

Expected result: Profile info persists.

### Upload Profile Picture

1. Open My Account.
2. Choose a JPG, PNG, WebP, or GIF image.
3. Submit Crop & Upload.

Expected result: Crop/upload flow completes and avatar updates.

### Add Language Profile

1. Open My Language Profiles.
2. Click Add Language.
3. Choose a language not already active.
4. Pick level and visibility.
5. Submit.

Expected result: New language profile appears.

### Edit, Switch, and Remove Language Profile

1. Edit a non-current language profile.
2. Change level and visibility.
3. Make it current.
4. Try removing the current language.
5. Make another language current, then remove the previous non-current profile.

Expected result: Current language cannot be removed; non-current profiles can be removed and related language-specific progress is cleaned up.

## Community

### Connect

1. Open Connect.
2. Switch between My Community and New Connects.
3. Open a learner profile.
4. Follow and unfollow the learner.

Expected result: Lists update by tab, learner profile opens, and follow state persists.

### Learner Profile

1. Open another learner's profile.
2. Review bio, languages, native language, stats, latest focus, goals, activity, and moments.
3. Switch between Recent Learning Activity and Moments.

Expected result: Profile data is readable and tabs switch correctly.

### Support a Learner Goal

1. Open another learner's profile.
2. Find Goals You Can Support.
3. Click Support.
4. Enter a coin amount and optional message.
5. Submit.

Expected result: Sender balance decreases, recipient support total increases, and wallet history records the transfer.

### Moments Feed

1. Open Moments.
2. Confirm moment pictures render as thumbnails in feed rows.
3. Click Post a moment.
4. Create a post with type, body, optional sentence/story/goal, and optional picture.
5. Refresh.

Expected result: New moment appears, optional image is thumbnail-sized, and creating a post awards coins.

### Moment Detail

1. Open a moment.
2. Confirm detail page shows larger image if present.
3. Add a comment.
4. Like another user's moment.
5. Send Appreciation to another user's moment.

Expected result: Comments, likes, view counts, and appreciation coin transfers persist.

### My Moments

1. Open My Moments.
2. Confirm only the current user's posts appear.
3. Review view, like, and comment counts.

Expected result: Counts are visible and rows open their moment details.

## Direct Messaging

### Open and Read Messages

1. Click Messages in the app shell.
2. Select a conversation.
3. Confirm unread count decreases after opening.
4. Hide/show contacts on desktop.
5. Test the mobile contacts-to-message flow.

Expected result: Message drawer behaves correctly and read state persists.

### Send Direct Message

1. Log in as one seeded user.
2. Open another learner profile.
3. Click Encourage Message.
4. Send a message.
5. Note sender wallet balance.
6. Log in as the recipient and open Messages.

Expected result: Message appears for both users, sender spends 1 coin, recipient receives 1 coin, and unread counts update.

## Admin Smoke Test

1. Open Admin if available.
2. Confirm stats for sentence packs, stories, coin rules, moderation queue, and goal templates.

Expected result: Admin stats render without broken values.

## Negative and Edge Cases

### Auth Validation

1. Try login with the wrong password.
2. Try signup with a short password.
3. Try signup with an existing seeded email.

Expected result: App shows clear errors and does not log in.

### Wallet Limits

1. Try to unlock a story or support a goal with more coins than available.
2. Try sending appreciation or direct messages from a low-balance account.

Expected result: App prevents or rejects actions that exceed available balance.

### Required Fields

1. Submit forms with missing required fields: signup, login, custom sentence, goal, moment, comments, direct message.

Expected result: Browser validation or app errors prevent incomplete submissions.

### File Upload Validation

1. Try uploading an unsupported profile picture or moment picture file.
2. Try a very large moment picture.

Expected result: App rejects invalid files with a readable error.

## Regression Checklist

- Public pages stay public and do not show Dashboard links.
- Logged-in app routes do not expose public login/signup chrome.
- Wallet balances never become negative.
- Coin transfers create visible wallet history rows.
- Moment feed images stay thumbnail-sized.
- Story detail images and moment detail images remain large enough to inspect.
- Direct message drawer does not become a full page.
- Mobile layout has no overlapping text or controls.
- Refreshing after actions preserves state.

