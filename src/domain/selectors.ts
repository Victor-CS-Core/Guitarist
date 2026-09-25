import { levels } from "../curriculum/foundations";
import type { Level } from "../curriculum/types";
import type { DemoState, Student } from "./types";

/** Today in the viewer's local timezone as an ISO calendar date (YYYY-MM-DD). */
export function todayIso(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Whole days from `today` (YYYY-MM-DD) to `dueDate` (YYYY-MM-DD). Negative means overdue. */
export function daysUntilDue(dueDate: string, today: string): number {
  const [y, m, dd] = dueDate.split("-").map(Number);
  const [ty, tm, tdd] = today.split("-").map(Number);
  return Math.round(
    (Date.UTC(y, m - 1, dd) - Date.UTC(ty, tm - 1, tdd)) / 86_400_000,
  );
}

export interface HasDueDate {
  dueDate?: string;
  completed: boolean;
}

/** Due date has passed and the item is still open. Items without a due date are never overdue. */
export function isOverdue(item: HasDueDate, today: string = todayIso()): boolean {
  return (
    !item.completed && !!item.dueDate && daysUntilDue(item.dueDate, today) < 0
  );
}

/** Due today or within the next 3 days and still open. */
export function isDueSoon(item: HasDueDate, today: string = todayIso()): boolean {
  if (!item.dueDate || item.completed) return false;
  const d = daysUntilDue(item.dueDate, today);
  return d >= 0 && d <= 3;
}

/** Friendly label: "Due today", "Due tomorrow", "Overdue by 2 days", "Due in 5 days". */
export function dueDateLabel(
  dueDate: string,
  today: string = todayIso(),
): string {
  const d = daysUntilDue(dueDate, today);
  if (d < 0) return `Overdue by ${-d} ${-d === 1 ? "day" : "days"}`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}

/** "Sep 28, 2026". Parsed at noon to avoid the day shifting across timezones. */
export function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Every required skill in the level is MASTERED. */
function requiredSkillsMastered(student: Student, level: Level): boolean {
  return level.skills
    .filter((s) => s.required)
    .every((s) => student.skills[s.id] === "MASTERED");
}

export function canUnlock(
  state: DemoState,
  studentId: string,
  levelId: string,
) {
  const student = state.students.find((s) => s.id === studentId),
    level = levels.find((l) => l.id === levelId);
  if (!student || !level) return false;
  return levels
    .filter((l) => l.order < level.order)
    .every((l) => requiredSkillsMastered(student, l));
}
export function earnedBadgeIds(state: DemoState, studentId: string): string[] {
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return [];
  return levels
    .filter((l) => requiredSkillsMastered(student, l))
    .map((l) => l.badgeId);
}
