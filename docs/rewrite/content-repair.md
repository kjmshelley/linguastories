# Content health, repair, and removal

Startup health checks verify that an active package exists, its category count is complete, stored schema markers are valid, and each category's canonical local SHA-256 still matches. Incomplete job remnants are reported without activating partial files. Database-open or migration failure prevents use of the offline repository and presents a storage-specific failure rather than deleting the database.

If active content is corrupt, the health service marks it unusable and attempts rollback to the newest previous package. If no valid fallback exists, Learn is gated and the language card offers Repair. Repair fetches the current validated manifest and redownloads the package while preserving settings, reserved progress records, review records, and sessions. It does not reset the whole database.

Removing downloaded content is a separate confirmed Settings action. It is blocked while a lesson is active, removes all curriculum versions and obsolete download jobs for that language pair, preserves progress/settings, clears only the startup selection hint, and returns to language selection. Reset Progress and Reset Application Data are intentionally not implemented in Phase 5.

Operational error codes distinguish unavailable storage, insufficient quota, cancellation, checksum mismatch, invalid JSON/schema, unsupported app/schema versions, server failure, missing pending versions, active-lesson protection, and local corruption. User messages avoid exposing raw package contents or sensitive data; structured logging is dependency-injected and disabled by default.
