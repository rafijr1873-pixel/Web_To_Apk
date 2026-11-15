# Architecture decision record — Phase 1

Status: architecture baseline, not a working converter. All future-tense requirements below are implementation gates, not claims of implemented controls.

## Boundaries

- `frontend/`: React + TypeScript + Vite + Tailwind + Lucide. API-only access; no signing secrets in browser storage. Nine-step wizard; draft persistence via explicit configuration save with revision conflict handling. Session state in memory; no auth tokens in localStorage.
- `backend/`: Express + TypeScript, REST, session authentication, authorization, streaming archive ingestion, asset service, project service, queue coordinator, authenticated SSE. Never invokes Gradle or serves uploaded active content on its own origin.
- `shared/`: executable strict Zod configuration and build transition contracts. DTO schemas, not database or filesystem access.
- `database/`: SQLite WAL, foreign keys, numbered migrations; production multi-instance deployment requires PostgreSQL migration and concurrency tests before support can be claimed. SQLite only supports a single coordinator initially.
- `android-engine/`: deterministic Kotlin/manifest/Gradle generation from validated configuration and immutable website asset. Escape XML and Kotlin separately; never interpolate credentials into generated source or command strings.
- `build-worker/`: isolated build execution, lifecycle leases, sanitized events, signing and verification, artifact publication. Not co-located with API privileges.
- `tests/`: contract, migration, later API/UI/archive/generator/build/device suites.
- `scripts/`: diagnostics and later migration, cleanup and deployment tooling.

## Data and consistency

UUID IDs; UTC timestamps. Assets and APKs live outside SQL under server-generated storage keys; never use upload filenames as paths. Each build snapshots configuration and website asset ID. Changes to a project cannot alter an in-flight build. Owner checks must traverse project ownership for every build/asset/event access; credential references must belong to the same owner. UUID secrecy is not authorization.

Project writes use revision compare-and-swap; conflicts return 409, not silent overwrite. Deletes soft-delete projects and cancel queued work; active workers must terminate before files are removed. Artifact deletion retains history metadata but removes download access. Duplicate copies configuration and immutable asset references with reference-count-safe cleanup; never copy signing credentials to another owner.

Queue claims use a short atomic transaction and worker lease. Single build per worker; bounded queue per account. Expired leases fail interrupted builds (no implicit rebuild with secret reuse). Idempotency key is unique per project. Events have monotonic per-build sequence IDs and support SSE replay. No percentage invented from elapsed time. Upload/extraction are asset-processing events, not fake Gradle stages.

## Upload and preview boundary

Stream upload to a private random directory with a compressed-byte cap. Enforce entry count, actual expanded-byte count, per-file size, ratio, depth and wall-clock limits during extraction, not just ZIP directory metadata. Reject absolute/drive/UNC paths, backslashes, NUL, dot segments, duplicate normalized paths, symlinks, encrypted entries and unsupported compression. Reject malformed central/local header mismatch and CRC errors. Use exclusive file creation and canonical containment checks. Never execute archive scripts server-side.

Find `index.html` at archive root or a single nested website root. Multiple candidate roots require user selection; missing entry point is an actionable validation error. Preserve relative asset paths. Preview is served on a dedicated cookieless origin with a short-lived project-scoped token and iframe sandbox allowing scripts but not same-origin, navigation, popups, forms or downloads by default. CSP blocks external network access. Do not reuse the authenticated API origin for HTML preview.

## Android contracts and important compatibility limits

Package Name and Application ID are one canonical field (`identity.applicationId`); avoid two conflicting identifiers. Minimum planned runtime API 26; proposed SDK range 35–36 is validation policy only, NOT a verified toolchain. Exact AGP/Kotlin/Gradle/JDK/AndroidX versions will be selected from upstream compatibility documentation, pinned and tested at phase 4. Do not invent pins while their repositories cannot be reached.

WebView uses HTTPS `appassets.androidplatform.net` via WebViewAssetLoader; file/content access off, no unrestricted JavaScript bridge. Runtime permission requests require native consent and origin/resource checks. Location, camera, microphone disabled unless opted in. Denial must resolve pending callbacks. Use system document picker for uploads, scoped storage for downloads, URI scheme allowlists and explicit external intent handling. Safe browsing cannot be disabled by configuration. No always-allow mixed-content option.

WebSQL/databaseStorage is deprecated and may be unavailable in installed WebView; display a capability warning and do not promise persistence. Orientation lock and system bar colors/visibility are subject to OS policies, edge-to-edge enforcement and large-screen overrides. Splash duration cannot override mandatory Android splash rules; custom image/duration applies to an in-app loading surface. A pure WebView app has no application native libraries: ABI choice generally does not change APK code; do not claim smaller ARM-specific output without measured native payload. Resource shrinking depends on R8; ProGuard rules configure R8, not a separate optimizer. Deep-link verification requires domain-hosted assetlinks.json and signing certificate; no false verified-domain claims.

Every UI option must have a generator mapping and an automated test before it is enabled in the UI. Schema acceptance alone is not feature implementation.

## Build lifecycle

Validate → generate → resolve → compile → sign → verify → publish. Gradle is invoked using argv arrays, never shell interpolation. Debug signing is verified too. Release signing uses dedicated transient credential mounts and a signing process that reads secrets without CLI arguments/logging; fail closed if unavailable. Verify with apksigner and aapt tooling: non-empty valid ZIP, expected manifest identity/version/SDK, signature and certificate, digest and size. Publish atomically only after verification.

Worker: non-root, read-only rootfs, no host Docker socket, no host home, ephemeral per-job volume, capability drop, no-new-privileges, PID/memory/CPU/disk limits, timeout and full process-tree cancellation. Separate restricted dependency-fetch phase from offline compilation; verified dependency cache cannot contain project credentials. Do not accept user Gradle scripts, plugins, manifest fragments, native code or arbitrary dependency coordinates. API can submit declarative jobs only. Container isolation must be tested on the target host; stronger multi-tenant deployments should use microVMs.

Secrets: encrypted envelope storage for keystore passwords (AEAD, unique nonce, versioned key from secret manager), restrictive keystore file permissions, no plaintext SQL or generated gradle.properties, no secret logging. Decrypt only inside an authorized signing task. Scrubbing logs is defense in depth, not permission to log command environments.

## Phase gates

1. Architecture: strict schemas, migration constraints, API contract, threat boundaries, environment report. Verify with typecheck + contract/migration tests.
2. Frontend: accessible responsive shell and wizard; API integration tests against an actual test server before claiming operational features. No fabricated statistics or builds.
3. Backend: auth/CSRF/ownership, archive abuse tests, CRUD, transactions, draft conflicts, queue/recovery, upload limits and cleanup tests.
4. Android: pinned toolchain, generator mappings, real Gradle compilation, APK signature/manifest verification, Android runtime tests.
5. Integration: authenticated SSE replay, cancellation, artifact authorization, actual ZIP→APK happy and failure paths.
6. Release: isolated worker resource/escape checks, device or emulator coverage, secret audit, deployment smoke tests and backup/restore drill.

Phase 1 contract tests do not satisfy phase 3–6 acceptance criteria.
