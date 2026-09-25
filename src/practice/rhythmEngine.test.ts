import { describe, expect, it } from "vitest";
import {
  accentForBeat,
  applyTempoPreset,
  barBeatLabel,
  beatIntervalMs,
  beatUnit,
  beatsPerBar,
  clampBpm,
  defaultCustomAccents,
  expandBar,
  presetSignature,
  presetSignatureLabel,
  tapTempo,
} from "./rhythmEngine";

describe("time signatures", () => {
  it("reports beats per bar and beat unit", () => {
    expect(beatsPerBar("4/4")).toBe(4);
    expect(beatUnit("4/4")).toBe(4);
    expect(beatsPerBar("3/4")).toBe(3);
    expect(beatUnit("3/4")).toBe(4);
    expect(beatsPerBar("6/8")).toBe(6);
    expect(beatUnit("6/8")).toBe(8);
    expect(beatsPerBar("2/4")).toBe(2);
    expect(beatsPerBar("5/4")).toBe(5);
    expect(beatsPerBar("7/8")).toBe(7);
    expect(beatUnit("7/8")).toBe(8);
  });

  it("labels a bar for the dot display", () => {
    expect(barBeatLabel("4/4")).toBe("4 beats");
    expect(barBeatLabel("3/4")).toBe("3 beats");
  });
});

describe("expandBar", () => {
  it("expands 4/4 eighth notes into 8 ticks with correct beat/tick indexes", () => {
    const ticks = expandBar("4/4", "eighth");
    expect(ticks).toHaveLength(8);
    expect(ticks[0]).toMatchObject({
      beatIndex: 0,
      tickIndex: 0,
      isBeat: true,
      isDownbeat: true,
    });
    expect(ticks[1]).toMatchObject({
      beatIndex: 0,
      tickIndex: 1,
      isBeat: false,
      isDownbeat: false,
    });
    expect(ticks[2]).toMatchObject({ beatIndex: 1, tickIndex: 0, isBeat: true });
    expect(ticks[7]).toMatchObject({ beatIndex: 3, tickIndex: 1 });
  });

  it("expands 3/4 sixteenths into 12 ticks", () => {
    const ticks = expandBar("3/4", "sixteenth");
    expect(ticks).toHaveLength(12);
    expect(ticks[11]).toMatchObject({ beatIndex: 2, tickIndex: 3 });
  });

  it("expands 6/8 triplets into 18 ticks", () => {
    const ticks = expandBar("6/8", "triplet");
    expect(ticks).toHaveLength(18);
  });

  it("quarter subdivision yields one tick per beat", () => {
    const ticks = expandBar("5/4", "quarter");
    expect(ticks).toHaveLength(5);
    expect(ticks.every((t) => t.isBeat)).toBe(true);
  });
});

describe("accentForBeat", () => {
  it("accents only the downbeat in downbeat mode", () => {
    expect(accentForBeat("downbeat", [], 0)).toBe(true);
    expect(accentForBeat("downbeat", [], 1)).toBe(false);
    expect(accentForBeat("downbeat", [], 3)).toBe(false);
  });

  it("accents every beat in all mode", () => {
    expect(accentForBeat("all", [], 0)).toBe(true);
    expect(accentForBeat("all", [], 2)).toBe(true);
  });

  it("follows the custom per-beat toggles", () => {
    const custom = [true, false, true, false];
    expect(accentForBeat("custom", custom, 0)).toBe(true);
    expect(accentForBeat("custom", custom, 1)).toBe(false);
    expect(accentForBeat("custom", custom, 2)).toBe(true);
  });

  it("falls back to downbeat for custom entries past the toggle list", () => {
    expect(accentForBeat("custom", [false], 0)).toBe(false);
    expect(accentForBeat("custom", [false], 3)).toBe(false);
    expect(accentForBeat("custom", [], 0)).toBe(true);
  });

  it("defaults custom accents to downbeat only", () => {
    expect(defaultCustomAccents("4/4")).toEqual([true, false, false, false]);
    expect(defaultCustomAccents("3/4")).toEqual([true, false, false]);
  });
});

