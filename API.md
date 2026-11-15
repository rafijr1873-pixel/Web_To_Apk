# REST contract v1 (design, not implemented routes)

Base `/api`. JSON except multipart upload, SSE and APK downloads. UTC ISO8601 timestamps; UUID identifiers; list responses `{items, nextCursor}` with opaque cursor and limit 1–100. Same-origin HttpOnly Secure SameSite=Lax sessions; all mutations require an `X-CSRF-Token` bound to the session plus Origin validation. Every project, build, credential and asset endpoint requires owner authorization. Missing and unowned resources both return 404.

Error envelope: `{"error":{"code":"VALIDATION_FAILED","message":"Invalid configuration","requestId":"…","details":[{"path":"build.targetSdk","message":"…"}]}}`. Never expose stack traces, filesystem paths or secrets. Statuses: 400 malformed, 401 unauthenticated, 403 CSRF, 404 not found, 409 conflict, 413 too large, 415 wrong media, 422 validation, 429 quota/rate limit, 503 worker unavailable.

| Method | Route | Input | Success |
|---|---|---|---|
| POST | /auth/register | email, password | 201 user + session; deployment may disable registration |
| POST | /auth/login | email, password | 200 user + rotated session |
| GET | /auth/session | — | 200 user, CSRF token |
| POST | /auth/logout | — | 204 revoke session |
| GET | /dashboard | — | 200 owned project count, completed/failed counts, recent projects/builds from SQL |
| POST | /projects | name | 201 project + default configuration |
| GET | /projects | q, status, cursor, limit | 200 owned projects |
| GET | /projects/:id | — | 200 project, revision, asset metadata |
| PATCH | /projects/:id | name, expectedRevision | 200 updated project |
| DELETE | /projects/:id | — | 202 cancellation/cleanup scheduled |
| POST | /projects/:id/duplicate | name | 201 independent project |
| POST | /projects/:id/upload | multipart `file` ZIP | 202 asset ingestion ID |
| GET | /projects/:id/assets/:assetId | — | 200 ingestion state, tree, root candidates, error |
| POST | /projects/:id/preview | websiteAssetId, root (if ambiguous) | 201 short-lived isolated preview URL |
| POST | /projects/:id/assets | multipart file + kind | 201 validated image/HTML asset |
| PUT | /projects/:id/configuration | configuration, expectedRevision | 200 persisted configuration and new revision |
| POST | /projects/:id/build | websiteAssetId; Idempotency-Key header | 202 build ID + state; 200 on idempotent replay |
| GET | /projects/:id/builds | cursor, limit | 200 history |
| GET | /builds/:buildId | — | 200 state, snapshot, timings, artifact metadata or failure reason/remediation |
| GET | /builds/:buildId/logs | Last-Event-ID header | 200 text/event-stream; event ID sequence, state + sanitized message |
| POST | /builds/:buildId/cancel | — | 202 cancellation requested |
| GET | /builds/:buildId/download | — | 200 verified APK attachment; 409 if unfinished; 410 if removed |
| DELETE | /builds/:buildId | — | 202 artifact cleanup; retain history |
| POST | /signing-credentials | multipart keystore OR generation request, alias, passwords | 201 credential ID + certificate fingerprint only |
| DELETE | /signing-credentials/:id | — | 204; 409 if an active build uses it |
| GET | /capabilities | — | 200 qualified toolchain, supported options, worker health; unavailable capabilities disabled |
| GET | /health/ready | — | 200 ready / 503 degraded (no secrets) |

Configuration schema: `shared/src/configuration.ts`. Asset references and credential UUIDs require DB ownership and MIME/content verification beyond Zod. Build snapshots reject missing website roots. Display and WebView capability checks are additional server validation, not optional frontend checks.

Uploads report actual browser byte progress followed by server extraction events. Build SSE sends real persisted lifecycle events, heartbeat comments and replay by sequence, never synthetic percentages. Limit event retention and client connections; terminate on session expiration. Set `Cache-Control: no-store` on auth/signing/config and SSE responses. SSE uses session cookies, not bearer tokens in query strings.
