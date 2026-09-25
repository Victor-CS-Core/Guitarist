import type { DemoState } from "../domain/types";
import { activityById } from "../curriculum/foundations";
import { isOverdue } from "../domain/selectors";

export interface AssignmentRow {
  assignmentId: string;
  itemId: string;
  studentId: string;
  studentName: string;
  activityId: string;
  activityTitle: string;
  minutes: number;
  repetitions: number;
  completed: boolean;
  assignedAt: string;
  dueDate?: string;
}

export type AssignmentStatusFilter = "all" | "open" | "complete" | "overdue";

/**
 * Flattens every assignment item in the studio into one row per exercise,
 * joining each item to its student name and curriculum activity title.
 * Items that reference a missing activity or student stay visible with a
 * clearly-labelled fallback instead of disappearing.
 */
export function flattenAssignments(state: DemoState): AssignmentRow[] {
  return state.assignments.flatMap((assignment) => {
    const studentName =
      state.students.find((s) => s.id === assignment.studentId)?.name ??
      "Unknown student";
    return assignment.items.map((item) => ({
      assignmentId: assignment.id,
      itemId: item.id,
      studentId: assignment.studentId,
      studentName,
      activityId: item.activityId,
      activityTitle:
        activityById(item.activityId)?.title ?? "Unavailable activity",
      minutes: item.minutes,
      repetitions: item.repetitions,
      completed: item.completed,
      assignedAt: assignment.at,
      ...(item.dueDate ? { dueDate: item.dueDate } : {}),
    }));
  });
}

/** Newest assignment first; items keep their original order within a day. */
export function sortAssignmentsNewest(
  rows: AssignmentRow[],
): AssignmentRow[] {
  return [...rows].sort(
    (a, b) =>
      new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime(),
  );
}

export interface AssignmentFilters {
  studentId?: string;
  status?: AssignmentStatusFilter;
}

export function filterAssignments(
  rows: AssignmentRow[],
  { studentId, status = "all" }: AssignmentFilters,
): AssignmentRow[] {
  return rows.filter(
    (row) =>
      (studentId ? row.studentId === studentId : true) &&
      (status === "all"
        ? true
        : status === "complete"
          ? row.completed
          : status === "overdue"
            ? isOverdue(row)
            : !row.completed),
  );
}

export function countOpen(rows: AssignmentRow[]): number {
  return rows.filter((row) => !row.completed).length;
}

/** Count open rows whose due date has passed. */
export function countOverdue(rows: AssignmentRow[]): number {
  return rows.filter((row) => isOverdue(row)).length;
}

/**
 * Earliest due date first; rows without a due date sort after all dated rows.
 * Falls back to newest assignment within identical due dates.
 */
export function sortAssignmentsByDueDate(
  rows: AssignmentRow[],
): AssignmentRow[] {
  return [...rows].sort((a, b) => {
    if (a.dueDate && b.dueDate) {
      const cmp = a.dueDate.localeCompare(b.dueDate);
      if (cmp !== 0) return cmp;
    } else if (a.dueDate) return -1;
    else if (b.dueDate) return 1;
    return (
      new Date(b.assignedAt).getTime() - new Date(a.assignedAt).getTime()
    );
  });
}
