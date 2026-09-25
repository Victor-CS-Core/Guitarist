import { useEffect, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import {
  accentForBeat,
  applyTempoPreset,
  barBeatLabel,
  beatIntervalMs,
  beatsPerBar,
  type TempoPreset,
  type TimeSignature,
} from "./rhythmEngine";

// The in-session metronome keeps its classic 4/4 feel; the engine supplies
// the beat math so the two never drift apart. A curriculum tempo preset can
// override the beats per bar (and the starting BPM) for one practice step.
const SIGNATURE: TimeSignature = "4/4";
// Practice-safe tempo window for this compact metronome (the full rhythm lab
// tool supports the engine's wider 30–240 range).
const MIN_BPM = 40;
const MAX_BPM = 80;

const clampCompactBpm = (bpm: number) =>
  Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(bpm)));

const COUNT_IN_WORDS = [
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
];

export function Metronome({ preset }: { preset?: TempoPreset }) {
  const applied = preset ? applyTempoPreset(preset) : null;
  const beats = applied?.beatsPerBar ?? beatsPerBar(SIGNATURE);
  const beatLabel = applied ? `${beats} beats` : barBeatLabel(SIGNATURE);
  const countInLabel =
    beats <= COUNT_IN_WORDS.length
      ? `${COUNT_IN_WORDS[beats - 1]}-beat count-in cue`
      : `${beats}-beat count-in cue`;
  const [bpm, setBpm] = useState(() => clampCompactBpm(applied?.bpm ?? 60)),
    [running, setRunning] = useState(false),
    [beat, setBeat] = useState(0),
    [warning, setWarning] = useState(""),
    [countIn, setCountIn] = useState(false);
  const audio = useRef<AudioContext | null>(null),
    count = useRef(0);
  useEffect(() => {
    if (!running) return;
    let next = (audio.current?.currentTime ?? performance.now() / 1000) + 0.08;
    let visual = performance.now() + 80;
    let tick = 0;
    count.current = 0;
    const pending = new Set<ReturnType<typeof setTimeout>>();
    const interval = setInterval(() => {
      const ctx = audio.current;
      const now = ctx?.currentTime ?? performance.now() / 1000;
      while (next < now + 0.12) {
        const n = tick++;
        if (ctx) {
          const osc = ctx.createOscillator(),
            gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.frequency.value = accentForBeat("downbeat", [], n % beats)
            ? 1000
            : 700;
          gain.gain.setValueAtTime(0.12, next);
          gain.gain.exponentialRampToValueAtTime(0.001, next + 0.06);
          osc.start(next);
          osc.stop(next + 0.07);
        }
        const delay = Math.max(0, visual - performance.now());
        const timer = setTimeout(() => {
          setBeat(n % beats);
          count.current = n + 1;
          pending.delete(timer);
        }, delay);
        pending.add(timer);
        next += 60 / bpm;
        visual += beatIntervalMs(bpm);
      }
    }, 25);
    const hidden = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener("visibilitychange", hidden);
    return () => {
      clearInterval(interval);
      pending.forEach(clearTimeout);
      document.removeEventListener("visibilitychange", hidden);
      void audio.current?.suspend();
    };
  }, [running, bpm, beats]);
  useEffect(
    () => () => {
      void audio.current?.close();
    },
    [],
  );
  async function toggle() {
    if (running) {
      setRunning(false);
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
  return (
    <section className="metronome">
      <div className="row spread">
        <h3>
          <Volume2 size={17} /> Your steady beat
        </h3>
        <span className="small">
          {countIn && running && count.current < beats
            ? "Count in…"
            : beatLabel}
        </span>
      </div>
      <div
        className="beat-dots"
        aria-label={running ? `Beat ${beat + 1}` : "Metronome stopped"}
      >
        {Array.from({ length: beats }, (_, n) => (
          <span
            className={running && beat === n ? "pulse active" : "pulse"}
            key={n}
          >
            {n + 1}
          </span>
        ))}
      </div>
      <div className="row spread">
        <label>
          BPM{" "}
          <input
            aria-label="Beats per minute"
            type="number"
            min={MIN_BPM}
            max={MAX_BPM}
            value={bpm}
            onChange={(e) => {
              setRunning(false);
              setBpm(
                Math.max(
                  MIN_BPM,
                  Math.min(MAX_BPM, Number(e.target.value) || MIN_BPM),
                ),
              );
            }}
          />
        </label>
        <button className="button secondary" onClick={() => void toggle()}>
          {running ? "Stop beat" : "Start beat"}
        </button>
      </div>
      <label className="check-label">
        <input
          type="checkbox"
          checked={countIn}
          onChange={(e) => setCountIn(e.target.checked)}
        />{" "}
        {countInLabel}
      </label>
      {warning && <p role="status">{warning}</p>}
    </section>
  );
}
