import { useEffect, useRef, useState } from "react";
import { Check, Mic, MicOff, Play, Square } from "lucide-react";
import {
  STANDARD_TUNING,
  clampCents,
  detectPitch,
  frequencyToNote,
  isInTune,
  nearestString,
  type PitchReading,
} from "./pitch";

type MicStatus = "idle" | "requesting" | "listening" | "denied" | "unsupported";

function audioContextCtor(): typeof AudioContext | null {
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    return w.AudioContext ?? w.webkitAudioContext ?? null;
  } catch {
    return null;
  }
}

function mediaDevices(): MediaDevices | null {
  try {
    if (typeof navigator === "undefined") return null;
    return navigator.mediaDevices ?? null;
  } catch {
    return null;
  }
}

export function TunerPage() {
  const [status, setStatus] = useState<MicStatus>("idle");
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [refTone, setRefTone] = useState<string | null>(null);

  const audioRef = useRef<{
    ctx: AudioContext;
    analyser: AnalyserNode;
    stream: MediaStream;
    raf: number;
    lastUpdate: number;
  } | null>(null);
  const toneRef = useRef<{
    ctx: AudioContext;
    osc: OscillatorNode;
    gain: GainNode;
  } | null>(null);

  function stopMic() {
    const a = audioRef.current;
    audioRef.current = null;
    if (a) {
      cancelAnimationFrame(a.raf);
      a.stream.getTracks().forEach((t) => t.stop());
      void a.ctx.close().catch(() => {});
    }
    setStatus("idle");
    setReading(null);
  }

  async function startMic() {
    const devices = mediaDevices();
    const Ctor = audioContextCtor();
    if (!devices?.getUserMedia || !Ctor) {
      setStatus("unsupported");
      return;
    }
    setStatus("requesting");
    try {
      const stream = await devices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      const ctx = new Ctor();
      await ctx.resume().catch(() => {});
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 4096;
      source.connect(analyser);
      const buffer = new Float32Array(analyser.fftSize);
      const state = {
        ctx,
        analyser,
        stream,
        raf: 0,
        lastUpdate: 0,
      };
      const loop = () => {
        state.raf = requestAnimationFrame(loop);
        const now = performance.now();
        if (now - state.lastUpdate < 150) return;
        state.lastUpdate = now;
        analyser.getFloatTimeDomainData(buffer);
        const freq = detectPitch(buffer, ctx.sampleRate);
        setReading(freq === null ? null : frequencyToNote(freq));
      };
      state.raf = requestAnimationFrame(loop);
      audioRef.current = state;
      setStatus("listening");
    } catch (err) {
      const name = err instanceof Error ? err.name : "";
      setStatus(name === "NotAllowedError" ? "denied" : "unsupported");
    }
  }

  function stopRefTone() {
    const t = toneRef.current;
    toneRef.current = null;
    if (t) {
      try {
        t.gain.gain.setTargetAtTime(0.0001, t.ctx.currentTime, 0.05);
        t.osc.stop(t.ctx.currentTime + 0.2);
        t.osc.onended = () => void t.ctx.close().catch(() => {});
      } catch {
        /* best effort */
      }
    }
    setRefTone(null);
  }

  function playRefTone(noteName: string, frequency: number) {
    if (refTone === noteName) {
      stopRefTone();
      return;
    }
    stopRefTone();
    const Ctor = audioContextCtor();
    if (!Ctor) return;
    try {
      const ctx = new Ctor();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      void ctx.resume().catch(() => {});
      osc.start();
      toneRef.current = { ctx, osc, gain };
      setRefTone(noteName);
    } catch {
      /* audio unavailable */
    }
  }

  // Unmount-only cleanup; the component never needs to re-run this.
  useEffect(() => () => {
    stopMic();
    stopRefTone();
  }, []);

  const cents = reading ? clampCents(reading.cents) : 0;
  const inTune = reading ? isInTune(reading.cents) : false;
  const nearest = reading ? nearestString(reading.frequency) : null;
  const micAvailable =
    status === "idle" || status === "requesting" || status === "listening";

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">PRACTICE TOOLS</div>
        <h1>Chromatic tuner</h1>
        <p>
          Play any string and the tuner listens — or tune by ear with the
          reference tones below. A guitar that's in tune makes everything you
          practice sound twice as good.
        </p>
      </div>

      <section className="card spaced">
        <div className="row spread">
          <h2 className="section-heading" style={{ margin: 0 }}>
            Microphone tuner
          </h2>
          {status === "listening" ? (
            <button className="button secondary" onClick={stopMic}>
              <MicOff size={16} /> Stop listening
            </button>
          ) : (
            <button
              className="button"
              onClick={() => void startMic()}
              disabled={status === "requesting" || !micAvailable}
            >
              <Mic size={16} />{" "}
              {status === "requesting" ? "Asking for mic…" : "Start tuning"}
            </button>
          )}
        </div>

        {status === "listening" && (
          <div style={{ textAlign: "center", marginTop: 16 }}>
            {reading ? (
              <>
                <div
                  aria-live="polite"
                  style={{ fontSize: 56, fontWeight: 700 }}
                >
                  {reading.noteName}
                </div>
                <p
                  className="small"
                  style={{
                    color: inTune ? "var(--er-green, #2f7d4f)" : undefined,
                    fontWeight: inTune ? 700 : undefined,
                  }}
                >
                  {inTune ? (
                    <span>
                      <Check size={14} aria-hidden /> In tune — beautiful.
                    </span>
                  ) : reading.cents > 0 ? (
                    `${reading.cents} cents sharp — tune down a touch`
                  ) : reading.cents < 0 ? (
                    `${reading.cents} cents flat — tune up a touch`
                  ) : (
                    "Right on the note."
                  )}
                </p>
                {/* Cents needle, -50..+50 */}
                <div
                  role="img"
                  aria-label={`Cents deviation: ${reading.cents} cents`}
                  className="cents-gauge"
                  style={{
                    position: "relative",
                    height: 12,
                    borderRadius: 6,
                    margin: "12px auto",
                    maxWidth: 360,
                  }}
                >
                  <div
                    className="cents-gauge-needle"
                    style={{
                      position: "absolute",
                      top: -3,
                      bottom: -3,
                      width: 3,
                      borderRadius: 2,
                      left: `calc(${50 + cents}% - 1.5px)`,
                    }}
                  />
                </div>
                <p className="small">
                  Closest string: {nearest!.string.noteName} (string{" "}
                  {nearest!.string.stringNumber})
                  {nearest!.centsOff !== 0 &&
                    ` — ${nearest!.centsOff > 0 ? "+" : ""}${nearest!.centsOff} cents off it`}
                </p>
              </>
            ) : (
              <p className="small" aria-live="polite">
                Listening… play a string nice and steady.
              </p>
            )}
          </div>
        )}

        {status === "denied" && (
          <p className="small" role="status" style={{ marginTop: 12 }}>
            Microphone access was denied, so the tuner can't listen. Check the
            microphone permission in your browser's site settings and try again
            — or tune by ear with the reference tones below.
          </p>
        )}

        {status === "unsupported" && (
          <p className="small" role="status" style={{ marginTop: 12 }}>
            This browser couldn't open the microphone or audio playback, so
            listening isn't available here. The reference tones below may still
            work — or try a browser with microphone support.
          </p>
        )}

        {status === "idle" && (
          <p className="small" style={{ marginTop: 12 }}>
            The tuner needs your microphone to hear the strings. Nothing is
            recorded — the sound is analyzed live in your browser and never
            leaves your device.
          </p>
        )}
      </section>

      <section className="card spaced">
        <h2 className="section-heading" style={{ marginTop: 0 }}>
          Reference tones
        </h2>
        <p className="small">
          No microphone? No problem. Play a tone, then match your string to it
          by ear. Tap again to stop.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 8,
          }}
        >
          {STANDARD_TUNING.map((s) => (
            <button
              key={s.noteName}
              className={`button ${refTone === s.noteName ? "" : "secondary"}`}
              aria-pressed={refTone === s.noteName}
              onClick={() => playRefTone(s.noteName, s.frequency)}
            >
              {refTone === s.noteName ? (
                <Square size={14} />
              ) : (
                <Play size={14} />
              )}{" "}
              {s.noteName}
              <span className="small" style={{ marginLeft: 4 }}>
                str {s.stringNumber}
              </span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
