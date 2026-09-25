import { useEffect, useRef, useState } from "react";
import { Drum, Hand, Pause, Play } from "lucide-react";
import {
  MAX_BPM,
  MIN_BPM,
  SUBDIVISION_LIST,
  SUBDIVISIONS,
  TIME_SIGNATURE_LIST,
  accentForBeat,
  barBeatLabel,
  beatIntervalMs,
  beatIntervalSec,
  beatsPerBar,
  clampBpm,
  defaultCustomAccents,
  expandBar,
  tapTempo,
  type AccentMode,
  type Subdivision,
  type TimeSignature,
} from "../practice/rhythmEngine";

const ACCENT_MODES: Array<{ id: AccentMode; label: string }> = [
  { id: "downbeat", label: "Downbeat only" },
  { id: "all", label: "Every beat" },
  { id: "custom", label: "Custom" },
];

export function RhythmToolPage() {
  const [bpm, setBpm] = useState(80);
  const [signature, setSignature] = useState<TimeSignature>("4/4");
  const [subdivision, setSubdivision] = useState<Subdivision>("quarter");
  const [accentMode, setAccentMode] = useState<AccentMode>("downbeat");
  const [customAccents, setCustomAccents] = useState<boolean[]>(() =>
    defaultCustomAccents("4/4"),
  );
  const [countIn, setCountIn] = useState(false);
  const [countingIn, setCountingIn] = useState(false);
  const [running, setRunning] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [warning, setWarning] = useState("");

  const audio = useRef<AudioContext | null>(null);
  const countInRef = useRef(0);
  const visualBeatRef = useRef(0);
  const tapsRef = useRef<number[]>([]);

  const beats = beatsPerBar(signature);
  const ticksPerBeat = SUBDIVISIONS[subdivision].ticksPerBeat;

  useEffect(() => {
    if (!running) return;
    const barTicks = expandBar(signature, subdivision);
    const tickSec = beatIntervalSec(bpm) / ticksPerBeat;
    const tickMs = tickSec * 1000;
    const ciBeats = beatsPerBar(signature);
    countInRef.current = countIn ? ciBeats : 0;
    visualBeatRef.current = 0;
    setCurrentBeat(0);

    let next = (audio.current?.currentTime ?? performance.now() / 1000) + 0.08;
    let visual = performance.now() + 80;
    let tickCounter = 0;
    const pending = new Set<ReturnType<typeof setTimeout>>();

    function click(ctx: AudioContext | null, at: number, freq: number) {
      if (!ctx) return;
      const osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.14, at);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 0.06);
      osc.start(at);
      osc.stop(at + 0.07);
    }

    const interval = setInterval(() => {
      const ctx = audio.current;
      const now = ctx?.currentTime ?? performance.now() / 1000;
      while (next < now + 0.12) {
        if (countInRef.current > 0) {
          // Count-in: one click per beat before the pattern starts.
          if (tickCounter % ticksPerBeat === 0) {
            const idx = ciBeats - countInRef.current;
            countInRef.current -= 1;
            visualBeatRef.current = idx;
            click(ctx, next, idx === 0 ? 1000 : 700);
          }
        } else {
          const tick = barTicks[tickCounter % barTicks.length];
          visualBeatRef.current = tick.beatIndex;
          const accented = accentForBeat(
            accentMode,
            customAccents,
            tick.beatIndex,
          );
          const freq = tick.isDownbeat
            ? 1000
            : tick.isBeat
              ? accented
                ? 880
                : 700
              : 500;
          click(ctx, next, freq);
        }
        const beatSnapshot = visualBeatRef.current;
        const delay = Math.max(0, visual - performance.now());
        const timer = setTimeout(() => {
          setCurrentBeat(beatSnapshot);
          pending.delete(timer);
        }, delay);
        pending.add(timer);
        tickCounter++;
        next += tickSec;
        visual += tickMs;
      }
    }, 25);

    let countInTimer: ReturnType<typeof setTimeout> | undefined;
    if (countIn) {
      setCountingIn(true);
      countInTimer = setTimeout(
        () => setCountingIn(false),
        ciBeats * beatIntervalMs(bpm) + 120,
      );
    } else {
      setCountingIn(false);
    }

    const hidden = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearInterval(interval);
      if (countInTimer) clearTimeout(countInTimer);
      pending.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", hidden);
      void audio.current?.suspend();
    };
  }, [running, bpm, signature, subdivision, accentMode, customAccents, countIn, ticksPerBeat]);

  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );

  async function toggle() {
    if (running) {
      setRunning(false);
      setCountingIn(false);
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      setWarning("");
    } catch {
      audio.current = null;
      setWarning("Audio is unavailable. Follow the visual pulse.");
    }
    setRunning(true);
  }

  function handleTap() {
    const now = performance.now();
    const fresh = [...tapsRef.current, now]
      .filter((t) => now - t < 3000)
      .slice(-8);
    tapsRef.current = fresh;
    const tempo = tapTempo(fresh);
    if (tempo !== null) setBpm(tempo);
  }

  function changeSignature(sig: TimeSignature) {
    setSignature(sig);
    setCustomAccents(defaultCustomAccents(sig));
    setCurrentBeat(0);
  }

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">PRACTICE TOOLS</div>
        <h1>Rhythm lab</h1>
        <p>
          The full metronome: any time signature, subdivisions, accent
          patterns, and tap tempo. Lock in with the click and your strumming
          will thank you.
        </p>
      </div>

      <section className="card spaced">
        <div className="row spread">
          <h2 className="section-heading" style={{ margin: 0 }}>
            <Drum size={18} aria-hidden /> Your steady beat
          </h2>
          <span className="small">
            {countingIn && running ? "Count in…" : barBeatLabel(signature)}
          </span>
        </div>

        <div
          className="beat-dots"
          aria-label={running ? `Beat ${currentBeat + 1}` : "Rhythm lab stopped"}
          style={{ margin: "16px 0" }}
        >
          {Array.from({ length: beats }, (_, n) => {
            const accented = accentForBeat(accentMode, customAccents, n);
            return (
              <span
                className={running && currentBeat === n ? "pulse active" : "pulse"}
                key={n}
                title={accented ? `Beat ${n + 1} (accented)` : `Beat ${n + 1}`}
                style={
                  accented
                    ? { outline: "2px solid var(--er-green, #2f7d4f)" }
                    : undefined
                }
              >
                {n + 1}
              </span>
            );
          })}
        </div>

        <div className="row spread" style={{ alignItems: "center" }}>
          <label style={{ flex: 1, marginRight: 12 }}>
            Tempo: <strong>{bpm} BPM</strong>
            <input
              aria-label="Tempo in beats per minute"
              type="range"
              min={MIN_BPM}
              max={MAX_BPM}
              value={bpm}
              onChange={(e) => setBpm(clampBpm(Number(e.target.value)))}
              style={{ width: "100%" }}
            />
          </label>
          <button
            className="button secondary"
            onClick={handleTap}
            title="Tap along to the beat you feel"
          >
            <Hand size={16} /> Tap tempo
          </button>
        </div>

        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button className="button" onClick={() => void toggle()}>
            {running ? <Pause size={16} /> : <Play size={16} />}{" "}
            {running ? "Stop" : "Start"}
          </button>
        </div>

        {warning && (
          <p role="status" className="small">
            {warning}
          </p>
        )}
      </section>

      <section className="card spaced">
        <h2 className="section-heading" style={{ marginTop: 0 }}>
          Time signature
        </h2>
        <div role="group" aria-label="Time signature">
          {TIME_SIGNATURE_LIST.map((sig) => (
            <button
              key={sig}
              className={`button secondary${signature === sig ? "" : " light"}`}
              aria-pressed={signature === sig}
              onClick={() => changeSignature(sig)}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {sig}
            </button>
          ))}
        </div>
        <p className="small">
          {beats} beats per bar, beat unit{" "}
          {signature.endsWith("/4") ? "quarter note" : "eighth note"}.
        </p>
      </section>

      <section className="card spaced">
        <h2 className="section-heading" style={{ marginTop: 0 }}>
          Subdivision
        </h2>
        <div role="group" aria-label="Subdivision">
          {SUBDIVISION_LIST.map((sub) => (
            <button
              key={sub}
              className={`button secondary${subdivision === sub ? "" : " light"}`}
              aria-pressed={subdivision === sub}
              onClick={() => setSubdivision(sub)}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {SUBDIVISIONS[sub].label}
            </button>
          ))}
        </div>
        <p className="small">
          Each beat splits into {ticksPerBeat} click
          {ticksPerBeat === 1 ? "" : "s"} — subdivisions are how strumming
          patterns line up with the pulse.
        </p>
      </section>

      <section className="card spaced">
        <h2 className="section-heading" style={{ marginTop: 0 }}>
          Accents
        </h2>
        <div role="group" aria-label="Accent pattern">
          {ACCENT_MODES.map((m) => (
            <button
              key={m.id}
              className={`button secondary${accentMode === m.id ? "" : " light"}`}
              aria-pressed={accentMode === m.id}
              onClick={() => setAccentMode(m.id)}
              style={{ marginRight: 8, marginBottom: 8 }}
            >
              {m.label}
            </button>
          ))}
        </div>
        {accentMode === "custom" && (
          <div role="group" aria-label="Custom accents per beat">
            {customAccents.map((on, i) => (
              <button
                key={i}
                className={`button secondary${on ? "" : " light"}`}
                aria-pressed={on}
                aria-label={`Accent beat ${i + 1}`}
                onClick={() =>
                  setCustomAccents((prev) =>
                    prev.map((v, j) => (j === i ? !v : v)),
                  )
                }
                style={{ marginRight: 8, marginBottom: 8 }}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
        <p className="small">
          Accented beats click brighter and show a ring on the dots. Most songs
          lean on beat one — start there.
        </p>
      </section>

      <section className="card spaced">
        <label className="check-label">
          <input
            type="checkbox"
            checked={countIn}
            onChange={(e) => setCountIn(e.target.checked)}
          />{" "}
          Count-in before starting ({beats} beats)
        </label>
        <p className="small" style={{ marginTop: 8 }}>
          A one-bar count-in gives your hands a runway. The dots walk through
          the count so you can breathe in with the beat.
        </p>
      </section>
    </>
  );
}
