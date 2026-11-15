# Forge — Web to APK workspace

A responsive React + TypeScript + Vite + Tailwind dashboard with Lucide icons.

## Run the website

```sh
npm ci
npm run dev -- --port 5173
```

Open the URL shown by Vite. The server binds to `0.0.0.0` and permits the Arena preview domain.

```sh
npm run build       # production assets in frontend/dist
npm run preview -- --port 5173
npm run check       # frontend/shared typecheck and automated tests
python3 -m unittest discover -s tests -p '*_test.py' -v
npm run doctor      # nonzero if Android prerequisites are absent
```

## Working today

- Responsive dark dashboard and six navigation views.
- Local project create, edit, duplicate, delete and search.
- Nine-step configuration editor using shared Zod validation.
- Browser-local draft persistence and configuration JSON export.
- ZIP selection / drag-and-drop, entry point detection and file tree.
- Sandboxed static HTML/CSS/image preview with scripts and external network disabled.
- Honest unavailable states for build history and Android build worker.

## Important limitations

This is a functional **local web editor**, not a completed APK converter. Drafts live in localStorage, not a backend database; ZIPs are not persisted or uploaded. Local preview is limited to 10 MB / 1,000 entries, does not execute JavaScript, and is not a hardened malicious-archive processing service. Do not open untrusted archives. Icon/custom asset uploads, deep-link editing, authentication, backend routes, signing and Android project generation are not implemented yet. Build settings are saved configuration, not operational Android capabilities.

Java, Android SDK, Gradle, ADB and Docker were absent in the sandbox. Android dependency hosts were unreachable. No real APK build, verification, installation or runtime test has been performed. No simulated successful builds or artifacts are provided.

## Architecture foundation

`shared/` contains strict configuration/build contracts; `database/migrations/` contains a tested initial SQLite schema. Backend/engine/worker folders mark future service boundaries, not implemented services.

See [architecture](docs/ARCHITECTURE.md), [API contract](API.md), [security](SECURITY.md), [deployment](DEPLOYMENT.md), and [verification](docs/VERIFICATION.md).
