#!/usr/bin/env node
/**
 * generate-chords.mjs — builds src/curriculum/chords.ts, the Guitarist chord library dataset.
 *
 * Plain node, zero dependencies. Run: `node scripts/generate-chords.mjs`
 * (or `npm run chords:generate`).
 *
 * Method: for every root x quality, an exhaustive fretboard search over base
 * frets 0-11 finds candidate voicings in standard tuning. Every candidate must
 * satisfy hard rules (all sounding strings are chord tones, every chord tone
 * sounds, root in bass, fretted span <= 3). Candidates are scored for
 * idiomatic-ness (fullness, open strings, low positions, doubled root) and the
 * best up to 3 with distinct base frets are kept. A strict validator then
 * re-checks every emitted voicing and the script exits non-zero on any
 * violation — so a wrong note can never silently ship.
 *
 * The primary voicings of the 7 legacy chords (Em, Am, G, C, D, E, A) are
 * hand-pinned to their long-standing standard shapes so the chord-builder
 * exercise keeps teaching the exact shapes students already know.
 */

import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "src", "curriculum", "chords.ts");

// ---------------------------------------------------------------------------
// Music theory constants
// ---------------------------------------------------------------------------

// Standard tuning, string 6 -> 1, as pitch classes (C = 0).
const OPEN_PC = [4, 9, 2, 7, 11, 4]; // E A D G B E

// letter: index into LETTERS (C=0, D=1, E=2, F=3, G=4, A=5, B=6)
const ROOTS = [
  { key: "C",  display: "C",  pc: 0,  letter: 0 },
  { key: "C#", display: "C♯", pc: 1,  letter: 0 },
  { key: "D",  display: "D",  pc: 2,  letter: 1 },
  { key: "Eb", display: "E♭", pc: 3,  letter: 2 },
  { key: "E",  display: "E",  pc: 4,  letter: 2 },
  { key: "F",  display: "F",  pc: 5,  letter: 3 },
  { key: "F#", display: "F♯", pc: 6,  letter: 3 },
  { key: "G",  display: "G",  pc: 7,  letter: 4 },
  { key: "Ab", display: "A♭", pc: 8,  letter: 5 },
  { key: "A",  display: "A",  pc: 9,  letter: 5 },
  { key: "Bb", display: "B♭", pc: 10, letter: 6 },
  { key: "B",  display: "B",  pc: 11, letter: 6 },
];

// Tones as [semitones from root, diatonic letter steps from root letter].
// Accidentals are derived, not hardcoded, so spellings stay correct
// (e.g. the third of C# major is E#, the seventh of Cdim7 is Bbb).
const QUALITIES = [
  { key: "",      suffix: " major",   tones: [[0, 0], [4, 2], [7, 4]] },
  { key: "m",     suffix: " minor",   tones: [[0, 0], [3, 2], [7, 4]] },
  { key: "7",     suffix: "7",        tones: [[0, 0], [4, 2], [7, 4], [10, 6]] },
  { key: "maj7",  suffix: "maj7",     tones: [[0, 0], [4, 2], [7, 4], [11, 6]] },
  { key: "m7",    suffix: "m7",       tones: [[0, 0], [3, 2], [7, 4], [10, 6]] },
  { key: "dim",   suffix: " diminished", tones: [[0, 0], [3, 2], [6, 4]] },
  { key: "dim7",  suffix: "dim7",     tones: [[0, 0], [3, 2], [6, 4], [9, 6]] },
  { key: "m7b5",  suffix: "m7♭5",     tones: [[0, 0], [3, 2], [6, 4], [10, 6]] },
  { key: "aug",   suffix: " augmented", tones: [[0, 0], [4, 2], [8, 4]] },
  { key: "sus2",  suffix: "sus2",     tones: [[0, 0], [2, 1], [7, 4]] },
  { key: "sus4",  suffix: "sus4",     tones: [[0, 0], [5, 3], [7, 4]] },
  { key: "7sus4", suffix: "7sus4",    tones: [[0, 0], [5, 3], [7, 4], [10, 6]] },
  { key: "5",     suffix: "5",        tones: [[0, 0], [7, 4]] },
  { key: "6",     suffix: "6",        tones: [[0, 0], [4, 2], [7, 4], [9, 5]] },
  { key: "m6",    suffix: "m6",       tones: [[0, 0], [3, 2], [7, 4], [9, 5]] },
  { key: "9",     suffix: "9",        tones: [[0, 0], [4, 2], [7, 4], [10, 6], [14, 1]] },
  { key: "maj9",  suffix: "maj9",     tones: [[0, 0], [4, 2], [7, 4], [11, 6], [14, 1]] },
  { key: "m9",    suffix: "m9",       tones: [[0, 0], [3, 2], [7, 4], [10, 6], [14, 1]] },
  { key: "add9",  suffix: "add9",     tones: [[0, 0], [4, 2], [7, 4], [14, 1]] },
  { key: "madd9", suffix: "madd9",    tones: [[0, 0], [3, 2], [7, 4], [14, 1]] },
  { key: "69",    suffix: "6/9",      tones: [[0, 0], [4, 2], [7, 4], [9, 5], [14, 1]] },
  { key: "11",    suffix: "11",       tones: [[0, 0], [4, 2], [7, 4], [10, 6], [14, 1], [17, 3]] },
  { key: "m11",   suffix: "m11",      tones: [[0, 0], [3, 2], [7, 4], [10, 6], [14, 1], [17, 3]] },
  { key: "13",    suffix: "13",       tones: [[0, 0], [4, 2], [7, 4], [10, 6], [14, 1], [21, 5]] },
];

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_PC = [0, 2, 4, 5, 7, 9, 11];

