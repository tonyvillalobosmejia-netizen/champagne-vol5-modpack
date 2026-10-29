-- Additive. No rewriting existing catalogs, sessions, worlds or Git history.
CREATE TABLE IF NOT EXISTS publication_receipts(commit_sha TEXT PRIMARY KEY,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,confirmed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notification_jobs(id TEXT PRIMARY KEY,guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,due_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,claim_token TEXT,message_id TEXT,attempts INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS notification_jobs_due ON notification_jobs(status,due_at);
CREATE TABLE IF NOT EXISTS bot_requests(nonce TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS admin_actions(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,action TEXT NOT NULL,pack_id TEXT,commit_sha TEXT,version TEXT,created_at INTEGER NOT NULL);
