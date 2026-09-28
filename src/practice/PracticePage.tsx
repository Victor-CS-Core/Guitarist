import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useBlocker } from "react-router-dom";
import { Play, Pause, Check, ArrowRight, Music2, Timer } from "lucide-react";
import { useStudio, useStudent } from "../app/StoreProvider";
import { isAppUnlocked } from "../domain/selectors";
import { activityById } from "../curriculum/foundations";
import { Exercises } from "../student/Exercises";
import { presetSignatureLabel } from "./rhythmEngine";
import { Metronome } from "./Metronome";
import { RoutineSection } from "../routines/RoutineSection";
import { LeavePractice } from "./LeavePractice";
import { EmptyState } from "../components/EmptyState";
import { useSessionTimer } from "./useSessionTimer";
import { PracticeComplete } from "./PracticeComplete";
import { PracticeEmpty } from "./PracticeEmpty";

export function PracticePage() {
  const { state, dispatch, setPracticeActive } = useStudio(),
    student = useStudent(),
    [params] = useSearchParams();
  const appUnlocked = isAppUnlocked(student);
  const timer = useSessionTimer();
  const [items] = useState(() => {
    const all = state.assignments
      .filter((a) => a.studentId === student.id)
      .flatMap((a) => a.items);
    // Drop items whose activity no longer exists in the curriculum — they
    // can't be practiced, and rendering them would crash the page.
    const known = all.filter((i) => activityById(i.activityId) !== undefined);
    const requested = params.get("item");
    return requested
      ? known.filter((i) => i.id === requested)
      : known.filter((i) => !i.completed);
  });
  const [index, setIndex] = useState(0),
    [started, setStarted] = useState(false),
    [done, setDone] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    // Bumps each time the suggested-tempo chip is tapped, so the metronome
    // remounts and applies the activity's preset from scratch.
    [tempoRequest, setTempoRequest] = useState(0);
  const session = useRef(crypto.randomUUID()),
    completed = useRef<string[]>([]),
    finished = useRef(false),
    submitting = useRef(false);
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      started &&
      !done &&
      (currentLocation.pathname !== nextLocation.pathname ||
        currentLocation.search !== nextLocation.search),
  );
  useEffect(() => {
    setPracticeActive(started && !done);
    return () => setPracticeActive(false);
  }, [started, done, setPracticeActive]);
  function pause() {
    timer.pause();
  }
  useEffect(() => {
    if (!started || done) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [started, done]);
  function begin() {
    timer.begin();
    setStarted(true);
  }
  async function advance(early = false) {
    if (finished.current || submitting.current) return;
    pause();
    const ids = early
      ? [...completed.current]
      : [...completed.current, items[index].id];
    if (!early && index < items.length - 1) {
      completed.current = ids;
      setIndex(index + 1);
      return;
    }
    const duration = timer.elapsed();
    submitting.current = true;
    setSaving(true);
    setError("");
    try {
      const result = await dispatch({
        type: "completePractice",
        studentId: student.id,
        sessionId: session.current,
        durationSeconds: duration,
        itemIds: ids,
        at: new Date().toISOString(),
      });
      if (result.ok) {
        completed.current = ids;
        finished.current = true;
        timer.setSeconds(duration);
        setDone(true);
      } else setError(result.error);
    } finally {
      submitting.current = false;
      setSaving(false);
    }
  }
  if (done)
    return (
      <PracticeComplete
        seconds={timer.seconds}
        items={items}
        completedIds={completed.current}
        studentName={student.name}
        appUnlocked={appUnlocked}
      />
    );
  if (!items.length) return <PracticeEmpty appUnlocked={appUnlocked} />;
  const item = items[index],
    activity = activityById(item.activityId);
  if (!activity)
    return (
      <EmptyState
        icon={<Music2 size={38} />}
        title="This activity isn’t available."
        message="It may have been removed from the curriculum."
      >
        <Link className="button" to="/student">
          Back home <ArrowRight size={17} />
        </Link>
      </EmptyState>
    );
  return (
    <>
      {blocker.state === "blocked" && (
        <LeavePractice
          onStay={() => blocker.reset()}
          onLeave={() => blocker.proceed()}
        />
      )}
      <div className="page-heading">
        <div className="eyebrow green">
          A LITTLE TIME JUST FOR YOU & YOUR GUITAR
        </div>
        <h1>Let’s practice.</h1>
        <p>
          {items.length} activities · about{" "}
          {items.reduce((n, i) => n + i.minutes, 0)} minutes · at your own pace
        </p>
      </div>
      <RoutineSection />
      <div className="practice-layout">
        <aside className="stack">
          <div className="card session-steps">
            <h3>Today’s small steps</h3>
            {items.map((i, n) => (
              <div
                className={`session-step ${n === index ? "current" : ""}`}
                key={i.id}
              >
                <span>{n < index ? <Check size={15} /> : n + 1}</span>
                <div>
                  <strong>{activityById(i.activityId)?.title}</strong>
                  <small>
                    {i.minutes} min · {i.repetitions} rounds
                  </small>
                </div>
              </div>
            ))}
          </div>
          <Metronome
            key={
              tempoRequest > 0
                ? `tempo-${tempoRequest}`
                : done
                  ? "done"
                  : "active"
            }
            preset={tempoRequest > 0 ? activity.tempo : undefined}
          />
        </aside>
        <section className="card practice-focus">
          <div className="row spread">
            <span className="eyebrow green">
              STEP {index + 1} OF {items.length}
            </span>
            <span className="small">
              Aim for {item.minutes} min · {item.repetitions} rounds
            </span>
          </div>
          <h2>{activity.title}</h2>
          <p>{activity.description}</p>
          {activity.tempo && (
            <div className="row">
              <button
                className="button secondary"
                onClick={() => setTempoRequest((n) => n + 1)}
                aria-label={`Load the suggested tempo of ${activity.tempo.bpm} BPM in ${presetSignatureLabel(activity.tempo)} into the metronome`}
              >
                <Timer size={15} /> Suggested: {activity.tempo.bpm} BPM ·{" "}
                {presetSignatureLabel(activity.tempo)}
              </button>
              <span className="small">Tap to load it into the metronome.</span>
            </div>
          )}
          <div className="timer-display" aria-label="Practice elapsed time">
            {String(Math.floor(timer.seconds / 60)).padStart(2, "0")}
            <span>:</span>
            {String(timer.seconds % 60).padStart(2, "0")}
          </div>
          <div className="timer-controls">
            <button
              className="button"
              onClick={timer.running ? pause : begin}
            >
              {timer.running ? <Pause size={17} /> : <Play size={17} />}{" "}
              {timer.running ? "Pause" : started ? "Resume" : "Start practice"}
            </button>
            <span className="small">
              {timer.running
                ? "Make a little music."
                : started
                  ? "Paused. Take your time."
                  : "Ready when you are."}
            </span>
          </div>
          <ol className="instructions">
            {activity.steps.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
          <Exercises key={item.id} activity={activity} />
          <div className="focus-bottom">
            <p className="small">
              A timer records time, not mastery. Your teacher listens for that.
            </p>
            <button
              className="button"
              disabled={!started || saving}
              onClick={() => advance()}
            >
              {index === items.length - 1 ? "Finish practice" : "Next activity"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
          <button
            className="text-link"
            disabled={!started || timer.seconds === 0 || saving}
            onClick={() => advance(true)}
          >
            Finish early
          </button>
          {error && <p role="alert">{error}</p>}
        </section>
      </div>
    </>
  );
}
