export const SESSION_SCHEMA_VERSION = 3;
export const INACTIVITY_LIMIT_MS = 60_000;

export function createLessonSession({ lessonId, categorySlug, curriculumVersion, sequence, attemptId, sessionId, attempt = 1, now = Date.now() }) {
  return {
    schemaVersion: SESSION_SCHEMA_VERSION,
    curriculumVersion,
    lessonId,
    categorySlug,
    attemptId,
    sessionId,
    attempt,
    seed: `${lessonId}:attempt:${attempt}`,
    status: "intro",
    cursor: 0,
    sequenceIds: sequence.map((item) => item.id),
    answers: {},
    results: {},
    failed: false,
    activeMs: 0,
    startedAt: now,
    activeSince: null,
    lastActivityAt: now,
    updatedAt: now
  };
}

export function isRestorableSession(value, { lessonId, curriculumVersion, sequence }) {
  return Boolean(value && [2, SESSION_SCHEMA_VERSION].includes(value.schemaVersion) && value.lessonId === lessonId && value.curriculumVersion === curriculumVersion &&
    Array.isArray(value.sequenceIds) && value.sequenceIds.length === sequence.length && value.sequenceIds.every((id, index) => id === sequence[index].id) &&
    Number.isInteger(value.cursor) && value.cursor >= 0 && value.cursor < sequence.length);
}

export function upgradeLessonSession(value, { attemptId, sessionId, attempt, now = Date.now() }) {
  return {
    ...value,
    schemaVersion: SESSION_SCHEMA_VERSION,
    attemptId,
    sessionId,
    attempt,
    startedAt: value.startedAt || value.updatedAt || now,
    updatedAt: now
  };
}

function accrueActive(state, now) {
  if (!state.activeSince) return state;
  const elapsed = Math.max(0, Math.min(INACTIVITY_LIMIT_MS, now - state.activeSince));
  return { ...state, activeMs: state.activeMs + elapsed, activeSince: null };
}

export function reduceLessonSession(state, action) {
  const now = Number(action.now || Date.now());
  switch (action.type) {
    case "START":
      return { ...state, status: "active", activeSince: now, lastActivityAt: now, updatedAt: now };
    case "RESUME":
      return { ...state, status: state.pausedFrom === "feedback" ? "feedback" : "active", pausedFrom: null, activeSince: state.pausedFrom === "feedback" ? null : now, lastActivityAt: now, updatedAt: now };
    case "ACTIVITY": {
      const elapsed = state.activeSince ? Math.max(0, Math.min(INACTIVITY_LIMIT_MS, now - state.activeSince)) : 0;
      return { ...state, activeMs: state.activeMs + elapsed, activeSince: now, lastActivityAt: now, updatedAt: now };
    }
    case "SET_ANSWER":
      if (state.status !== "active" || state.results[state.sequenceIds[state.cursor]]) return state;
      return { ...state, answers: { ...state.answers, [state.sequenceIds[state.cursor]]: action.answer }, lastActivityAt: now, updatedAt: now };
    case "SUBMIT": {
      const id = state.sequenceIds[state.cursor];
      if (state.status !== "active" || state.results[id]) return state;
      const paused = accrueActive(state, now);
      return { ...paused, status: "feedback", results: { ...state.results, [id]: action.result }, failed: state.failed || !action.result.correct, updatedAt: now };
    }
    case "CONTINUE": {
      if (state.status !== "feedback") return state;
      const nextCursor = state.cursor + 1;
      if (nextCursor >= state.sequenceIds.length) return { ...state, status: "results", activeSince: null, updatedAt: now };
      return { ...state, cursor: nextCursor, status: "active", activeSince: now, lastActivityAt: now, updatedAt: now };
    }
    case "PAUSE":
      return { ...accrueActive(state, now), status: state.status === "results" ? "results" : "paused", pausedFrom: state.status, updatedAt: now };
    case "RETRY":
      return action.session;
    default:
      return state;
  }
}

export function sessionSummary(session) {
  const scored = Object.values(session.results).filter((result) => !result.instructional);
  const correct = scored.filter((result) => result.correct).length;
  return { scored: scored.length, correct, perfect: !session.failed && scored.length > 0, activeMs: session.activeMs, attempt: session.attempt };
}
