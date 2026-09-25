import { describe, it, expect } from "vitest";
import { seed } from "../test/fixtures";
import { applyCommand } from "./commands";
import {
  daysUntilDue,
  dueDateLabel,
  formatDueDate,
  isDueSoon,
  isOverdue,
} from "./selectors";

const at = "2026-09-23T12:00:00Z";
const teacher = { role: "teacher" as const };

describe("assignment due dates", () => {
  it("computes days until due from YYYY-MM-DD strings without timezone drift", () => {
    expect(daysUntilDue("2026-09-23", "2026-09-23")).toBe(0);
    expect(daysUntilDue("2026-09-24", "2026-09-23")).toBe(1);
    expect(daysUntilDue("2026-09-20", "2026-09-23")).toBe(-3);
    expect(daysUntilDue("2026-10-23", "2026-09-23")).toBe(30);
  });

  it("flags overdue items only when a due date passed and the item is open", () => {
    const today = "2026-09-23";
    expect(isOverdue({ dueDate: "2026-09-22", completed: false }, today)).toBe(
      true,
    );
    expect(isOverdue({ dueDate: "2026-09-23", completed: false }, today)).toBe(
      false,
    );
    expect(isOverdue({ dueDate: "2026-09-22", completed: true }, today)).toBe(
      false,
    );
    // Existing assignments without a due date behave as before: never overdue.
    expect(isOverdue({ completed: false }, today)).toBe(false);
  });

  it("flags due-soon items due today through three days out", () => {
    const today = "2026-09-23";
    for (const due of ["2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26"])
      expect(isDueSoon({ dueDate: due, completed: false }, today)).toBe(true);
    expect(isDueSoon({ dueDate: "2026-09-27", completed: false }, today)).toBe(
      false,
    );
    expect(isDueSoon({ dueDate: "2026-09-22", completed: false }, today)).toBe(
      false,
    );
    expect(isDueSoon({ dueDate: "2026-09-24", completed: true }, today)).toBe(
      false,
    );
    expect(isDueSoon({ completed: false }, today)).toBe(false);
  });

  it("labels due states in friendly words", () => {
    const today = "2026-09-23";
    expect(dueDateLabel("2026-09-23", today)).toBe("Due today");
    expect(dueDateLabel("2026-09-24", today)).toBe("Due tomorrow");
    expect(dueDateLabel("2026-09-28", today)).toBe("Due in 5 days");
    expect(dueDateLabel("2026-09-22", today)).toBe("Overdue by 1 day");
    expect(dueDateLabel("2026-09-20", today)).toBe("Overdue by 3 days");
  });

  it("formats a due date without a day shift", () => {
    // Regression guard: parsing a bare date at UTC midnight would render
    // as the previous day for viewers behind UTC.
    expect(formatDueDate("2026-09-28")).toContain("28");
    expect(formatDueDate("2026-09-28")).not.toContain("27");
  });

  it("assign stores an optional due date on the new item", () => {
    const r = applyCommand(seed(), teacher, {
      type: "assign",
      studentId: "noah",
      activityId: "strings",
      minutes: 3,
      repetitions: 3,
      dueDate: "2026-09-28",
      at,
    });
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(
        r.value.assignments
          .filter((a) => a.studentId === "noah")
          .at(-1)
          ?.items.at(-1)?.dueDate,
      ).toBe("2026-09-28");
  });

  it("assign keeps the item date-free when no due date is given", () => {
    const r = applyCommand(seed(), teacher, {
      type: "assign",
      studentId: "noah",
      activityId: "strings",
      minutes: 3,
      repetitions: 3,
      at,
    });
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(
        r.value.assignments.find((a) => a.studentId === "noah")?.items.at(-1)
          ?.dueDate,
      ).toBeUndefined();
  });

  it("assign rejects malformed due dates", () => {
    for (const dueDate of ["tomorrow", "2026-9-8", "2026-13-01"]) {
      const r = applyCommand(seed(), teacher, {
        type: "assign",
        studentId: "noah",
        activityId: "strings",
        minutes: 3,
        repetitions: 3,
        dueDate,
        at,
      });
      expect(r.ok).toBe(false);
    }
  });
});
