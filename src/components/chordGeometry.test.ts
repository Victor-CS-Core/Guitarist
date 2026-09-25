import { describe, expect, it } from "vitest";
import { barreRuns, stringNoteName, voicingHasBarre } from "./chordGeometry";
import type { Voicing } from "../curriculum/chords";

function voicing(frets: number[], fingers: number[], baseFret: number): Voicing {
  return { frets, fingers, baseFret, label: "test" };
}

describe("barreRuns", () => {
  it("finds the mini-barre in the open F shape", () => {
    const runs = barreRuns(voicing([1, 0, 3, 2, 1, 1], [1, 0, 3, 2, 1, 1], 0));
    expect(runs).toEqual([{ fret: 1, finger: 1, from: 4, to: 5 }]);
  });
  it("finds two barres in the Fret-1 F shape", () => {
    const runs = barreRuns(voicing([1, 3, 3, 2, 1, 1], [1, 3, 3, 2, 1, 1], 1));
    expect(runs).toEqual([
      { fret: 3, finger: 3, from: 1, to: 2 },
      { fret: 1, finger: 1, from: 4, to: 5 },
    ]);
  });
  it("finds no barre in the open C shape", () => {
    expect(barreRuns(voicing([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], 0))).toEqual([]);
  });
  it("does not merge non-adjacent strings sharing a finger", () => {
    // Finger 1 on strings 6, 2 and 1 with other fingers between: only 2+1 form a run.
    const runs = barreRuns(voicing([1, 0, 3, 2, 1, 1], [1, 0, 3, 2, 1, 1], 0));
    expect(runs).toHaveLength(1);
    expect(runs[0].from).toBe(4);
  });
  it("voicingHasBarre flags barre voicings", () => {
    expect(voicingHasBarre(voicing([1, 0, 3, 2, 1, 1], [1, 0, 3, 2, 1, 1], 0))).toBe(true);
    expect(voicingHasBarre(voicing([-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], 0))).toBe(false);
  });
});

describe("stringNoteName", () => {
  it("names open strings in standard tuning", () => {
    expect(["E", "A", "D", "G", "B", "E"].map((_, i) => stringNoteName(i, 0))).toEqual([
      "E",
      "A",
      "D",
      "G",
      "B",
      "E",
    ]);
  });
  it("moves up the chromatic scale with the fret", () => {
    expect(stringNoteName(0, 1)).toBe("F"); // low E string, fret 1
    expect(stringNoteName(0, 3)).toBe("G");
    expect(stringNoteName(5, 3)).toBe("G"); // high E string, fret 3
    expect(stringNoteName(2, 2)).toBe("E"); // D string, fret 2
  });
  it("returns null for muted strings", () => {
    expect(stringNoteName(0, -1)).toBeNull();
  });
});
