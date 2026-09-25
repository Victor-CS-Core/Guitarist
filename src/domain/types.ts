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
  /** Teacher has unlocked the app: the student keeps it as a self-directed practice tool. */
  appUnlocked: boolean;
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
  /** When the session was a guided routine run, which routine it was. */
  routineId?: string;
  /** Human label for the session in history (routine name). */
  label?: string;
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
export type RoutineBlockKind =
  | "warmup"
  | "technique"
  | "chords"
  | "song"
  | "cooldown";
export const routineBlockKinds: readonly RoutineBlockKind[] = [
  "warmup",
  "technique",
  "chords",
  "song",
  "cooldown",
];
export const routineBlockKindLabels: Record<RoutineBlockKind, string> = {
  warmup: "Warm-up",
  technique: "Technique",
  chords: "Chord changes",
  song: "Song",
  cooldown: "Cool-down",
};
export interface RoutineBlock {
  id: string;
  kind: RoutineBlockKind;
  /** Short title shown in the player, e.g. "Spider exercise" or "Em → Am". */
  title: string;
  /** Suggested minutes for this block (1–30). */
  minutes: number;
  /** Curriculum activity for technique/song blocks. */
  activityId?: string;
  /** Chord library ids for chord-change blocks. */
  chordIds?: string[];
  /** Metronome target for chord/rhythm blocks (30–240). */
  bpm?: number;
  /** Free-text guidance shown under the block. */
  notes?: string;
}
export interface Routine {
  id: string;
  studentId: string;
  name: string;
  blocks: RoutineBlock[];
  createdBy: "teacher" | "student";
  at: string;
}
export interface DemoState {
  version: 1;
  students: Student[];
  assignments: Assignment[];
  sessions: Session[];
  notes: Note[];
  events: Event[];
  routines: Routine[];
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
    | { type: "setAppUnlocked"; unlocked: boolean }
    | {
        type: "createRoutine";
        name: string;
        blocks: RoutineBlock[];
      }
    | {
        type: "updateRoutine";
        routineId: string;
        name: string;
        blocks: RoutineBlock[];
      }
    | { type: "deleteRoutine"; routineId: string }
    | {
        type: "completePractice";
        sessionId: string;
        durationSeconds: number;
        itemIds: string[];
        routineId?: string;
        label?: string;
      }
    | { type: "saveNote"; text: string }
  );
