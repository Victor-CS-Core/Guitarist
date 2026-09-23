import { it, expect } from "vitest";
import { practiceSummary, validateEmptyInput } from "./webmcp";
import { seed } from "../demo/seed";
it("limits practice summaries to the selected learner and rejects unexpected input", () => {
  expect(
    practiceSummary(seed(), { role: "student", studentId: "noah" }),
  ).toEqual({ student: "Noah", pendingActivities: 2, recordedSeconds: 0 });
  expect(() => validateEmptyInput({ studentId: "emma" })).toThrow();
  expect(() => practiceSummary(seed(), { role: "teacher" })).toThrow();
});
