-- Additive migration; does not alter sessions, worlds, catalogs or existing roles.
CREATE TABLE IF NOT EXISTS role_bot_communities(guild_id TEXT PRIMARY KEY,generation TEXT NOT NULL,metadata TEXT NOT NULL,checked_at INTEGER NOT NULL);
