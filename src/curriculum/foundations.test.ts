import { describe, expect, it } from "vitest";
import { activities, activityById } from "./foundations";

describe("tempo presets", () => {
  it("seeds a 60 BPM 4/4 preset on the rhythm-relevant activities", () => {
    for (const id of ["rhythm", "transitions", "first-notes"]) {
      expect(activityById(id)?.tempo).toEqual({
        bpm: 60,
        beatsPerBar: 4,
      });
    }
  });

  it("leaves every other activity without a preset", () => {
    const withPreset = activities.filter((a) => a.tempo !== undefined);
    expect(withPreset.map((a) => a.id).sort()).toEqual([
      "first-notes",
      "rhythm",
      "transitions",
    ]);
  });

  it("keeps every preset inside sane bounds", () => {
    for (const a of activities) {
      if (!a.tempo) continue;
      expect(a.tempo.bpm).toBeGreaterThanOrEqual(30);
      expect(a.tempo.bpm).toBeLessThanOrEqual(240);
      expect(a.tempo.beatsPerBar).toBeGreaterThanOrEqual(1);
    }
  });
});
