CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL,
  username_key TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  password_salt TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_iterations INTEGER NOT NULL,
  display_name TEXT NOT NULL,
  disabled_at TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint

CREATE TABLE student_records (
  student_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  state_json TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint

CREATE TABLE auth_sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint

CREATE INDEX auth_sessions_account_id ON auth_sessions(account_id);
--> statement-breakpoint
CREATE INDEX auth_sessions_expires_at ON auth_sessions(expires_at);
--> statement-breakpoint

CREATE TABLE login_attempts (
  username_key TEXT NOT NULL,
  ip_key TEXT NOT NULL,
  attempts INTEGER NOT NULL,
  blocked_until TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (username_key, ip_key)
);
