import { useEffect, useRef, useState } from "react";
import { Hourglass, Pause, Play, RotateCcw } from "lucide-react";
import {
  STUDY_TIMER_PRESETS_MIN,
  countdownProgress,
  createStudyTimer,
  formatClock,
  isCountdownFinished,
  pauseStudyTimer,
  resetStudyTimer,
  startStudyTimer,
  studyDisplaySeconds,
  type StudyTimerMode,
  type StudyTimerState,
} from "./studyTimer";

/** Gentle chime when a countdown finishes. Never throws (jsdom-safe). */
function finishChime() {
  try {
    const w = window as unknown as {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };
    const Ctor = w.AudioContext ?? w.webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    const t = ctx.currentTime;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    osc.start(t);
    osc.stop(t + 1);
    osc.onended = () => void ctx.close().catch(() => {});
  } catch {
    // Audio is a nicety here; the timer itself must never break.
  }
}

export function StudyTimerPage() {
  const [timer, setTimer] = useState<StudyTimerState>(() =>
    createStudyTimer("countdown", 25 * 60),
  );
  // Tick clock so the display updates while running.
  const [, setTick] = useState(0);
  const running = timer.activeStart !== null;
  const chimeRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setTimer((prev) => {
        const now = Date.now();
        if (isCountdownFinished(prev, now)) {
          if (!chimeRef.current) {
            chimeRef.current = true;
            finishChime();
          }
          return pauseStudyTimer(prev, now);
        }
        return prev;
      });
      setTick((n) => n + 1);
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const now = Date.now();
  const display = formatClock(studyDisplaySeconds(timer, now));
  const finished =
    timer.mode === "countdown" &&
    timer.targetSeconds > 0 &&
    isCountdownFinished(timer, now);
  const progress = countdownProgress(timer, now);

  function setMode(mode: StudyTimerMode) {
    chimeRef.current = false;
    setTimer((prev) =>
      resetStudyTimer({ ...prev, mode, segments: prev.segments }),
    );
  }

  function setPreset(minutes: number) {
    chimeRef.current = false;
    setTimer(resetStudyTimer(createStudyTimer("countdown", minutes * 60)));
  }

  return (
    <>
      <div className="page-heading">
        <div className="eyebrow green">PRACTICE TOOLS</div>
        <h1>Study timer</h1>
        <p>
          Set a focus block, pick up the guitar, and let the timer keep the
          time. Distinct from your in-session practice clock — this one is for
          whole practice blocks.
        </p>
      </div>

      <section className="card spaced">
        <div className="row spread">
          <div role="group" aria-label="Timer mode">
            {(["countdown", "countup"] as StudyTimerMode[]).map((m) => (
              <button
                key={m}
                className={`button secondary${timer.mode === m ? "" : " light"}`}
                aria-pressed={timer.mode === m}
                onClick={() => setMode(m)}
                style={{ marginRight: 8 }}
              >
                {m === "countdown" ? "Count down" : "Count up"}
              </button>
            ))}
          </div>
          <Hourglass size={18} aria-hidden />
        </div>

        {timer.mode === "countdown" && (
          <div
            role="group"
            aria-label="Preset durations"
            style={{ marginTop: 12 }}
          >
            {STUDY_TIMER_PRESETS_MIN.map((min) => (
              <button
                key={min}
                className={`button secondary${
                  timer.targetSeconds === min * 60 ? "" : " light"
                }`}
                aria-pressed={timer.targetSeconds === min * 60}
                onClick={() => setPreset(min)}
                style={{ marginRight: 8, marginBottom: 8 }}
              >
                {min} min
              </button>
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", margin: "24px 0 8px" }}>
          <div
            aria-live="polite"
            aria-label={finished ? "Time's up" : "Timer display"}
            style={{ fontSize: 64, fontWeight: 700, letterSpacing: 2 }}
          >
            {display}
          </div>
          <p className="small">
            {finished
              ? "Time's up — nice work. Shake out your hands and keep going, or take a bow."
              : timer.mode === "countdown"
                ? `Counting down from ${formatClock(timer.targetSeconds)}`
                : "Counting up — every minute with the guitar counts."}
          </p>
        </div>

        {timer.mode === "countdown" && (
          <div
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="timer-progress-track"
            style={{
              height: 8,
              borderRadius: 4,
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: "var(--er-green, #2f7d4f)",
                transition: "width .3s",
              }}
            />
          </div>
        )}

        <div className="row" style={{ gap: 8, justifyContent: "center" }}>
          <button
            className="button"
            onClick={() =>
              setTimer((prev) =>
                running
                  ? pauseStudyTimer(prev, Date.now())
                  : startStudyTimer(prev, Date.now()),
              )
            }
          >
            {running ? <Pause size={16} /> : <Play size={16} />}{" "}
            {running ? "Pause" : timer.segments.length > 0 ? "Resume" : "Start"}
          </button>
          <button
            className="button secondary"
            onClick={() => {
              chimeRef.current = false;
              setTimer((prev) => resetStudyTimer(prev));
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>
      </section>

      <section className="card spaced">
        <h2 className="section-heading" style={{ marginTop: 0 }}>
          A gentle way to use it
        </h2>
        <p className="small">
          Twenty-five minutes of focused playing beats two hours of noodling.
          Pick a block, silence the notifications, and work on one small thing
          — a chord change, a strumming pattern, a tricky measure. When the
          chime rings, you earned the break.
        </p>
      </section>
    </>
  );
}
