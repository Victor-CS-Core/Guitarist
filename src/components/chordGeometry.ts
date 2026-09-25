import type { Voicing } from "../curriculum/chords";

/** A barre: one finger laid flat across adjacent strings. Indices run 0..5, where 0 is string 6. */
export interface BarreRun {
  fret: number;
  finger: number;
  from: number;
  to: number;
}

/** Maximal runs of adjacent strings sharing one finger at one fret. */
export function barreRuns(voicing: Voicing): BarreRun[] {
  const runs: BarreRun[] = [];
  let s = 0;
  while (s < 6) {
    const fret = voicing.frets[s];
    const finger = voicing.fingers[s];
    if (fret > 0 && finger > 0) {
      let e = s;
      while (
        e + 1 < 6 &&
        voicing.frets[e + 1] === fret &&
        voicing.fingers[e + 1] === finger
      )
        e++;
      if (e > s) runs.push({ fret, finger, from: s, to: e });
      s = e + 1;
    } else {
      s++;
    }
  }
  return runs;
}

export function voicingHasBarre(voicing: Voicing): boolean {
  return barreRuns(voicing).length > 0;
}

// Standard tuning, string index 0 = string 6 (low E). Semitones above C.
const OPEN_SEMITONES = [4, 9, 2, 7, 11, 4]; // E A D G B E
const NOTE_NAMES = [
  "C",
  "D♭",
  "D",
  "E♭",
  "E",
  "F",
  "G♭",
  "G",
  "A♭",
  "A",
  "B♭",
  "B",
];

/** Note name for a string at a fret in standard tuning. Null for muted strings. */
export function stringNoteName(stringIndex: number, fret: number): string | null {
  if (fret < 0) return null;
  return NOTE_NAMES[(OPEN_SEMITONES[stringIndex] + fret) % 12];
}
