PRAGMA foreign_keys = ON;
BEGIN;
CREATE TABLE users (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE sessions (
 id_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 csrf_hash TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE signing_credentials (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
 storage_key TEXT NOT NULL UNIQUE, encrypted_secret BLOB NOT NULL,
 encryption_key_version INTEGER NOT NULL, created_at TEXT NOT NULL
);
CREATE TABLE projects (
 id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES users(id),
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 80),
 configuration_json TEXT NOT NULL CHECK(json_valid(configuration_json)),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision > 0),
 created_at TEXT NOT NULL, updated_at TEXT NOT NULL, deleted_at TEXT
);
CREATE INDEX projects_owner_updated ON projects(owner_id, updated_at DESC);
CREATE TABLE assets (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
 kind TEXT NOT NULL CHECK(kind IN ('website','icon','adaptive-icon','notification-icon','splash','error-page')),
 storage_key TEXT NOT NULL UNIQUE, sha256 TEXT NOT NULL CHECK(length(sha256)=64),
 size_bytes INTEGER NOT NULL CHECK(size_bytes > 0), metadata_json TEXT NOT NULL CHECK(json_valid(metadata_json)),
 created_at TEXT NOT NULL
);
CREATE TABLE builds (
 id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id),
 website_asset_id TEXT NOT NULL REFERENCES assets(id),
 signing_credential_id TEXT REFERENCES signing_credentials(id),
 configuration_json TEXT NOT NULL CHECK(json_valid(configuration_json)),
 state TEXT NOT NULL CHECK(state IN ('queued','validating','generating','resolving','compiling','signing','verifying','completed','failed','cancelled')),
 idempotency_key TEXT NOT NULL, worker_id TEXT, lease_expires_at TEXT,
 artifact_key TEXT UNIQUE, artifact_sha256 TEXT, artifact_size INTEGER,
 failure_code TEXT, created_at TEXT NOT NULL, started_at TEXT, finished_at TEXT,
 UNIQUE(project_id, idempotency_key),
 CHECK(state <> 'completed' OR (artifact_key IS NOT NULL AND length(artifact_sha256)=64 AND artifact_size > 0))
);
CREATE INDEX builds_queue ON builds(state, created_at);
CREATE TABLE build_events (
 build_id TEXT NOT NULL REFERENCES builds(id) ON DELETE CASCADE,
 sequence INTEGER NOT NULL CHECK(sequence > 0), state TEXT NOT NULL,
 message TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY(build_id, sequence)
);
CREATE TABLE schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);
INSERT INTO schema_migrations VALUES (1, strftime('%Y-%m-%dT%H:%M:%fZ','now'));
COMMIT;
