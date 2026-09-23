import { it, expect } from "vitest";
import { elapsedSeconds } from "./timer";
it("counts elapsed time instead of callbacks and excludes pauses", () => {
  expect(elapsedSeconds([{ start: 0, end: 2000 }], 8000, 11000)).toBe(5);
  expect(elapsedSeconds([{ start: 0, end: 2000 }], null, 11000)).toBe(2);
  expect(elapsedSeconds([], 0, 61000)).toBe(61);
});