describe("tempo math", () => {
  it("clamps BPM to 30–240 and sanitizes junk", () => {
    expect(clampBpm(10)).toBe(30);
    expect(clampBpm(500)).toBe(240);
    expect(clampBpm(120)).toBe(120);
    expect(clampBpm(120.6)).toBe(121);
    expect(clampBpm(Number.NaN)).toBe(60);
  });

  it("computes beat intervals", () => {
    expect(beatIntervalMs(60)).toBe(1000);
    expect(beatIntervalMs(120)).toBe(500);
  });
});

describe("tapTempo", () => {
  it("estimates 120 BPM from half-second taps", () => {
    expect(tapTempo([0, 500, 1000, 1500, 2000])).toBe(120);
  });

  it("estimates 60 BPM from one-second taps", () => {
    expect(tapTempo([100, 1100, 2100])).toBe(60);
  });

  it("shrugs off a single sloppy tap via the median", () => {
    expect(tapTempo([0, 500, 1000, 1900, 2400])).toBe(120);
  });

  it("returns null with fewer than two taps", () => {
    expect(tapTempo([])).toBeNull();
    expect(tapTempo([500])).toBeNull();
  });

  it("clamps extreme results into range", () => {
    expect(tapTempo([0, 50, 100])).toBe(240);
  });
});

describe("tempo presets", () => {
  it("applies a preset into clamped, usable numbers", () => {
    expect(applyTempoPreset({ bpm: 72, beatsPerBar: 3 })).toEqual({
      bpm: 72,
      beatsPerBar: 3,
      beatUnit: 4,
    });
    expect(
      applyTempoPreset({ bpm: 72, beatsPerBar: 6, beatUnit: 8 }),
    ).toMatchObject({ beatUnit: 8 });
  });

  it("clamps BPM to the engine range and beats to sane counts", () => {
    expect(
      applyTempoPreset({ bpm: 999, beatsPerBar: 4 }),
    ).toMatchObject({ bpm: 240 });
    expect(
      applyTempoPreset({ bpm: 1, beatsPerBar: 4 }),
    ).toMatchObject({ bpm: 30 });
    expect(
      applyTempoPreset({ bpm: 60, beatsPerBar: 4.6 }),
    ).toMatchObject({ beatsPerBar: 5 });
    expect(
      applyTempoPreset({ bpm: 60, beatsPerBar: 0 }),
    ).toMatchObject({ beatsPerBar: 1 });
    expect(
      applyTempoPreset({ bpm: 60, beatsPerBar: 99 }),
    ).toMatchObject({ beatsPerBar: 12 });
    expect(
      applyTempoPreset({ bpm: NaN, beatsPerBar: NaN }),
    ).toMatchObject({ bpm: 60, beatsPerBar: 4 });
  });

  it("matches presets to known signatures, else null", () => {
    expect(presetSignature({ bpm: 60, beatsPerBar: 4 })).toBe("4/4");
    expect(presetSignature({ bpm: 80, beatsPerBar: 3 })).toBe("3/4");
    expect(presetSignature({ bpm: 90, beatsPerBar: 6, beatUnit: 8 })).toBe(
      "6/8",
    );
    expect(presetSignature({ bpm: 100, beatsPerBar: 3, beatUnit: 8 })).toBeNull();
  });

  it("labels presets for chips: signature name or beats/unit", () => {
    expect(presetSignatureLabel({ bpm: 60, beatsPerBar: 4 })).toBe("4/4");
    expect(presetSignatureLabel({ bpm: 80, beatsPerBar: 3 })).toBe("3/4");
    expect(presetSignatureLabel({ bpm: 100, beatsPerBar: 3, beatUnit: 8 })).toBe(
      "3/8",
    );
  });
});
