/** Shared rhythm engine: time signatures, subdivisions, accents, tempo math. */

export type TimeSignature = "4/4" | "3/4" | "6/8" | "2/4" | "5/4" | "7/8";
export type Subdivision = "quarter" | "eighth" | "sixteenth" | "triplet";
export type AccentMode = "downbeat" | "all" | "custom";

export const MIN_BPM = 30;
export const MAX_BPM = 240;
export const DEFAULT_BPM = 60;

export interface SignatureInfo {
  beatsPerBar: number;
  /** Note value that gets one beat (4 = quarter note, 8 = eighth note). */
  beatUnit: number;
}

export const TIME_SIGNATURES: Record<TimeSignature, SignatureInfo> = {
  "4/4": { beatsPerBar: 4, beatUnit: 4 },
  "3/4": { beatsPerBar: 3, beatUnit: 4 },
  "6/8": { beatsPerBar: 6, beatUnit: 8 },
  "2/4": { beatsPerBar: 2, beatUnit: 4 },
  "5/4": { beatsPerBar: 5, beatUnit: 4 },
  "7/8": { beatsPerBar: 7, beatUnit: 8 },
};

export const TIME_SIGNATURE_LIST = Object.keys(
  TIME_SIGNATURES,
) as TimeSignature[];

export function beatsPerBar(sig: TimeSignature): number {
  return TIME_SIGNATURES[sig].beatsPerBar;
}

export function beatUnit(sig: TimeSignature): number {
  return TIME_SIGNATURES[sig].beatUnit;
}

/** Human label like "4 beats" used next to the beat dots. */
export function barBeatLabel(sig: TimeSignature): string {
  return `${beatsPerBar(sig)} beats`;
}

export const SUBDIVISIONS: Record<Subdivision, { label: string; ticksPerBeat: number }> = {
  quarter: { label: "Quarter notes", ticksPerBeat: 1 },
  eighth: { label: "Eighth notes", ticksPerBeat: 2 },
  sixteenth: { label: "Sixteenth notes", ticksPerBeat: 4 },
  triplet: { label: "Triplets", ticksPerBeat: 3 },
};

export const SUBDIVISION_LIST = Object.keys(SUBDIVISIONS) as Subdivision[];

export interface BarTick {
  beatIndex: number;
  tickIndex: number;
  ticksPerBeat: number;
  isBeat: boolean;
  isDownbeat: boolean;
}

/** Expand one bar into its individual ticks for the given subdivision. */
export function expandBar(
  sig: TimeSignature,
  subdivision: Subdivision,
): BarTick[] {
  const beats = beatsPerBar(sig);
  const ticksPerBeat = SUBDIVISIONS[subdivision].ticksPerBeat;
  const ticks: BarTick[] = [];
  for (let beat = 0; beat < beats; beat++) {
    for (let tick = 0; tick < ticksPerBeat; tick++) {
      ticks.push({
        beatIndex: beat,
        tickIndex: tick,
        ticksPerBeat,
        isBeat: tick === 0,
        isDownbeat: beat === 0 && tick === 0,
      });
    }
  }
  return ticks;
}

/**
 * Resolve whether a beat gets the accent click.
 * `custom` is a per-beat toggle list; missing entries fall back to downbeat.
 */
export function accentForBeat(
  mode: AccentMode,
  custom: boolean[],
  beatIndex: number,
): boolean {
  switch (mode) {
    case "downbeat":
      return beatIndex === 0;
    case "all":
      return true;
    case "custom":
      return beatIndex < custom.length ? custom[beatIndex] : beatIndex === 0;
  }
}

/** Default custom accents: downbeat on, the rest off. */
export function defaultCustomAccents(sig: TimeSignature): boolean[] {
  return Array.from({ length: beatsPerBar(sig) }, (_, i) => i === 0);
}

export function clampBpm(bpm: number): number {
  if (!Number.isFinite(bpm)) return DEFAULT_BPM;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(bpm)));
}

/** Seconds between beats at a BPM. */
export function beatIntervalSec(bpm: number): number {
  return 60 / bpm;
}

/** Milliseconds between beats at a BPM. */
export function beatIntervalMs(bpm: number): number {
  return 60000 / bpm;
}

/**
 * Estimate BPM from tap timestamps (ms). Uses the median interval so one
 * sloppy tap doesn't wreck the estimate. Null when there aren't 2+ taps.
 */
export function tapTempo(taps: number[], maxTaps = 8): number | null {
  const recent = taps.slice(-maxTaps);
  if (recent.length < 2) return null;
  const intervals: number[] = [];
  for (let i = 1; i < recent.length; i++) {
    const dt = recent[i] - recent[i - 1];
    if (dt > 0 && dt < 4000) intervals.push(dt);
  }
  if (intervals.length === 0) return null;
  intervals.sort((a, b) => a - b);
  const median = intervals[Math.floor(intervals.length / 2)];
  return clampBpm(60000 / median);
}

/* ------------------------------------------------------------------ */
/* Tempo presets: curriculum-suggested tempo for the in-session tools. */
/* ------------------------------------------------------------------ */

/**
 * A curriculum-suggested tempo: target BPM plus the time feel, described by
 * beats per bar and the note value that gets one beat.
 */
export interface TempoPreset {
  bpm: number;
  beatsPerBar: number;
  /** Note value that gets one beat (4 = quarter note, 8 = eighth note). Defaults to 4. */
  beatUnit?: number;
}

export const DEFAULT_BEAT_UNIT = 4;
/** Caps the dot count on compact metronome displays. */
export const MAX_BEATS_PER_BAR = 12;

export interface AppliedTempoPreset {
  bpm: number;
  beatsPerBar: number;
  beatUnit: number;
}

/**
 * Validate and clamp a preset into usable numbers. BPM uses the engine's
 * 30–240 window; beats are rounded to a whole number of at least 1.
 * Additive: callers that pass nothing keep today's behavior.
 */
export function applyTempoPreset(preset: TempoPreset): AppliedTempoPreset {
  const beats = Math.round(preset.beatsPerBar);
  return {
    bpm: clampBpm(preset.bpm),
    beatsPerBar: Math.min(
      MAX_BEATS_PER_BAR,
      Math.max(1, Number.isFinite(beats) ? beats : 4),
    ),
    beatUnit: preset.beatUnit ?? DEFAULT_BEAT_UNIT,
  };
}

/** Known signature name when a preset matches one (e.g. "3/4"), else null. */
export function presetSignature(preset: TempoPreset): TimeSignature | null {
  const unit = preset.beatUnit ?? DEFAULT_BEAT_UNIT;
  const match = TIME_SIGNATURE_LIST.find(
    (sig) =>
      TIME_SIGNATURES[sig].beatsPerBar === preset.beatsPerBar &&
      TIME_SIGNATURES[sig].beatUnit === unit,
  );
  return match ?? null;
}

/** Chip label for a preset: the signature name, or "beats/unit" when custom. */
export function presetSignatureLabel(preset: TempoPreset): string {
  return (
    presetSignature(preset) ??
    `${preset.beatsPerBar}/${preset.beatUnit ?? DEFAULT_BEAT_UNIT}`
  );
}
