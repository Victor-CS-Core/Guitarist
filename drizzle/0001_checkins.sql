CREATE TABLE checkins (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  mime TEXT NOT NULL,
  audio_base64 TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX checkins_student_created ON checkins(student_id, created_at DESC);
