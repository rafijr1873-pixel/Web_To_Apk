# Installation

Use Node.js 22 and npm. From repository root:

```sh
npm ci
npm run dev -- --port 5173
npm run build
npm run check
python3 -m unittest discover -s tests -p '*_test.py' -v
```

`npm run dev` starts the local web editor. `npm run preview -- --port 5173` serves the production bundle after build. No API server is implemented. `.env.example` documents planned backend configuration, not loaded by the editor.

Drafts are stored in browser localStorage. ZIP preview is ephemeral and static; export configuration JSON for backups. Do not use untrusted archives with the local inspection feature.

Run `npm run doctor` for local Android prerequisites. Real builds still require an isolated runner with a qualified JDK/Gradle/AGP/Kotlin/SDK matrix and dependency access; none is claimed tested here. The SQL migration is tested in an in-memory database; application migration runner and PostgreSQL support are not implemented yet.