/** Spell a chord tone: interval-aware so accidentals come out right. */
function noteName(rootPc, rootLetter, semi, letterSteps) {
  const targetPc = (rootPc + semi) % 12;
  const li = (rootLetter + letterSteps) % 7;
  let diff = targetPc - NATURAL_PC[li];
  diff = ((diff % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
  const acc =
    diff === 0 ? "" :
    diff === 1 ? "♯" :
    diff === -1 ? "♭" :
    diff === 2 ? "♯♯" :
    diff === -2 ? "♭♭" : null;
  if (acc === null) throw new Error(`cannot spell pc ${targetPc} on ${LETTERS[li]}`);
  return LETTERS[li] + acc;
}

// Hand-pinned primary voicings: the exact standard shapes the app has always taught.
const PINNED = {
  Em: { frets: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0] },
  Am: { frets: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0] },
  G:  { frets: [3, 2, 0, 0, 0, 3], fingers: [2, 1, 0, 0, 0, 3] },
  C:  { frets: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0] },
  D:  { frets: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2] },
  E:  { frets: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0] },
  A:  { frets: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0] },
};

// ---------------------------------------------------------------------------
// Fretboard search
// ---------------------------------------------------------------------------

/** All fret assignments for one base fret: per string, mute / open / valid frets. */
function candidatesForBase(tonePcs, base) {
  const lo = base === 0 ? 1 : base;
  const hi = base === 0 ? 4 : base + 3;
  const opts = [];
  for (let s = 0; s < 6; s++) {
    const o = [-1];
    if (base === 0 && tonePcs.has(OPEN_PC[s])) o.push(0);
    for (let f = lo; f <= hi; f++) {
      if (tonePcs.has((OPEN_PC[s] + f) % 12)) o.push(f);
    }
    opts.push(o);
  }
  const out = [];
  const cur = new Array(6);
  (function rec(s) {
    if (s === 6) { out.push([...cur]); return; }
    for (const f of opts[s]) { cur[s] = f; rec(s + 1); }
  })(0);
  return out;
}

/**
 * Hard rules + score. Returns null when the candidate is invalid.
 * Rules: >=3 sounding strings, every sounding string is a chord tone, every
 * chord tone sounds at least once, lowest sounding string is the root.
 */
function analyze(frets, rootPc, tonePcs, base) {
  const sounding = [];
  for (let i = 0; i < 6; i++) if (frets[i] >= 0) sounding.push(i);
  if (sounding.length < 3) return null;
  const pcs = sounding.map((i) => (OPEN_PC[i] + frets[i]) % 12);
  const set = new Set(pcs);
  if (set.size !== tonePcs.size) return null;
  for (const t of tonePcs) if (!set.has(t)) return null;
  if (pcs[0] !== rootPc) return null; // root in bass
  if (!frets.some((f) => f > 0)) return null;

  let s = sounding.length * 2;          // fuller voicings win
  s -= 6 - sounding.length;             // fewer muted strings
  if (base === 0) s += 4;               // open position preferred
  s += frets.filter((f) => f === 0).length; // ringing open strings
  if (pcs.filter((p) => p === rootPc).length >= 2) s += 2; // doubled root
  const loS = sounding[0], hiS = sounding[sounding.length - 1];
  for (let i = loS; i <= hiS; i++) if (frets[i] < 0) s -= 1.5; // no holes
  s -= base * 0.35;                     // lower positions first
  return { frets, score: s };
}

