import { describe, expect, it } from "vitest";
import {
  countdownProgress,
  countdownRemainingSeconds,
  createStudyTimer,
  formatClock,
  isCountdownFinished,
  pauseStudyTimer,
  resetStudyTimer,
  startStudyTimer,
  studyDisplaySeconds,
  studyElapsedSeconds,
} from "./studyTimer";

describe("study timer state machine", () => {
  it("counts up while running and banks time on pause", () => {
    let s = createStudyTimer("countup", 0);
    expect(studyElapsedSeconds(s, 1000)).toBe(0);
    s = startStudyTimer(s, 1000);
    expect(studyElapsedSeconds(s, 6000)).toBe(5);
    s = pauseStudyTimer(s, 6000);
    expect(studyElapsedSeconds(s, 9000)).toBe(5);
    // Resume and accumulate across segments.
    s = startStudyTimer(s, 9000);
    expect(studyElapsedSeconds(s, 12000)).toBe(8);
  });

  it("ignores double start and double pause", () => {
    let s = createStudyTimer("countup", 0);
    s = startStudyTimer(s, 1000);
    const again = startStudyTimer(s, 2000);
    expect(studyElapsedSeconds(again, 6000)).toBe(5);
    s = pauseStudyTimer(s, 6000);
    const pausedAgain = pauseStudyTimer(s, 9000);
    expect(studyElapsedSeconds(pausedAgain, 12000)).toBe(5);
  });

  it("reset clears elapsed time but keeps mode and target", () => {
    let s = createStudyTimer("countdown", 300);
    s = startStudyTimer(s, 0);
    s = pauseStudyTimer(s, 120_000);
    s = resetStudyTimer(s);
    expect(studyElapsedSeconds(s, 120_000)).toBe(0);
    expect(s.mode).toBe("countdown");
    expect(s.targetSeconds).toBe(300);
  });
});

describe("countdown math", () => {
  it("reports remaining time and finishes at zero, never negative", () => {
    let s = createStudyTimer("countdown", 60);
    s = startStudyTimer(s, 0);
    expect(countdownRemainingSeconds(s, 10_000)).toBe(50);
    expect(isCountdownFinished(s, 10_000)).toBe(false);
    expect(countdownRemainingSeconds(s, 61_000)).toBe(0);
    expect(isCountdownFinished(s, 61_000)).toBe(true);
  });

  it("rounds target to whole seconds and floors at zero", () => {
    const s = createStudyTimer("countdown", -30);
    expect(s.targetSeconds).toBe(0);
    expect(isCountdownFinished(s, 1000)).toBe(true);
  });

  it("progress runs 0..1 across the target", () => {
    let s = createStudyTimer("countdown", 100);
    s = startStudyTimer(s, 0);
    expect(countdownProgress(s, 0)).toBe(0);
    expect(countdownProgress(s, 50_000)).toBe(0.5);
    expect(countdownProgress(s, 200_000)).toBe(1);
  });

  it("display shows remaining for countdown, elapsed for count-up", () => {
    let down = createStudyTimer("countdown", 120);
    down = startStudyTimer(down, 0);
    expect(studyDisplaySeconds(down, 30_000)).toBe(90);
    let up = createStudyTimer("countup", 0);
    up = startStudyTimer(up, 0);
    expect(studyDisplaySeconds(up, 30_000)).toBe(30);
  });
});

describe("formatClock", () => {
  it("formats mm:ss with zero padding", () => {
    expect(formatClock(0)).toBe("00:00");
    expect(formatClock(5)).toBe("00:05");
    expect(formatClock(65)).toBe("01:05");
    expect(formatClock(600)).toBe("10:00");
    expect(formatClock(2700)).toBe("45:00");
    expect(formatClock(3661.7)).toBe("61:01");
    expect(formatClock(-10)).toBe("00:00");
  });
});
