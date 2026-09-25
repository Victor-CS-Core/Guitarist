import { describe, expect, it } from "vitest";
import {
  clampCents,
  detectPitch,
  frequencyToNote,
  isInTune,
  nearestString,
} from "./pitch";

/** Build a synthetic sine-wave buffer at `freq` Hz. */
function sine(
  freq: number,
  sampleRate = 44100,
  size = 4096,
  amplitude = 0.5,
): Float32Array {
  const buf = new Float32Array(size);
  for (let i = 0; i < size; i++) {
    buf[i] = amplitude * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  }
  return buf;
}

/** Cents between a detected frequency and its target. */
function centsOff(detected: number, target: number): number {
  return 1200 * Math.log2(detected / target);
}

describe("detectPitch", () => {
  it.each([82.41, 110, 146.83, 196, 246.94, 329.63, 440])(
    "detects a %s Hz sine within a few cents",
    (freq) => {
      const detected = detectPitch(sine(freq), 44100);
      expect(detected).not.toBeNull();
      expect(Math.abs(centsOff(detected!, freq))).toBeLessThan(8);
    },
  );

  it("detects a low E2-length period buffer", () => {
    // Low E needs a longer window so a full period fits; 8192 @ 44.1k holds ~15 periods.
    const detected = detectPitch(sine(82.41, 44100, 8192), 44100);
    expect(detected).not.toBeNull();
    expect(Math.abs(centsOff(detected!, 82.41))).toBeLessThan(8);
  });

  it("returns null for silence", () => {
    expect(detectPitch(new Float32Array(4096), 44100)).toBeNull();
  });

  it("returns null for tiny/empty buffers", () => {
    expect(detectPitch(new Float32Array(0), 44100)).toBeNull();
    expect(detectPitch(new Float32Array(8), 44100)).toBeNull();
  });

  it("handles a slightly detuned string", () => {
    const detected = detectPitch(sine(112), 44100);
    expect(detected).not.toBeNull();
    expect(Math.abs(centsOff(detected!, 112))).toBeLessThan(10);
  });
});

describe("frequencyToNote", () => {
  it("maps concert A", () => {
    const r = frequencyToNote(440);
    expect(r.noteName).toBe("A4");
    expect(r.midi).toBe(69);
    expect(r.cents).toBe(0);
  });

  it("maps the open guitar strings", () => {
    expect(frequencyToNote(82.41).noteName).toBe("E2");
    expect(frequencyToNote(110).noteName).toBe("A2");
    expect(frequencyToNote(146.83).noteName).toBe("D3");
    expect(frequencyToNote(196).noteName).toBe("G3");
    expect(frequencyToNote(246.94).noteName).toBe("B3");
    expect(frequencyToNote(329.63).noteName).toBe("E4");
  });

  it("reports cents deviation from the nearest note", () => {
    const sharp = frequencyToNote(440 * Math.pow(2, 20 / 1200));
    expect(sharp.noteName).toBe("A4");
    expect(sharp.cents).toBe(20);
    const flat = frequencyToNote(440 * Math.pow(2, -33 / 1200));
    expect(flat.noteName).toBe("A4");
    expect(flat.cents).toBe(-33);
  });
});

describe("nearestString", () => {
  it("picks the closest standard-tuning string", () => {
    expect(nearestString(110).string.stringNumber).toBe(5);
    expect(nearestString(82.41).string.stringNumber).toBe(6);
    expect(nearestString(329.63).string.stringNumber).toBe(1);
  });

  it("reports how far off the string is", () => {
    const { centsOff } = nearestString(110 * Math.pow(2, 12 / 1200));
    expect(centsOff).toBe(12);
  });
});

describe("tuner helpers", () => {
  it("clamps the needle to -50..+50", () => {
    expect(clampCents(80)).toBe(50);
    expect(clampCents(-99)).toBe(-50);
    expect(clampCents(23)).toBe(23);
  });

  it("calls ±5 cents in tune", () => {
    expect(isInTune(0)).toBe(true);
    expect(isInTune(5)).toBe(true);
    expect(isInTune(-5)).toBe(true);
    expect(isInTune(6)).toBe(false);
  });
});
