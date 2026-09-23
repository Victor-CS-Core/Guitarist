export interface Chord {
  name: string;
  frets: number[];
  fingers: number[];
}
// Left to right on the diagram: strings 6 through 1. -1 means muted.
export const chords: Record<string, Chord> = {
  Em: {
    name: "E minor",
    frets: [0, 2, 2, 0, 0, 0],
    fingers: [0, 2, 3, 0, 0, 0],
  },
  Am: {
    name: "A minor",
    frets: [-1, 0, 2, 2, 1, 0],
    fingers: [0, 0, 2, 3, 1, 0],
  },
};
