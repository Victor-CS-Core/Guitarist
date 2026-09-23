import type { DemoState } from "../src/domain/types";
import { levels, skills } from "../src/curriculum/foundations";

export interface StudentRecord { state: DemoState; revision: number }
export interface AccountRow {
  id: string;
  username: string;
  username_key: string;
  role: "teacher" | "student";
  password_salt: string;
  password_hash: string;
  password_iterations: number;
  display_name: string;
  disabled_at: string | null;
  created_at: string;
}

export function createEmptyStudentState(id: string, name: string): DemoState {
  const first = levels[0];
  return {
    version: 1,
    students: [{
      id, name, currentLevelId: first.id, unlockedLevels: [first.id],
      skills: Object.fromEntries(skills.map((skill) => [skill.id, "NOT_INTRODUCED"])) as DemoState["students"][number]["skills"],
      goal: first.goal,
    }],
    assignments: [], sessions: [], notes: [], events: [],
  };
}

export async function getAccountByUsername(db: D1Database, normalizedUsername: string): Promise<AccountRow | null> {
  return db.prepare("SELECT * FROM accounts WHERE username_key = ?").bind(normalizedUsername).first<AccountRow>();
}

export async function getStudentRecord(db: D1Database, studentId: string): Promise<StudentRecord | null> {
  const row = await db.prepare("SELECT state_json, revision FROM student_records WHERE student_id = ?").bind(studentId).first<{state_json:string; revision:number}>();
  return row ? { state: JSON.parse(row.state_json) as DemoState, revision: row.revision } : null;
}

export async function saveStudentRecord(db: D1Database, studentId: string, expectedRevision: number, state: DemoState): Promise<boolean> {
  const now = new Date().toISOString();
  const json = JSON.stringify(state);
  const result = expectedRevision === 0
    ? await db.prepare("INSERT INTO student_records (student_id, state_json, revision, created_at, updated_at) VALUES (?, ?, 1, ?, ?) ON CONFLICT(student_id) DO NOTHING").bind(studentId, json, now, now).run()
    : await db.prepare("UPDATE student_records SET state_json = ?, revision = revision + 1, updated_at = ? WHERE student_id = ? AND revision = ?").bind(json, now, studentId, expectedRevision).run();
  return result.meta.changes === 1;
}
