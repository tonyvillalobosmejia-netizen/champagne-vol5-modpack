-- Additive: manual Discord announcements, no changes to identities, worlds or existing queues.
CREATE TABLE IF NOT EXISTS manual_announcements(request_id TEXT PRIMARY KEY,actor_id TEXT NOT NULL,pack_id TEXT NOT NULL,guild_id TEXT NOT NULL,channel_id TEXT NOT NULL,fingerprint TEXT NOT NULL,payload TEXT NOT NULL,image TEXT,created_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS manual_announcements_pack ON manual_announcements(pack_id,created_at);
