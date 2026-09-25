/** Pure DSP/math for the chromatic tuner. No DOM, no audio APIs. */

export interface PitchReading {
  /** Detected fundamental frequency in Hz. */
  frequency: number;
  /** Nearest MIDI note number. */
  midi: number;
  /** Nearest note name, e.g. "E2". */
  noteName: string;
  /** Cents the pitch sits above the nearest equal-tempered note. */
  cents: number;
}

const NOTE_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

export interface DetectPitchOptions {
  minHz?: number;
  maxHz?: number;
  /** RMS below this counts as silence. */
  silenceRms?: number;
}

/**
 * Autocorrelation pitch detection over a time-domain buffer.
 * Returns the fundamental frequency in Hz, or null for silence/too-short input.
 */
export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
  opts: DetectPitchOptions = {},
): number | null {
  const size = buf.length;
  if (size < 16 || !Number.isFinite(sampleRate) || sampleRate <= 0) return null;
  const minHz = opts.minHz ?? 40;
  const maxHz = opts.maxHz ?? 1500;

  let rms = 0;
  for (let i = 0; i < size; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / size);
  if (rms < (opts.silenceRms ?? 0.01)) return null;

  const minLag = Math.max(1, Math.floor(sampleRate / maxHz));
  const maxLag = Math.min(size - 2, Math.ceil(sampleRate / minHz));
  if (minLag >= maxLag) return null;

  const corr = new Float32Array(maxLag + 2);
  for (let lag = 0; lag <= maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < size - lag; i++) sum += buf[i] * buf[i + lag];
    corr[lag] = sum;
  }

  // Skip the initial descending lobe around lag 0 (overlap bias makes tiny
  // lags correlate strongest for low notes); the true period is the first
  // large peak after it.
  let d = minLag;
  while (d + 1 <= maxLag && corr[d] > corr[d + 1]) d++;
  if (d >= maxLag) return null;

  let bestLag = d;
  for (let lag = d + 1; lag <= maxLag; lag++) {
    if (corr[lag] > corr[bestLag]) bestLag = lag;
  }

  // Parabolic interpolation around the peak for sub-sample accuracy.
  const a = corr[bestLag - 1],
    b = corr[bestLag],
    c = corr[bestLag + 1];
  const denom = a - 2 * b + c;
  const shift = denom !== 0 ? (0.5 * (a - c)) / denom : 0;
  const period = bestLag + shift;
  if (period <= 0) return null;
  return sampleRate / period;
}

/** Convert a frequency in Hz to the nearest equal-tempered note. */
export function frequencyToNote(frequency: number): PitchReading {
  const midiFloat = 69 + 12 * Math.log2(frequency / 440);
  const midi = Math.round(midiFloat);
  const cents = Math.round(100 * (midiFloat - midi));
  const name = NOTE_NAMES[((midi % 12) + 12) % 12];
  const octave = Math.floor(midi / 12) - 1;
  return { frequency, midi, noteName: `${name}${octave}`, cents };
}

export interface StandardString {
  /** 1 = high E, 6 = low E. */
  stringNumber: 1 | 2 | 3 | 4 | 5 | 6;
  noteName: string;
  frequency: number;
}

export const STANDARD_TUNING: StandardString[] = [
  { stringNumber: 1, noteName: "E4", frequency: 329.63 },
  { stringNumber: 2, noteName: "B3", frequency: 246.94 },
  { stringNumber: 3, noteName: "G3", frequency: 196.0 },
  { stringNumber: 4, noteName: "D3", frequency: 146.83 },
  { stringNumber: 5, noteName: "A2", frequency: 110.0 },
  { stringNumber: 6, noteName: "E2", frequency: 82.41 },
];

/** Which standard-tuning string a frequency is closest to, and by how many cents. */
export function nearestString(frequency: number): {
  string: StandardString;
  centsOff: number;
} {
  let best = STANDARD_TUNING[0];
  let bestCents = 1200 * Math.log2(frequency / best.frequency);
  for (const s of STANDARD_TUNING) {
    const cents = 1200 * Math.log2(frequency / s.frequency);
    if (Math.abs(cents) < Math.abs(bestCents)) {
      best = s;
      bestCents = cents;
    }
  }
  return { string: best, centsOff: Math.round(bestCents) };
}

/** Clamp cents to the -50..+50 display window of the tuner needle. */
export function clampCents(cents: number): number {
  return Math.max(-50, Math.min(50, cents));
}

/** In-tune window: within ±5 cents. */
export function isInTune(cents: number): boolean {
  return Math.abs(cents) <= 5;
}
