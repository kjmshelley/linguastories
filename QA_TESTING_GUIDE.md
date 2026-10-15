# LinguaStories QA Testing Guide

## Local setup

1. Apply the database schema with `npm run db:schema`.
2. Start the app with `npm run dev`.
3. Open `http://localhost:3000`.

The seeded local account is `demo@linguastories.local` with password `Juy90n1!`.

## Core smoke test

1. Confirm the landing page describes short lessons, the learning path, review, progress, and offline use.
2. Create an account or log in.
3. Confirm authentication opens `/app/languages` when no course is installed.
4. Download the course and verify visible progress through download, verification, and installation.
5. Confirm successful installation opens `/app/learn`.
6. Open the first available category and lesson.
7. Complete each exercise type and verify feedback, progress, and results.
8. Refresh during a lesson and verify the resumable session.
9. Complete a lesson perfectly and confirm the next lesson unlocks.
10. Open Review, Progress, Story Reader, and Settings.
11. Log out and confirm `/app/*` routes require authentication.

## Offline and update checks

- Reload with the network disabled and confirm installed lessons remain available.
- Confirm a first-time download is blocked offline with a visible explanation.
- Check for updates and confirm existing installed content remains usable on failure.
- Cancel a download and confirm Retry resumes safely.
- Run content-health verification and confirm repair preserves learning progress.

## Responsive and accessibility checks

- Test at desktop and 390px mobile widths.
- Confirm there is no horizontal overflow.
- Navigate primary controls by keyboard.
- Confirm focus moves to new page headings and feedback uses live regions.
- Enable reduced motion and verify nonessential transitions stop.

## Automated verification

Run `npm test`. The suite covers curriculum generation, offline installation, lesson sessions, progress, spaced review, settings, content migration, and focused route contracts.
