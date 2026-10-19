CREATE TABLE IF NOT EXISTS discord_users(discord_id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS discord_reservations(username TEXT PRIMARY KEY COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS discord_flows(state TEXT PRIMARY KEY, proof_hash TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discord_flows_expiry ON discord_flows(expires_at);
CREATE TABLE IF NOT EXISTS discord_sessions(token_hash TEXT PRIMARY KEY, discord_id TEXT NOT NULL, username TEXT NOT NULL, discord_name TEXT NOT NULL, encrypted_access_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discord_sessions_expiry ON discord_sessions(expires_at);
CREATE TABLE IF NOT EXISTS discord_limits(bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discord_limits_expiry ON discord_limits(expires_at);
CREATE TABLE IF NOT EXISTS role_bot_state(guild_id TEXT PRIMARY KEY,generation TEXT NOT NULL,sequence INTEGER NOT NULL,ready INTEGER NOT NULL,last_seen INTEGER NOT NULL,last_message_at INTEGER NOT NULL,message_signature TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS role_bot_members(guild_id TEXT NOT NULL,discord_id TEXT NOT NULL,generation TEXT NOT NULL,roles TEXT NOT NULL,present INTEGER NOT NULL,pending INTEGER NOT NULL,avatar TEXT,PRIMARY KEY(guild_id,discord_id));

CREATE TABLE IF NOT EXISTS deleted_packs (pack_id TEXT PRIMARY KEY, deleted_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS role_bot_communities(guild_id TEXT PRIMARY KEY,generation TEXT NOT NULL,metadata TEXT NOT NULL,checked_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS publication_receipts(commit_sha TEXT PRIMARY KEY,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,confirmed INTEGER NOT NULL DEFAULT 0,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS notification_jobs(id TEXT PRIMARY KEY,guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,payload TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending',created_at INTEGER NOT NULL,due_at INTEGER NOT NULL,lease_until INTEGER NOT NULL DEFAULT 0,claim_token TEXT,message_id TEXT,attempts INTEGER NOT NULL DEFAULT 0);
CREATE INDEX IF NOT EXISTS notification_jobs_due ON notification_jobs(status,due_at);
CREATE TABLE IF NOT EXISTS bot_requests(nonce TEXT PRIMARY KEY,expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS admin_actions(id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,actor_name TEXT NOT NULL,action TEXT NOT NULL,pack_id TEXT,commit_sha TEXT,version TEXT,created_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS release_cursors(kind TEXT PRIMARY KEY,version TEXT NOT NULL,checked_at INTEGER NOT NULL DEFAULT 0);
INSERT OR IGNORE INTO release_cursors(kind,version) VALUES('launcher','0.1.17'),('admin','0.1.20');
-- Additive: manual Discord announcements, no changes to identities, worlds or existing queues.
CREATE TABLE IF NOT EXISTS manual_announcements(request_id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,pack_id TEXT NOT NULL,guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,fingerprint TEXT NOT NULL,payload TEXT NOT NULL,image TEXT,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS manual_announcements_pack ON manual_announcements(pack_id,created_at);
