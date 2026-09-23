import { levels } from "../curriculum/foundations";
import type { DemoState } from "./types";
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
    .every((l) =>
      l.skills
        .filter((s) => s.required)
        .every((s) => student.skills[s.id] === "MASTERED"),
    );
}
export function earnedBadgeIds(state: DemoState, studentId: string): string[] {
  const student = state.students.find((s) => s.id === studentId);
  if (!student) return [];
  return levels
    .filter((l) =>
      l.skills
        .filter((s) => s.required)
        .every((s) => student.skills[s.id] === "MASTERED"),
    )
    .map((l) => l.badgeId);
}
