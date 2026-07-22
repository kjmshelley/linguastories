# Offline behavior

With a healthy installed package, startup reads the selected language pair and active curriculum from IndexedDB, renders Learn, and shows a subtle offline indicator. Category and lesson routes read through `ContentRepository`; lesson sessions continue to persist in IndexedDB. Local Settings actions remain available. Download, update, and repair actions require a successful server request and never queue fake work.

Without installed content, offline startup remains on language selection and explains that the course must first be downloaded. Connectivity events are hints: failed, timed-out, invalid, or captive-portal-like responses are still handled as request failures. Automatic checks use a 30-minute minimum interval; manual checks bypass it. There is no tight retry loop.

The repository has no existing service worker. Phase 5 therefore does not add a second large curriculum cache or risk version-unaware stale packages. IndexedDB exclusively owns curriculum data. A separately reviewed, small, versioned application-shell service worker would be required to guarantee a completely cold offline launch on a browser that has discarded normal HTTP cache entries. During an already loaded or normally cached shell session, the installed curriculum and lesson engine operate without network access.

Offline availability is per browser profile and origin. Private browsing, user storage clearing, eviction, or browser quota policy can remove data. `navigator.storage.persist()` is best-effort and not a durability guarantee.

