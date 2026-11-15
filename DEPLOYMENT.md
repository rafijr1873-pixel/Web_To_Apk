# Deployment readiness

**Not deployable as a converter yet.** Dockerfile and Compose runtime configurations are deferred until actual API and worker entrypoints exist and can be smoke-tested. Providing containers that only sleep or pretend to build would violate the project requirements.

Target topology: TLS reverse proxy → same-origin frontend/API; separate cookieless preview origin; private database/storage; isolated worker host or microVM pool. API must not mount a Docker socket or execute uploaded build scripts. Build workers receive only scoped job inputs, use bounded ephemeral storage and emit verified artifacts via a restricted channel.

For the present sandbox limitation, use a separate CI/self-hosted Android runner with JDK, licensed Android SDK, pinned Gradle distribution, compatible AGP/Kotlin/WebKit dependencies, apksigner and aapt tooling. Allow controlled download egress only during image provisioning/dependency resolution. Compile offline with resource quotas. Never ship signing credentials in an image or CI artifact.

Release gates: real ZIP→APK integration test, signature and manifest validation, installation and WebView tests on API-min and target devices/emulators, ownership tests, malicious archive fixtures, preview-origin isolation, CSRF/session tests, worker timeout/cleanup/resource tests, backup/restore rehearsal, dependency audit and TLS/security-header verification. No production-ready claim until these are recorded.
