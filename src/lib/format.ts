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

/** Locale time, e.g. "3:12 PM". */
export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

/**
 * Due-date as "Sep 28, 2026". Takes a calendar date (YYYY-MM-DD); parsed at
 * noon to avoid the day shifting across timezones.
 */
export function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T12:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
