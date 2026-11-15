"""SQLite migration constraints; no application/API behavior is implied."""
import pathlib
import sqlite3
import unittest

class MigrationTest(unittest.TestCase):
    def setUp(self):
        self.db = sqlite3.connect(':memory:')
        self.db.executescript(pathlib.Path('database/migrations/001_initial.sql').read_text())
    def tearDown(self):
        self.db.close()
    def test_tables(self):
        tables = {x[0] for x in self.db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
        self.assertTrue({'users', 'sessions', 'projects', 'assets', 'builds', 'build_events', 'signing_credentials'} <= tables)
        self.assertEqual(self.db.execute('PRAGMA foreign_keys').fetchone()[0], 1)
    def test_owner_foreign_key(self):
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO projects VALUES ('p','missing','app','{}',1,'now','now',NULL)")
    def test_configuration_json(self):
        self.db.execute("INSERT INTO users VALUES ('u','u@example.com','hash','now')")
        with self.assertRaises(sqlite3.IntegrityError):
            self.db.execute("INSERT INTO projects VALUES ('p','u','app','invalid',1,'now','now',NULL)")

if __name__ == '__main__':
    unittest.main()
