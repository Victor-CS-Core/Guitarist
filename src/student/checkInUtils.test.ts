import { describe, expect, test } from "vitest";
import {
  MAX_RECORD_SECONDS,
  baseMimeType,
  estimateDecodedBytes,
  formatClipDuration,
  pickRecorderMimeType,
} from "./checkInUtils";

describe("pickRecorderMimeType", () => {
  test("prefers opus webm when available", () => {
    expect(pickRecorderMimeType(() => true)).toBe("audio/webm;codecs=opus");
  });
  test("falls back through the preference list", () => {
    expect(pickRecorderMimeType((t) => t === "audio/mp4")).toBe("audio/mp4");
    expect(pickRecorderMimeType((t) => t === "audio/ogg")).toBe("audio/ogg");
  });
  test("returns null when nothing is supported, and survives throwing probes", () => {
    expect(pickRecorderMimeType(() => false)).toBeNull();
    expect(pickRecorderMimeType(() => { throw new Error("nope"); })).toBeNull();
  });
});

describe("baseMimeType", () => {
  test("strips codec parameters and lowercases", () => {
    expect(baseMimeType("audio/webm;codecs=opus")).toBe("audio/webm");
    expect(baseMimeType("AUDIO/MP4")).toBe("audio/mp4");
    expect(baseMimeType("audio/ogg")).toBe("audio/ogg");
  });
  test("falls back to audio/webm for empty input", () => {
    expect(baseMimeType("")).toBe("audio/webm");
  });
});

describe("formatClipDuration", () => {
  test("formats minutes and seconds", () => {
    expect(formatClipDuration(0)).toBe("0:00");
    expect(formatClipDuration(7)).toBe("0:07");
    expect(formatClipDuration(65)).toBe("1:05");
    expect(formatClipDuration(90)).toBe("1:30");
  });
  test("clamps negatives and floors fractions", () => {
    expect(formatClipDuration(-3)).toBe("0:00");
    expect(formatClipDuration(4.9)).toBe("0:04");
  });
});

describe("estimateDecodedBytes", () => {
  test("estimates decoded bytes with padding", () => {
    // "fake-audio-bytes" is 16 bytes -> base64 is 24 chars with one "=" pad.
    const base64 = btoa("fake-audio-bytes");
    expect(estimateDecodedBytes(base64)).toBe(16);
    expect(estimateDecodedBytes("AAAA")).toBe(3);
    expect(estimateDecodedBytes("AAA=")).toBe(2);
    expect(estimateDecodedBytes("AA==")).toBe(1);
  });
});

test("recording cap matches the server", () => {
  expect(MAX_RECORD_SECONDS).toBe(90);
});
