# Phase 8 manual test checklist

Automated coverage verifies settings validation/isolation/write failure, streak rules, weak ranking, combined activity, voice fallback, integrity reporting, and direct routes. The browser checklist is:

1. Progress: new, partially complete, review-due, weak-item, and fully complete states; open category detail and reopen a story without changing metrics.
2. Settings: reload each saved value; open a second tab and confirm safe settings update; keep an active lesson/review open while a content update waits.
3. Display: verify pinyin/translation modes on instruction and story screens and confirm scored answers remain hidden.
4. Audio: choose a `zh-TW` voice, change speed, test it, then remove the saved voice and verify Chinese/automatic fallback.
5. Offline: load Progress, Settings, category detail, story, lessons, and due reviews from installed content; verify update checks explain the network requirement.
6. Data: repair while preserving progress; remove content while preserving progress; reset current progress while preserving content/settings; reset all progress with typed confirmation; reset application data in a disposable profile and confirm first launch.
7. Responsive/accessibility: 320 px, tablet, and desktop layouts; keyboard controls; visible focus; screen-reader labels; modal focus; reduced motion; high zoom.

No destructive reset should be exercised against a non-disposable browser profile during review.
