CREATE TABLE IF NOT EXISTS release_cursors(kind TEXT PRIMARY KEY,version TEXT NOT NULL,checked_at INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO release_cursors(kind,version) VALUES('launcher','0.1.17'),('admin','0.1.20');
