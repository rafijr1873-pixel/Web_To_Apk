# Security plan and current scope

This branch currently implements schema validation and SQL constraints only. Authentication, ZIP extraction, permission handling, secret encryption, sandboxing and API headers are design requirements, **not implemented security controls**. Do not expose this foundation as a public service.

Required controls before release:

- Passwords hashed using a tuned memory-hard password KDF; random session tokens stored hashed, expiry/rotation/revocation, constant-time comparison, login throttling and generic login errors.
- Owner-scoped queries for every resource; request-level CSRF tokens and Origin checks for cookie-authenticated mutation routes; strict CORS allowlist.
- Helmet-equivalent headers and route-specific CSP; uploaded HTML never served from API origin. Preview tokens narrowly scoped and short-lived, with no ambient credentials.
- Streaming archive caps, path containment, link/type rejection, CRC checks and cleanup even on disconnect. No execution of uploaded scripts server-side.
- Signing secrets encrypted with authenticated encryption; master keys external to database/repository; no secrets in shell argv, logs, environment dumps or plaintext config.
- Worker separation, dependency allowlists, offline compile phase, process-tree timeout, resource quotas, private temporary files and verified output checks.
- Downloads resolve opaque IDs to owned server-generated keys and use attachment headers, no user path input. Retention jobs reconcile database state and filesystem references safely.

Report vulnerabilities privately to the repository maintainer. Do not attach keystores, passwords, session tokens or real customer website archives to public issues.
