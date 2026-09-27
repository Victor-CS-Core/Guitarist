/**
 * Unlock-celebration persistence.
 *
 * When a teacher unlocks the app for a graduated student, the student sees a
 * one-time celebration screen. The flag lives in localStorage (per student),
 * wrapped in try/catch so private-browsing mode degrades to celebrating
 * again next visit instead of throwing.
 */

function celebratedKey(studentId: string) {
  return `guitarist:unlock-celebrated:${studentId}`;
}

/** True when this student has already dismissed the graduation celebration. */
export function hasCelebratedUnlock(studentId: string): boolean {
  try {
    return localStorage.getItem(celebratedKey(studentId)) === "1";
  } catch {
    return false;
  }
}

/** Record that this student dismissed the graduation celebration. */
export function markUnlockCelebrated(studentId: string): void {
  try {
    localStorage.setItem(celebratedKey(studentId), "1");
  } catch {
    /* private mode: celebrate again next visit */
  }
}
