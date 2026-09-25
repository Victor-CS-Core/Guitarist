import { elapsedSeconds } from "../practice/timer";

export type StudyTimerMode = "countdown" | "countup";

/** Preset focus blocks, in minutes, offered on the study timer. */
export const STUDY_TIMER_PRESETS_MIN = [5, 10, 15, 25, 45] as const;

export interface StudyTimerState {
  mode: StudyTimerMode;
  /** Countdown length in seconds (ignored in count-up mode). */
  targetSeconds: number;
  segments: Array<{ start: number; end: number }>;
  /** Timestamp the current running segment started, or null when paused. */
  activeStart: number | null;
}

export function createStudyTimer(
  mode: StudyTimerMode,
  targetSeconds: number,
): StudyTimerState {
  return {
    mode,
    targetSeconds: Math.max(0, Math.round(targetSeconds)),
    segments: [],
    activeStart: null,
  };
}

/** Start (or resume) the timer at `now`. No-op when already running. */
export function startStudyTimer(
  state: StudyTimerState,
  now: number,
): StudyTimerState {
  if (state.activeStart !== null) return state;
  return { ...state, activeStart: now };
}

/** Pause the timer, banking the running segment. No-op when paused. */
export function pauseStudyTimer(
  state: StudyTimerState,
  now: number,
): StudyTimerState {
  if (state.activeStart === null) return state;
  return {
    ...state,
    segments: [
      ...state.segments,
      { start: state.activeStart, end: Math.max(now, state.activeStart) },
    ],
    activeStart: null,
  };
}

/** Reset to zero elapsed while keeping mode and target. */
export function resetStudyTimer(state: StudyTimerState): StudyTimerState {
  return { ...state, segments: [], activeStart: null };
}

/** Total elapsed practice seconds, reusing the shared practice-timer math. */
export function studyElapsedSeconds(
  state: StudyTimerState,
  now: number,
): number {
  return elapsedSeconds(state.segments, state.activeStart, now);
}

/** Seconds left on a countdown timer; never negative. */
export function countdownRemainingSeconds(
  state: StudyTimerState,
  now: number,
): number {
  if (state.mode !== "countdown") return 0;
  return Math.max(0, state.targetSeconds - studyElapsedSeconds(state, now));
}

export function isCountdownFinished(
  state: StudyTimerState,
  now: number,
): boolean {
  return (
    state.mode === "countdown" && countdownRemainingSeconds(state, now) <= 0
  );
}

/** Seconds the big clock should show for the current mode. */
export function studyDisplaySeconds(
  state: StudyTimerState,
  now: number,
): number {
  return state.mode === "countdown"
    ? countdownRemainingSeconds(state, now)
    : studyElapsedSeconds(state, now);
}

/** Fraction of a countdown target that has elapsed, 0..1. */
export function countdownProgress(
  state: StudyTimerState,
  now: number,
): number {
  if (state.mode !== "countdown" || state.targetSeconds <= 0) return 0;
  return Math.min(
    1,
    Math.max(0, studyElapsedSeconds(state, now) / state.targetSeconds),
  );
}

/** Format seconds as mm:ss (minutes grow past 59, e.g. "75:00"). */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