/**
 * Assign finger numbers. If the lowest fretted fret sits on >=3 strings it is
 * a barre (finger 1 across them); remaining fret groups take fingers 2,3,4 in
 * ascending fret order, strings sharing a fret sharing the finger.
 * The <=3-fret span guarantees we never need a finger above 4.
 */
function assignFingers(frets) {
  const fingers = [0, 0, 0, 0, 0, 0];
  const groups = new Map();
  frets.forEach((f, i) => {
    if (f > 0) {
      if (!groups.has(f)) groups.set(f, []);
      groups.get(f).push(i);
    }
  });
  const sorted = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  if (sorted.length === 0) return fingers;
  let next = 1;
  if (sorted[0][1].length >= 3) {
    sorted[0][1].forEach((i) => { fingers[i] = 1; });
    sorted.shift();
    next = 2;
  }
  for (const [, idxs] of sorted) {
    if (next > 4) break; // unreachable given the span rule; safety only
    idxs.forEach((i) => { fingers[i] = next; });
    next++;
  }
  return fingers;
}

/** baseFret for display: 0 = open position (nut shown), else the fret window start. */
function baseFretOf(frets) {
  if (frets.includes(0)) return 0;
  return Math.min(...frets.filter((f) => f > 0));
}

// ---------------------------------------------------------------------------
// Strict validator — any violation fails the whole run.
// ---------------------------------------------------------------------------

let failures = 0;
function fail(msg) {
  console.error(`VALIDATION FAILED: ${msg}`);
  failures++;
}

function validateVoicing(chordKey, rootPc, tonePcs, v) {
  const ctx = `${chordKey} [${v.label}] frets=${v.frets}`;
  const { frets, fingers, baseFret } = v;
  if (frets.length !== 6 || fingers.length !== 6) fail(`${ctx}: bad lengths`);
  const sounding = [];
  frets.forEach((f, i) => {
    if (!Number.isInteger(f) || f < -1 || f > 15) fail(`${ctx}: fret out of range: ${f}`);
    const fg = fingers[i];
    if (!Number.isInteger(fg) || fg < 0 || fg > 4) fail(`${ctx}: finger out of range: ${fg}`);
    if ((f <= 0) !== (fg === 0)) fail(`${ctx}: string ${6 - i}: finger must be 0 iff not fretted`);
    if (f >= 0) sounding.push(i);
  });
  const pcs = sounding.map((i) => (OPEN_PC[i] + frets[i]) % 12);
  const set = new Set(pcs);
  if (set.size !== tonePcs.size || ![...tonePcs].every((t) => set.has(t))) {
    fail(`${ctx}: pitch set {${[...set].sort((a, b) => a - b)}} != tones {${[...tonePcs].sort((a, b) => a - b)}}`);
  }
  if (!pcs.includes(rootPc)) fail(`${ctx}: root pitch missing`);
  if (pcs[0] !== rootPc) fail(`${ctx}: root not in bass`);
  const fretted = frets.filter((f) => f > 0);
  if (fretted.length === 0) {
    fail(`${ctx}: no fretted strings`);
  } else {
    const span = Math.max(...fretted) - Math.min(...fretted);
    if (span > 3) fail(`${ctx}: fret span ${span} > 3`);
    if (baseFret !== baseFretOf(frets)) fail(`${ctx}: baseFret ${baseFret} wrong`);
  }
}

// ---------------------------------------------------------------------------
// Generation
// ---------------------------------------------------------------------------

