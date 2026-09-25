import { useCallback, useEffect, useRef, useState } from "react";
import { AudioLines, Check, Mic, Square, Trash2, Upload } from "lucide-react";
import { apiRequest } from "../auth/api";
import {
  MAX_RECORD_SECONDS,
  baseMimeType,
  estimateDecodedBytes,
  formatClipDuration,
  pickRecorderMimeType,
} from "./checkInUtils";

export interface CheckinSummary {
  id: string;
  studentId: string;
  studentName: string | null;
  mime: string;
  durationSeconds: number;
  createdAt: string;
}

type Phase = "idle" | "requesting" | "recording" | "preview" | "uploading";
type Failure = "denied" | "unsupported" | "upload" | "too-big" | null;

interface Preview {
  url: string;
  blob: Blob;
  mime: string;
  duration: number;
}

interface Session {
  recorder: MediaRecorder;
  stream: MediaStream;
  chunks: Blob[];
}

function micSupported(): boolean {
  try {
    return typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;
  } catch {
    return false;
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      const comma = result.indexOf(",");
      if (comma < 0) return reject(new Error("encode failed"));
      resolve(result.slice(comma + 1));
    };
    reader.onerror = () => reject(new Error("encode failed"));
    reader.readAsDataURL(blob);
  });
}

