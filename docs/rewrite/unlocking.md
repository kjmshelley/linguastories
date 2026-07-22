# Sequential unlocking

## Source of truth

Unlocking uses explicit curriculum fields, never array position:

- category: `prerequisiteCategoryId`, `required`
- lesson: `prerequisiteLessonId`, `required`

Version 1.1.0 of the generated Traditional Chinese curriculum contains these fields for all 113 categories and 484 lessons. Category fragments retain their predecessor category ID even though that predecessor lives in a different package. The manifest repeats the category-level fields so the Learn screen can derive the full path without downloading every category body.

## Rules

An entity is available when it is already historically complete, has no prerequisite, or its explicit prerequisite is historically complete. A failed attempt never satisfies a prerequisite. Completing every required lesson in a category completes that category and unlocks its explicit successor. Optional future entities can be excluded by `required: false` without changing stable identity.

The validator rejects missing prerequisite IDs, cycles, and chains without a root in full curriculum/manifest documents. Browser-side validation fails closed: an invalid chain yields no access map and direct lesson navigation reports an error.

## Enforcement surfaces

Learn cards, category lesson cards, Continue targeting, and direct lesson routes all use the same derived state. Locked cards have no navigable action. Direct URL access is checked again by `ProgressRuntime.prepareLesson`, first at the category level and then at the lesson level, so editing a URL cannot bypass the UI.

Continue priority is: resumable lesson in an accessible category, most recent unfinished failed lesson in an accessible category, next available incomplete category, then course complete. Old saved sessions in currently locked categories are ignored.

