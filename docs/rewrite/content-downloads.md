# Curriculum downloads

The production manifest advertises a category-package strategy. Traditional Chinese version 1.0.0 contains 113 independently addressable category JSON packages. The browser fetches at most four concurrently from immutable, version-qualified routes. Individually verified categories may be retained with a non-active `staged` marker so an interrupted retry can reuse them; no staged record is visible to Learn or the lesson engine.

The download lifecycle is `preparing` → `downloading`/`updating` → `validating_checksum` → `validating_schema` → `saving` → `installed`. Jobs persist byte counts, requested version, retry count, validation state, timestamps, and safe error codes. Progress uses the manifest's aggregate byte count; when a trustworthy total is absent the UI shows stages and bytes without inventing a percentage.

Each response is read as bytes and checked with SHA-256 against its manifest descriptor before JSON parsing. Parsed data must match schema and content versions, language identity, category identity, stable-ID uniqueness, required word fields, exercise contracts, and all category/lesson references. Invalid bytes, JSON, schema, server responses, cancellation, or quota errors produce no active package.

Only after all category packages validate does one read-write transaction promote category records and write the package pointer. A previous active package becomes `previous` in that same transaction. If any write fails, IndexedDB aborts the transaction and the old active version remains untouched. The selected-language startup hint is written only after the install commits. Retry rechecks staged content's schema and canonical local checksum before reuse.

Before downloading, the quota adapter uses `navigator.storage.estimate()` and requires headroom above the declared size. It may request persistent storage where supported. Browsers can still raise `QuotaExceededError` during commit; that path is treated as a storage failure and remains atomic. Cancellation aborts active fetches and records an interrupted job suitable for a manual retry.
