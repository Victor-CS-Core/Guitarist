import type { RoutineBlock } from "../domain/types";
import { DEFAULT_TITLES, type DraftBlock } from "./BlockEditor";

/**
 * Routine-draft helpers shared by the builder UI.
 *
 * `toDraft` converts a saved block into an editable draft (or a blank one);
 * `buildRoutinePayload` turns drafts back into validated `RoutineBlock`s for
 * the create/update commands. Kept pure and UI-free so the validation rules
 * are unit-testable without rendering.
 */
export function toDraft(block?: RoutineBlock): DraftBlock {
  return {
    localId: block?.id ?? crypto.randomUUID(),
    kind: block?.kind ?? "warmup",
    title: block?.title ?? "",
    minutes: block?.minutes ?? 5,
    activityId: block?.activityId ?? "",
    chordQuery: "",
    chordIds: block?.chordIds ? [...block.chordIds] : [],
    bpm: block?.bpm ? String(block.bpm) : "",
    notes: block?.notes ?? "",
  };
}

export function buildRoutinePayload(
  drafts: DraftBlock[],
  activityOptions: readonly { id: string }[],
): RoutineBlock[] {
  return drafts.map((b) => {
    const block: RoutineBlock = {
      id: b.localId,
      kind: b.kind,
      title: b.title.trim() || DEFAULT_TITLES[b.kind],
      minutes: Math.max(1, Math.min(30, Math.floor(Number(b.minutes) || 5))),
    };
    if (b.kind === "technique" || b.kind === "song") {
      const fallback = activityOptions[0]?.id;
      if (b.activityId || fallback) block.activityId = b.activityId || fallback!;
    }
    if (b.kind === "chords") {
      if (b.chordIds.length > 0) block.chordIds = [...b.chordIds];
      const bpm = parseInt(b.bpm, 10);
      if (Number.isFinite(bpm)) block.bpm = Math.max(30, Math.min(240, bpm));
    }
    if (b.notes.trim()) block.notes = b.notes.trim().slice(0, 500);
    return block;
  });
}
