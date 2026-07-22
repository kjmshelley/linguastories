const assert = require("node:assert/strict");
const test = require("node:test");

async function stateModule() {
  return import("../client/js/learning/state.mjs");
}

async function mockDataModule() {
  return import("../client/js/learning/mock-data.mjs");
}

test("learning UI state sanitizes unsupported persisted values", async () => {
  const { sanitizeLearningUiState } = await stateModule();
  const result = sanitizeLearningUiState({ selectedLanguage: "unknown", downloadStatus: "mystery", downloadProgress: 500 });
  assert.equal(result.selectedLanguage, "");
  assert.equal(result.downloadStatus, "ready");
  assert.equal(result.downloadProgress, 100);
  assert.equal(result.categoryStatusById.hotel, "locked");
});

test("learning UI reducer models selection and download progress", async () => {
  const { initialLearningUiState, reduceLearningUiState } = await stateModule();
  let state = reduceLearningUiState(initialLearningUiState, { type: "SELECT_LANGUAGE", languageId: "zh-TW" });
  state = reduceLearningUiState(state, { type: "SET_DOWNLOAD_STATUS", status: "downloading", progress: 24 });
  assert.equal(state.selectedLanguage, "zh-TW");
  assert.equal(state.downloadStatus, "downloading");
  assert.equal(state.downloadProgress, 24);
});

test("offline preview restores the prior ready state safely", async () => {
  const { initialLearningUiState, reduceLearningUiState } = await stateModule();
  const offline = reduceLearningUiState(initialLearningUiState, { type: "SET_FORCED_OFFLINE", value: true });
  const online = reduceLearningUiState(offline, { type: "SET_FORCED_OFFLINE", value: false });
  assert.equal(offline.forcedOffline, true);
  assert.equal(offline.downloadStatus, "offline");
  assert.equal(online.forcedOffline, false);
  assert.equal(online.downloadStatus, "ready");
});

test("reset returns clean first-launch preview state", async () => {
  const { initialLearningUiState, reduceLearningUiState } = await stateModule();
  const changed = { ...initialLearningUiState, selectedLanguage: "zh-TW", downloadStatus: "complete", downloadProgress: 100 };
  const reset = reduceLearningUiState(changed, { type: "RESET_PREVIEW" });
  assert.equal(reset.selectedLanguage, "");
  assert.equal(reset.downloadStatus, "ready");
  assert.equal(reset.downloadProgress, 0);
});

test("mock category counts match their lesson detail data", async () => {
  const { mockCategories, mockLessons } = await mockDataModule();
  for (const category of mockCategories) {
    const lessons = mockLessons[category.id];
    assert.equal(lessons.length, category.lessonCount, `${category.name} lesson count`);
    assert.ok(lessons.every((lesson) => lesson.words.length === 4 || lesson.words.length === 5), `${category.name} word groups`);
  }
});
