CREATE TABLE IF NOT EXISTS discord_users(discord_id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS discord_reservations(username TEXT PRIMARY KEY COLLATE NOCASE);
CREATE TABLE IF NOT EXISTS discord_flows(state TEXT PRIMARY KEY, proof_hash TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discord_flows_expiry ON discord_flows(expires_at);
CREATE TABLE IF NOT EXISTS discord_sessions(token_hash TEXT PRIMARY KEY, discord_id TEXT NOT NULL, username TEXT NOT NULL, discord_name TEXT NOT NULL, encrypted_access_token TEXT NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discord_sessions_expiry ON discord_sessions(expires_at);
CREATE TABLE IF NOT EXISTS discord_limits(bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS discord_limits_expiry ON discord_limits(expires_at);
