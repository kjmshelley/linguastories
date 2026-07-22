# Learning settings

Settings use the Phase 5 `SettingsRepository`. `LearningSettingsService` validates every field, applies defaults only to invalid fields, retains the last confirmed value after a write failure, and broadcasts changes through `BroadcastChannel`.

Global record (`globalPreferences`):

- interface language (`system` or `en`)
- reduced motion (`system`, `reduce`, or `no-preference`)
- automatic checks, automatic downloads, and manual-only update policy

Language-pair record (`pairPreferences:<pairKey>`):

- pinyin, translation, and story display
- audio enabled, speed, compatible voice URI, replay, and introduction autoplay
- review session size, in-app reminder badge, reinforcement, typing preference, review audio, and weak priority

Values save immediately. Exercise rules override display settings: pinyin or translations are changed only on instructional/story views, never injected into a scored prompt. Story readers provide temporary view buttons that do not overwrite the saved default.

System interface language uses the browser language only when an actual translation exists and otherwise falls back to English. English is currently the only shipped interface translation. Curriculum source language and interface language remain separate.

Reduced motion can explicitly suppress learning animations or defer to `prefers-reduced-motion`. Controls have visible labels, descriptions, announced toggle state, and mobile-sized targets.

Schema version 1 is embedded in each record. Future format changes should migrate the record before validation. Unknown values currently fall back field-by-field and emit a development warning.
