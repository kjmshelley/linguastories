# Content versioning and updates

App, schema, and curriculum versions are separate. Semantic curriculum versions decide update ordering; `minimumAppVersion` and supported schema versions decide compatibility. The manifest also permits migration metadata for compatible versions, replaced/deprecated/merged/split stable IDs, review reset, and lesson restart. Phase 5 exposes this compatibility contract but never resets progress.

Startup opens cached content first. A manifest check happens afterward when enabled, so valid offline content does not wait on the network. Checks also occur on a throttled foreground return, network return, and explicit Settings action. The default policy checks automatically and notifies; automatic downloads are opt-in. Manual-only, automatic checks, automatic downloads, and connection-policy preferences are stored in IndexedDB. Browser network-type signals cannot guarantee Wi-Fi-only behavior, so the UI describes that limitation as a preference rather than a guarantee.

Manifest requests use ETag/Last-Modified conditionals and a timeout. A 304 reuses the validated record. Invalid or unavailable network manifests never overwrite the last valid manifest. Version-qualified category responses are immutable; unqualified current routes must revalidate.

An update downloaded during a lesson is stored as `pending_activation`. The active lesson continues with its starting bundle, deterministic exercise order, and session curriculum version. Activation occurs only after the lesson controller is destroyed. Resuming first attempts to load the saved session's original retained version; if it is gone, the session is not interpreted against new content and the learner receives a safe restart explanation.

Retention keeps the active version, one newest previous version, any pending version, and every version referenced by a saved session. Other versions are removed after activation. Stable IDs preserve future progress across renames or moves; new IDs begin untouched and removed IDs may remain historical.

