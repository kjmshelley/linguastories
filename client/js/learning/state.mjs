const STORAGE_KEY = "linguaStoriesLearningUiV1";

export const DOWNLOAD_STATUSES = [
  "ready",
  "downloading",
  "failed",
  "offline",
  "validating",
  "complete",
  "update_available",
  "updating"
];

export const initialLearningUiState = Object.freeze({
  selectedLanguage: "",
  downloadStatus: "ready",
  downloadProgress: 0,
  currentCategoryId: "traveling",
  currentLessonId: "traveling-2",
  lessonPreviewStep: "word",
  forcedOffline: false,
  categoryStatusById: {
    introduction: "review_due",
    occupation: "completed",
    traveling: "in_progress",
    airport: "available",
    hotel: "locked",
    restaurant: "locked"
  },
  lessonStatusById: {
    "introduction-1": "completed",
    "introduction-2": "in_progress",
    "introduction-3": "available",
    "introduction-4": "locked",
    "traveling-1": "completed",
    "traveling-2": "in_progress",
    "traveling-3": "available"
  },
  completedLessonIds: ["introduction-1", "occupation-1", "occupation-2", "traveling-1"]
});

export function sanitizeLearningUiState(value = {}) {
  const status = DOWNLOAD_STATUSES.includes(value.downloadStatus) ? value.downloadStatus : initialLearningUiState.downloadStatus;
  const progress = Math.max(0, Math.min(100, Number(value.downloadProgress) || 0));
  return {
    ...initialLearningUiState,
    ...value,
    selectedLanguage: value.selectedLanguage === "zh-TW" ? "zh-TW" : "",
    downloadStatus: status,
    downloadProgress: progress,
    forcedOffline: Boolean(value.forcedOffline),
    categoryStatusById: value.categoryStatusById && typeof value.categoryStatusById === "object" ? { ...initialLearningUiState.categoryStatusById, ...value.categoryStatusById } : { ...initialLearningUiState.categoryStatusById },
    lessonStatusById: value.lessonStatusById && typeof value.lessonStatusById === "object" ? { ...initialLearningUiState.lessonStatusById, ...value.lessonStatusById } : { ...initialLearningUiState.lessonStatusById },
    completedLessonIds: Array.isArray(value.completedLessonIds) ? value.completedLessonIds.map(String).slice(0, 100) : [...initialLearningUiState.completedLessonIds]
  };
}

export function reduceLearningUiState(state, action = {}) {
  const current = sanitizeLearningUiState(state);
  switch (action.type) {
    case "SELECT_LANGUAGE":
      return { ...current, selectedLanguage: action.languageId === "zh-TW" ? "zh-TW" : "" };
    case "SET_DOWNLOAD_STATUS":
      return sanitizeLearningUiState({
        ...current,
        downloadStatus: action.status,
        downloadProgress: action.progress ?? current.downloadProgress
      });
    case "SET_DOWNLOAD_PROGRESS":
      return sanitizeLearningUiState({ ...current, downloadProgress: action.progress });
    case "SET_CURRENT_CATEGORY":
      return { ...current, currentCategoryId: String(action.categoryId || current.currentCategoryId) };
    case "SET_CURRENT_LESSON":
      return { ...current, currentLessonId: String(action.lessonId || current.currentLessonId) };
    case "SET_LESSON_PREVIEW_STEP":
      return { ...current, lessonPreviewStep: String(action.step || "word") };
    case "SET_FORCED_OFFLINE":
      return {
        ...current,
        forcedOffline: Boolean(action.value),
        downloadStatus: action.value ? "offline" : current.downloadStatus === "offline" ? "ready" : current.downloadStatus
      };
    case "RESET_PREVIEW":
      return { ...initialLearningUiState };
    default:
      return current;
  }
}

export function loadLearningUiState(storage = globalThis.localStorage) {
  try {
    return sanitizeLearningUiState(JSON.parse(storage?.getItem(STORAGE_KEY) || "{}"));
  } catch (_error) {
    return { ...initialLearningUiState };
  }
}

export function saveLearningUiState(state, storage = globalThis.localStorage) {
  const safeState = sanitizeLearningUiState(state);
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(safeState));
  } catch (_error) {
    // The visual preview remains usable when storage is unavailable.
  }
  return safeState;
}