function buildChord(root, quality) {
  const key = root.key + quality.key;
  const tonePcs = new Set(quality.tones.map(([s]) => (root.pc + s) % 12));
  const notes = quality.tones.map(([s, ls]) => noteName(root.pc, root.letter, s, ls));

  const voicings = [];
  const pinned = PINNED[key];
  const searchBases = pinned
    ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
    : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  if (pinned) {
    voicings.push({ ...pinned, baseFret: 0, label: "Open" });
  }

  const seen = new Set();
  const cands = [];
  for (const base of searchBases) {
    for (const frets of candidatesForBase(tonePcs, base)) {
      const k = frets.join(",");
      if (seen.has(k)) continue;
      seen.add(k);
      const a = analyze(frets, root.pc, tonePcs, base);
      if (a) cands.push(a);
    }
  }
  cands.sort((a, b) => b.score - a.score);

  const usedBase = new Set(voicings.map((v) => v.baseFret));
  for (const c of cands) {
    const bf = baseFretOf(c.frets);
    if (usedBase.has(bf)) continue;
    usedBase.add(bf);
    voicings.push({
      frets: c.frets,
      fingers: assignFingers(c.frets),
      baseFret: bf,
      label: bf === 0 ? "Open" : `Fret ${bf}`,
    });
    if (voicings.length >= 3) break;
  }

  voicings.forEach((v) => validateVoicing(key, root.pc, tonePcs, v));
  if (voicings.length === 0) fail(`${key}: no voicing found`);

  const primary = voicings[0];
  return {
    key,
    name: root.display + quality.suffix,
    notes,
    root: root.key,
    quality: quality.key,
    frets: primary.frets,
    fingers: primary.fingers,
    baseFret: primary.baseFret,
    voicings,
  };
}

// ---------------------------------------------------------------------------
// Emit
// ---------------------------------------------------------------------------

function emit(chords) {
  const lines = [];
  lines.push(`export interface Voicing {`);
  lines.push(`  frets: number[];`);
  lines.push(`  fingers: number[];`);
  lines.push(`  baseFret: number;`);
  lines.push(`  label: string;`);
  lines.push(`}`);
  lines.push(`export interface Chord {`);
  lines.push(`  name: string;`);
  lines.push(`  notes: string[];`);
  lines.push(`  root: string;`);
  lines.push(`  quality: string;`);
  lines.push(`  frets: number[];`);
  lines.push(`  fingers: number[];`);
  lines.push(`  baseFret: number;`);
  lines.push(`  voicings: Voicing[];`);
  lines.push(`}`);
  lines.push(`// This file is generated by scripts/generate-chords.mjs — do not edit by hand.`);
  lines.push(`// Left to right on the diagram: strings 6 through 1. -1 means muted.`);
  lines.push(`// baseFret 0 shows the nut (open position); baseFret >= 1 is a movable shape.`);
  lines.push(`// Top-level frets/fingers/baseFret mirror voicings[0] for backward compatibility.`);
  lines.push(`export const chords: Record<string, Chord> = {`);
  for (const c of chords) {
    const vlines = c.voicings.map(
      (v) =>
        `      { frets: [${v.frets.join(", ")}], fingers: [${v.fingers.join(", ")}], baseFret: ${v.baseFret}, label: "${v.label}" },`
    );
    lines.push(`  "${c.key}": {`);
    lines.push(`    name: "${c.name}",`);
    lines.push(`    notes: [${c.notes.map((n) => `"${n}"`).join(", ")}],`);
    lines.push(`    root: "${c.root}",`);
    lines.push(`    quality: "${c.quality}",`);
    lines.push(`    frets: [${c.frets.join(", ")}],`);
    lines.push(`    fingers: [${c.fingers.join(", ")}],`);
    lines.push(`    baseFret: ${c.baseFret},`);
    lines.push(`    voicings: [`);
    lines.push(...vlines);
    lines.push(`    ],`);
    lines.push(`  },`);
  }
  lines.push(`};`);
  lines.push(``);
  writeFileSync(OUT, lines.join("\n"));
}

function main() {
  const chords = [];
  for (const root of ROOTS) {
    for (const quality of QUALITIES) {
      chords.push(buildChord(root, quality));
    }
  }
  if (failures > 0) {
    console.error(`\n${failures} validation failure(s) — refusing to write ${OUT}`);
    process.exit(1);
  }
  emit(chords);

  const totalVoicings = chords.reduce((n, c) => n + c.voicings.length, 0);
  console.log(`chords: ${chords.length}, voicings: ${totalVoicings}`);

  // Sanity samples for a human reviewer.
  for (const key of ["F", "Bb", "G9", "C13", "Em", "A"]) {
    const c = chords.find((x) => x.key === key);
    console.log(`\n${key} (${c.name}) — ${c.notes.join(" ")}`);
    for (const v of c.voicings) {
      console.log(`  ${v.label}: frets [${v.frets.join(" ")}] fingers [${v.fingers.join(" ")}]`);
    }
  }
}

main();
