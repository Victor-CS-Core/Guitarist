/**
 * Shared presentation formatting helpers.
 *
 * These capture the exact duration/date formatting expressions that were
 * previously duplicated across pages (teacher Dashboard, teacher
 * StudentDetail, practice page, agent tools), so every surface renders the
 * same copy from the same arithmetic.
 */

/** Minutes and seconds from a whole duration, exactly as the UI rendered them inline. */
export function splitDuration(totalSeconds: number): {
  minutes: number;
  seconds: number;
} {
  return {
    minutes: Math.floor(totalSeconds / 60),
    seconds: totalSeconds % 60,
  };
}

/** Plain-text duration, e.g. "11 min 0 sec". */
export function formatDuration(totalSeconds: number): string {
  const { minutes, seconds } = splitDuration(totalSeconds);
  return `${minutes} min ${seconds} sec`;
}

export interface HasDurationSeconds {
  durationSeconds: number;
}

/** Total practice seconds across sessions (the sum several pages computed inline). */
export function totalPracticeSeconds(
  sessions: readonly HasDurationSeconds[],
): number {
  return sessions.reduce((n, s) => n + s.durationSeconds, 0);
}

/** Whole recorded minutes for the "N practice sessions · M recorded minutes" line. */
export function totalPracticeMinutesRounded(
  sessions: readonly HasDurationSeconds[],
): number {
  return Math.round(totalPracticeSeconds(sessions) / 60);
}

/** Locale short date, e.g. "9/24/2026". */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/** Locale date + time, e.g. "9/24/2026, 3:12:44 PM". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString();
}
