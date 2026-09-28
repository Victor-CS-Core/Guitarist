import { describe, expect, it } from "vitest";
import { buildRoutinePayload, toDraft } from "./routineDraft";
import type { DraftBlock } from "./BlockEditor";

function draft(overrides: Partial<DraftBlock> = {}): DraftBlock {
  return {
    localId: "draft-1",
    kind: "warmup",
    title: "",
    minutes: 5,
    activityId: "",
    chordQuery: "",
    chordIds: [],
    bpm: "",
    notes: "",
    ...overrides,
  };
}

describe("routineDraft", () => {
  it("toDraft starts a blank warmup block", () => {
    const d = toDraft();
    expect(d.kind).toBe("warmup");
    expect(d.minutes).toBe(5);
    expect(d.chordIds).toEqual([]);
  });

  it("toDraft round-trips a saved block", () => {
    const d = toDraft({
      id: "b1",
      kind: "chords",
      title: "Changes",
      minutes: 10,
      chordIds: ["c", "g"],
      bpm: 90,
    });
    expect(d.localId).toBe("b1");
    expect(d.bpm).toBe("90");
    expect(d.chordIds).toEqual(["c", "g"]);
  });

  it("buildRoutinePayload falls back to default titles and clamps minutes", () => {
    const [block] = buildRoutinePayload(
      [draft({ title: "  ", minutes: 99 })],
      [],
    );
    expect(block.title).toBe("Finger warm-up");
    expect(block.minutes).toBe(30);
  });

  it("buildRoutinePayload assigns the activity fallback for technique blocks", () => {
    const [block] = buildRoutinePayload(
      [draft({ kind: "technique", activityId: "" })],
      [{ id: "act-1" }],
    );
    expect(block.activityId).toBe("act-1");
  });

  it("buildRoutinePayload keeps chords, clamps bpm, and trims notes", () => {
    const [block] = buildRoutinePayload(
      [
        draft({
          kind: "chords",
          chordIds: ["c", "g"],
          bpm: "500",
          notes: "  smooth changes  ",
        }),
      ],
      [],
    );
    expect(block.chordIds).toEqual(["c", "g"]);
    expect(block.bpm).toBe(240);
    expect(block.notes).toBe("smooth changes");
  });

  it("buildRoutinePayload drops empty notes and invalid bpm", () => {
    const [block] = buildRoutinePayload([draft({ bpm: "fast" })], []);
    expect(block.notes).toBeUndefined();
    expect(block.bpm).toBeUndefined();
  });
});
