import { it, expect } from "vitest";
import { seed } from "../test/fixtures";
import {
  countOpen,
  filterAssignments,
  flattenAssignments,
  sortAssignmentsNewest,
} from "./assignmentSelectors";

it("flattens every assignment item with student and activity details", () => {
  const rows = flattenAssignments(seed());
  expect(rows).toHaveLength(5);
  const emmaRows = rows.filter((r) => r.studentId === "emma");
  expect(emmaRows).toHaveLength(3);
  expect(emmaRows[0]).toMatchObject({
    studentName: "Emma",
    activityId: "em-shape",
    activityTitle: "Hello, E minor",
    minutes: 3,
    repetitions: 3,
    completed: false,
    itemId: "emma-em",
  });
  const noahRows = rows.filter((r) => r.studentId === "noah");
  expect(noahRows[0]).toMatchObject({
    studentName: "Noah",
    activityTitle: "String explorer",
  });
});

it("labels missing students and activities instead of dropping them", () => {
  const state = seed();
  const rows = flattenAssignments({
    ...state,
    students: state.students.filter((s) => s.id !== "emma"),
    assignments: [
      {
        id: "odd",
        studentId: "gone",
        at: new Date().toISOString(),
        items: [
          { id: "i1", activityId: "no-such-activity", minutes: 5, repetitions: 2, completed: false },
        ],
      },
    ],
  });
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({
    studentName: "Unknown student",
    activityTitle: "Unavailable activity",
  });
});

it("sorts newest assignments first", () => {
  const rows = flattenAssignments(seed()).map((row, i) => ({
    ...row,
    assignedAt: new Date(Date.now() - i * 86400000).toISOString(),
  }));
  const sorted = sortAssignmentsNewest(rows);
  expect(sorted[0].itemId).toBe("emma-em");
  expect(sorted.at(-1)?.itemId).toBe("noah-notes");
});

it("filters by student and completion status", () => {
  const rows = flattenAssignments(seed());
  expect(filterAssignments(rows, { studentId: "emma" })).toHaveLength(3);
  expect(filterAssignments(rows, { studentId: "noah" })).toHaveLength(2);
  expect(filterAssignments(rows, { status: "open" })).toHaveLength(5);
  expect(filterAssignments(rows, { status: "complete" })).toHaveLength(0);
  expect(
    filterAssignments(rows, { studentId: "emma", status: "complete" }),
  ).toHaveLength(0);
  const done = rows.map((row, i) =>
    i === 0 ? { ...row, completed: true } : row,
  );
  expect(filterAssignments(done, { status: "complete" })).toHaveLength(1);
  expect(
    filterAssignments(done, { studentId: "emma", status: "open" }),
  ).toHaveLength(2);
});

it("counts only the exercises still to practice", () => {
  const rows = flattenAssignments(seed());
  expect(countOpen(rows)).toBe(5);
  expect(countOpen(rows.map((r) => ({ ...r, completed: true })))).toBe(0);
});
