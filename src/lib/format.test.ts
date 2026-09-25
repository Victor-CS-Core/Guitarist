import { describe, expect, it } from "vitest";
import {
  formatDate,
  formatDateTime,
  formatDuration,
  splitDuration,
  totalPracticeMinutesRounded,
  totalPracticeSeconds,
} from "./format";

describe("splitDuration", () => {
  it("splits whole minutes", () => {
    expect(splitDuration(660)).toEqual({ minutes: 11, seconds: 0 });
  });
  it("splits leftover seconds", () => {
    expect(splitDuration(125)).toEqual({ minutes: 2, seconds: 5 });
  });
  it("handles zero", () => {
    expect(splitDuration(0)).toEqual({ minutes: 0, seconds: 0 });
  });
});

describe("formatDuration", () => {
  it("formats minutes and seconds with the original copy", () => {
    expect(formatDuration(660)).toBe("11 min 0 sec");
    expect(formatDuration(125)).toBe("2 min 5 sec");
  });
});

describe("practice totals", () => {
  const sessions = [
    { durationSeconds: 660 },
    { durationSeconds: 90 },
  ];
  it("sums session seconds", () => {
    expect(totalPracticeSeconds(sessions)).toBe(750);
  });
  it("rounds to whole minutes like the dashboard", () => {
    expect(totalPracticeMinutesRounded(sessions)).toBe(
      Math.round(750 / 60),
    );
    expect(totalPracticeMinutesRounded([])).toBe(0);
  });
});

describe("date formatting", () => {
  const iso = "2026-09-24T19:12:44.000Z";
  it("matches the inline toLocaleDateString call", () => {
    expect(formatDate(iso)).toBe(new Date(iso).toLocaleDateString());
  });
  it("matches the inline toLocaleString call", () => {
    expect(formatDateTime(iso)).toBe(new Date(iso).toLocaleString());
  });
});