export function CheckInRecorder() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [failure, setFailure] = useState<Failure>(null);
  const [failureDetail, setFailureDetail] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [uploaded, setUploaded] = useState(false);
  const [mine, setMine] = useState<CheckinSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);

  const sessionRef = useRef<Session | null>(null);
  const timerRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const previewRef = useRef<Preview | null>(null);
  previewRef.current = preview;

  const stopTimer = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const stopSession = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    stopTimer();
    if (!session) return;
    try {
      if (session.recorder.state !== "inactive") session.recorder.stop();
    } catch {
      /* already stopped */
    }
    session.stream.getTracks().forEach((track) => track.stop());
  }, [stopTimer]);

  const discardPreview = useCallback(() => {
    const current = previewRef.current;
    previewRef.current = null;
    setPreview(null);
    if (current) URL.revokeObjectURL(current.url);
    setPhase("idle");
  }, []);

  // Unmount-only cleanup; everything else is driven by explicit stop calls.
  useEffect(() => () => {
    stopSession();
    const current = previewRef.current;
    if (current) URL.revokeObjectURL(current.url);
  }, [stopSession]);

  const loadMine = useCallback(async () => {
    try {
      const result = await apiRequest<{ checkins: CheckinSummary[] } | { error: string }>("/api/checkins");
      if (result.status === 200 && "checkins" in result.data) setMine(result.data.checkins);
    } catch {
      /* list is a nicety; the recorder still works */
    } finally {
      setLoadingList(false);
    }
  }, []);
  useEffect(() => { void loadMine(); }, [loadMine]);

  const finishFromChunks = useCallback((chunks: Blob[], stream: MediaStream, recorderMime: string) => {
    stream.getTracks().forEach((track) => track.stop());
    stopTimer();
    sessionRef.current = null;
    const duration = Math.min(MAX_RECORD_SECONDS, Math.max(1, Math.round((Date.now() - startRef.current) / 1000)));
    const mime = baseMimeType(recorderMime || "audio/webm");
    const blob = new Blob(chunks, { type: mime });
    discardPreview();
    setPreview({ url: URL.createObjectURL(blob), blob, mime, duration });
    setElapsed(duration);
    setPhase("preview");
  }, [discardPreview, stopTimer]);

  const stopRecording = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.recorder.state === "inactive") return;
    try {
      session.recorder.stop();
    } catch {
      // If stop() itself throws, finish with the chunks we already have.
      finishFromChunks(session.chunks, session.stream, session.recorder.mimeType);
    }
  }, [finishFromChunks]);

  async function startRecording() {
    setFailure(null);
    setFailureDetail("");
    setUploaded(false);
    if (!micSupported()) {
      setFailure("unsupported");
      return;
    }
    setPhase("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = pickRecorderMimeType((type) => {
        try {
          return MediaRecorder.isTypeSupported(type);
        } catch {
          return false;
        }
      });
      const session: Session = { recorder: null as unknown as MediaRecorder, stream, chunks: [] };
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      session.recorder = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size) session.chunks.push(event.data);
      };
      recorder.onstop = () => finishFromChunks(session.chunks, stream, recorder.mimeType);
      sessionRef.current = session;
      recorder.start(250);
      startRef.current = Date.now();
      setElapsed(0);
      setPhase("recording");
      timerRef.current = window.setInterval(() => {
        const seconds = Math.floor((Date.now() - startRef.current) / 1000);
        setElapsed(seconds);
        if (seconds >= MAX_RECORD_SECONDS) stopRecording();
      }, 250);
    } catch (err) {
      setPhase("idle");
      setFailure(err instanceof Error && err.name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }

  async function uploadPreview() {
    const current = previewRef.current;
    if (!current || phase === "uploading") return;
    setPhase("uploading");
    setFailure(null);
    setFailureDetail("");
    try {
      const base64 = await blobToBase64(current.blob);
      if (estimateDecodedBytes(base64) > 1_600_000) {
        setPhase("preview");
        setFailure("too-big");
        return;
      }
      const result = await apiRequest<{ id: string } | { error: string }>("/api/checkins", {
        method: "POST",
        body: JSON.stringify({
          audioBase64: base64,
          mime: current.mime,
          durationSeconds: current.duration,
        }),
      });
      if (result.status !== 201 || !("id" in result.data)) {
        setPhase("preview");
        setFailure("upload");
        setFailureDetail("error" in result.data ? result.data.error : "");
        return;
      }
      discardPreview();
      setUploaded(true);
      void loadMine();
    } catch {
      setPhase("preview");
      setFailure("upload");
    }
  }

  async function deleteMine(id: string) {
    if (!window.confirm("Delete this check-in? Your teacher won't be able to hear it anymore.")) return;
    try {
      const result = await apiRequest<{ ok: true } | { error: string }>(`/api/checkins/${id}`, { method: "DELETE" });
      if (result.status === 200) setMine((list) => list.filter((clip) => clip.id !== id));
    } catch {
      /* leave the row; the user can retry */
    }
  }

  const recording = phase === "recording";
  return (
    <section className="card spaced" aria-labelledby="check-in-heading">
      <div className="row spread">
        <h2 id="check-in-heading" style={{ margin: 0 }}>
          <AudioLines size={20} aria-hidden /> Audio check-in
        </h2>
        {recording && (
          <span className="status" aria-live="polite">
            <span
              aria-hidden
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#c0392b",
                marginRight: 6,
              }}
            />
            {formatClipDuration(elapsed)} / {formatClipDuration(MAX_RECORD_SECONDS)}
          </span>
        )}
      </div>
      <p className="small">
        Record up to {formatClipDuration(MAX_RECORD_SECONDS)} of your playing and send it to your teacher —
        a riff you're proud of, or one that's giving you trouble.
      </p>

      {phase === "idle" && (
        <button className="button" type="button" onClick={() => void startRecording()}>
          <Mic size={16} /> Record a check-in
        </button>
      )}
      {phase === "requesting" && (
        <p className="small" role="status">Asking for your microphone…</p>
      )}
      {recording && (
        <div className="row">
          <button className="button secondary" type="button" onClick={stopRecording}>
            <Square size={14} /> Stop recording
          </button>
          <p className="small" role="status" style={{ margin: 0 }}>Recording stops automatically at {formatClipDuration(MAX_RECORD_SECONDS)}.</p>
        </div>
      )}
      {phase === "preview" && preview && (
        <div className="stack">
          <audio controls src={preview.url} preload="metadata" />
          <p className="small" style={{ margin: 0 }}>
            {formatClipDuration(preview.duration)} · {preview.mime} — have a listen, then send it or record again.
          </p>
          <div className="row">
            <button className="button" type="button" onClick={() => void uploadPreview()}>
              <Upload size={16} /> Send to my teacher
            </button>
            <button className="button secondary" type="button" onClick={discardPreview}>
              Discard
            </button>
          </div>
        </div>
      )}
      {phase === "uploading" && (
        <p className="small" role="status">Sending your check-in…</p>
      )}
      {uploaded && phase === "idle" && (
        <p className="small" role="status">
          <Check size={14} aria-hidden /> Sent! Your teacher can listen to it now.
        </p>
      )}

      {failure === "denied" && (
        <p className="small" role="alert">
          Microphone access was denied, so nothing could be recorded. Allow the microphone in your
          browser's site settings and try again.
        </p>
      )}
      {failure === "unsupported" && (
        <p className="small" role="alert">
          This browser can't record audio here. Try a recent version of Chrome, Edge, Firefox, or Safari.
        </p>
      )}
      {failure === "too-big" && (
        <p className="small" role="alert">
          That recording came out larger than expected. Try a shorter take and send it again.
        </p>
      )}
      {failure === "upload" && (
        <p className="small" role="alert">
          The upload didn't go through{failureDetail ? ` — ${failureDetail}` : ""}. Your recording is still
          here; try sending it again.
        </p>
      )}

      <div className="checkin-history">
        <h3 className="small" style={{ marginBottom: 8 }}>Your check-ins</h3>
        {loadingList ? (
          <p className="small">Loading…</p>
        ) : mine.length ? (
          <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {mine.map((clip) => (
              <li key={clip.id} className="activity-row">
                <AudioLines size={18} aria-hidden />
                <div>
                  <strong>{formatClipDuration(clip.durationSeconds)}</strong>
                  <p className="small" style={{ margin: 0 }}>
                    {new Date(clip.createdAt).toLocaleDateString()} · {new Date(clip.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                  </p>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => void deleteMine(clip.id)}
                  aria-label={`Delete check-in from ${new Date(clip.createdAt).toLocaleDateString()}`}
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="small">Nothing sent yet — your first check-in will appear here.</p>
        )}
      </div>
    </section>
  );
}
