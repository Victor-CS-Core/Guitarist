import type { Actor, DemoState } from "../domain/types";

/**
 * A per-device copy of a graduated student's studio. Saving it is what turns
 * the installed web app into a personal offline studio: on the next launch
 * the app boots straight from this snapshot — no sign-in, no connection.
 */
export interface StudioSnapshot {
  state: DemoState;
  actor: Actor;
  /** Epoch ms when the snapshot was taken. */
  savedAt: number;
}

const KEY = "guitarist:studio-snapshot:v1";

/** Persist the snapshot. Returns false when storage is unavailable (private
 * browsing, quota exceeded) so the UI can say so instead of failing silently. */
export function saveStudioSnapshot(snapshot: StudioSnapshot): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(snapshot));
    return true;
  } catch {
    return false;
  }
}

/** Returns the snapshot, or null when there is none or it is unreadable.
 * Only student snapshots are honored — anything else is treated as absent. */
export function loadStudioSnapshot(): StudioSnapshot | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StudioSnapshot> | null;
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.state || typeof parsed.state !== "object") return null;
    const actor = parsed.actor;
    if (!actor || typeof actor !== "object") return null;
    if (actor.role !== "student" || typeof actor.studentId !== "string" || !actor.studentId) return null;
    return {
      state: parsed.state as DemoState,
      actor: actor as Actor,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : 0,
    };
  } catch {
    return null;
  }
}

export function clearStudioSnapshot(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* already gone or storage unavailable */
  }
}
