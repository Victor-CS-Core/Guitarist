/** Cap mirrored by the server (server/checkins.ts): clips longer than this are rejected. */
export const MAX_RECORD_SECONDS = 90;

/** Preferred MediaRecorder mime types, best first. */
const RECORDER_PREFERENCE = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/ogg;codecs=opus",
  "audio/ogg",
];

/** Pick the best MediaRecorder mime type this browser claims to support, or null. */
export function pickRecorderMimeType(isTypeSupported: (mimeType: string) => boolean): string | null {
  for (const type of RECORDER_PREFERENCE) {
    try {
      if (isTypeSupported(type)) return type;
    } catch {
      /* treat a throwing probe as unsupported */
    }
  }
  return null;
}

/** Strip codec parameters so the server allowlist sees a bare type:
 *  "audio/webm;codecs=opus" -> "audio/webm". */
export function baseMimeType(mimeType: string): string {
  return mimeType.split(";")[0]?.trim().toLowerCase() || "audio/webm";
}

/** "1:30" style duration label. */
export function formatClipDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

/** Rough decoded byte count for a base64 string, used for client-side size checks. */
export function estimateDecodedBytes(base64: string): number {
  const padding = base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
}
