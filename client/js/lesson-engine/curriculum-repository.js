const categoryCache = new Map();
const pending = new Map();
let localContentRepository = null;

export function configureCurriculumRepository(repository) { localContentRepository = repository; }

function validateBundle(bundle, slug) {
  if (!bundle || bundle.schemaVersion !== "1.0.0" || !bundle.curriculumVersion) throw new Error("This curriculum version is not supported.");
  const category = bundle.categories?.[0];
  if (!category || category.slug !== slug) throw new Error("The category package is incomplete.");
  const lessonIds = new Set((bundle.lessons || []).map((lesson) => lesson.id));
  if (!category.lessonIds.every((id) => lessonIds.has(id))) throw new Error("The category contains broken lesson references.");
  const exerciseIds = new Set((bundle.exercises || []).map((exercise) => exercise.id));
  if ((bundle.lessons || []).some((lesson) => !lesson.exerciseIds.every((id) => exerciseIds.has(id)))) throw new Error("The category contains broken exercise references.");
  return bundle;
}

export function cachedCategory(slug) {
  return categoryCache.get(slug) || null;
}

export function primeCategoryCache(slug, bundle) {
  categoryCache.set(slug, validateBundle(bundle, slug));
  return bundle;
}

export async function loadCategory(slug, fetchImpl = (...args) => globalThis.fetch(...args)) {
  if (categoryCache.has(slug)) return categoryCache.get(slug);
  if (pending.has(slug)) return pending.get(slug);
  const request = (localContentRepository ? localContentRepository.getCategory(slug).then((bundle) => {
    if (!bundle) throw new Error("Download this curriculum before opening lessons offline.");
    const validated = validateBundle(bundle, slug);
    categoryCache.set(slug, validated);
    return validated;
  }) : fetchImpl(`/api/content/zh-TW/en/categories/${encodeURIComponent(slug)}`, { headers: { Accept: "application/json" } })
    .then(async (response) => {
      if (!response.ok) throw new Error(response.status === 404 ? "This category is not available." : "The lesson content could not be loaded.");
      const bundle = validateBundle(await response.json(), slug);
      categoryCache.set(slug, bundle);
      return bundle;
    })).finally(() => pending.delete(slug));
  pending.set(slug, request);
  return request;
}

export function clearCurriculumCache(slug = null) { if (slug) { categoryCache.delete(slug); pending.delete(slug); } else { categoryCache.clear(); pending.clear(); } }
