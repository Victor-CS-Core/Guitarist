export const statuses = [
  "NOT_INTRODUCED",
  "INTRODUCED",
  "LEARNING",
  "PRACTICING",
  "READY_FOR_ASSESSMENT",
  "MASTERED",
  "NEEDS_REINFORCEMENT",
] as const;
export type Status = (typeof statuses)[number];
export type Reason =
  | "placement"
  | "memory"
  | "clean-tone"
  | "rhythm"
  | "transition"
  | "other";
/** The valid reinforcement reasons, kept next to the type so validation can't drift. */
export const reasons: readonly Reason[] = [
  "placement",
  "memory",
  "clean-tone",
  "rhythm",
  "transition",
  "other",
];
export type Actor =
  | { role: "teacher" }
  | { role: "student"; studentId: string };
export interface Student {
  id: string;
  name: string;
  currentLevelId: string;
  unlockedLevels: string[];
  skills: Record<string, Status>;
  goal: string;
}
export interface AssignmentItem {
  id: string;
  activityId: string;
  minutes: number;
  repetitions: number;
  completed: boolean;
  /** Optional ISO calendar date (YYYY-MM-DD) the student should practice by. */
  dueDate?: string;
}
export interface Assignment {
  id: string;
  studentId: string;
  items: AssignmentItem[];
  at: string;
}
export interface Session {
  id: string;
  studentId: string;
  durationSeconds: number;
  itemIds: string[];
  at: string;
}
export interface Note {
  id: string;
  studentId: string;
  text: string;
  at: string;
}
export interface Event {
  id: string;
  studentId: string;
  text: string;
  at: string;
}
export interface DemoState {
  version: 1;
  students: Student[];
  assignments: Assignment[];
  sessions: Session[];
  notes: Note[];
  events: Event[];
}
export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
type Base = { studentId: string; at: string };
export type Command = Base &
  (
    | {
        type: "assess";
        skillId: string;
        status: Status;
        reason?: Reason;
        guidance?: string;
      }
    | {
        type: "assign";
        activityId: string;
        minutes: number;
        repetitions: number;
        /** Optional ISO calendar date (YYYY-MM-DD); stored on the new item. */
        dueDate?: string;
      }
    | { type: "unlock"; levelId: string; overrideReason?: string }
    | {
        type: "completePractice";
        sessionId: string;
        durationSeconds: number;
        itemIds: string[];
      }
    | { type: "saveNote"; text: string }
  );
