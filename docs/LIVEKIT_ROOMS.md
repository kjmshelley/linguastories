# LiveKit Voice/Video Rooms API

All `/api/livekit/*` routes require an authenticated LinguaStories user. The frontend receives only a generated LiveKit token and `LIVEKIT_URL`; `LIVEKIT_API_SECRET` is used only by the backend.

## Session Rules

- Sessions are capped at 6 minutes.
- Billing is 1000 coins per started minute, rounded up.
- A user needs at least 1000 coins to join.
- The server creates or resumes a single active session per user, so refreshes and duplicate tabs cannot create duplicate unpaid sessions.
- Leave/end endpoints calculate duration with server time and charge inside a database transaction.

## Endpoints

- `GET /api/livekit/rooms` lists active public rooms plus rooms owned by the user. Query params: `q`, `targetLanguage`, `sourceLanguage`, `cefrLevel`, `roomType`.
- `POST /api/livekit/rooms` creates a focused practice room.
- `GET /api/livekit/rooms/:id` returns room details and participants.
- `POST /api/livekit/rooms/:id/join` checks coins, creates or resumes the active session, and returns `{ livekitUrl, token, room, session, expiresAt }`.
- `POST /api/livekit/rooms/:id/leave` ends the current user's room session and charges coins.
- `POST /api/livekit/sessions/:id/end` is a backup end-session endpoint for mobile clients or reconnect cleanup.

## Manual Billing Checks

- Set a test user's wallet to `0`; `POST /api/livekit/rooms/:id/join` should return an error and create no active session.
- Set the wallet to `999`; joining should still fail with the same minimum-balance guard.
- Set the wallet to `1000`; joining should create one active session and return a LiveKit token payload.
- Leave after roughly 30 seconds; the session should end with `billed_minutes = 1` and `coins_charged = 1000`.
