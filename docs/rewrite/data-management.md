# Content and data management

Settings reports installed/available versions, schema, download size when the manifest supplies it, last check, offline availability, and content health. Update checks never replace a valid active course. Pending updates wait until both lessons and reviews are closed.

Content health verifies the active package, category count, stored schema, and local checksums. Repair reuses the validated Phase 5 download pipeline and preserves settings, progress, attempts, and review history. It is not implemented as an application reset.

Removing downloaded content deletes curriculum packages and download jobs for the active pair. It preserves progress and settings and is blocked during an active lesson or review.

Reset scopes:

- **Current language progress:** deletes progress, attempts, item performance, activity, review data, leases, migrations, sync placeholders, and lesson sessions for the current pair. Content and settings remain.
- **All progress:** applies the same scoped deletion to every pair discovered in local learning records. Downloads and settings remain.
- **Application learning data:** clears every learning IndexedDB store and learning startup keys. It is an advanced action, uses a typed confirmation, is blocked by active learning, and returns to first-launch language selection.

Reset operations do not affect the existing community/account backend. Export and import were deferred: no control is exposed because a versioned, bounded, fully validated interchange format is not yet implemented.

The update policy does not claim Wi-Fi detection; browsers do not expose that reliably. Automatic downloads mean any available connection unless the user selects manual-only updates.
