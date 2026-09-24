import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams, useBlocker } from "react-router-dom";
import { Play, Pause, Check, ArrowRight, Music2 } from "lucide-react";
import { useDemo, useStudent } from "../app/StoreProvider";
import { activityById } from "../curriculum/foundations";
import { Exercises } from "../student/Exercises";
import { elapsedSeconds } from "./timer";
import { Metronome } from "./Metronome";
export function PracticePage() {
  const { state, dispatch, setPracticeActive } = useDemo(),
    student = useStudent(),
    [params] = useSearchParams();
  const [items] = useState(() => {
    const all = state.assignments
      .filter((a) => a.studentId === student.id)
      .flatMap((a) => a.items);
    const requested = params.get("item");
    return requested
      ? all.filter((i) => i.id === requested)
      : all.filter((i) => !i.completed);
  });
  const [index, setIndex] = useState(0),
    [started, setStarted] = useState(false),
    [running, setRunning] = useState(false),
    [seconds, setSeconds] = useState(0),
    [done, setDone] = useState(false),
    [error, setError] = useState("");
  const segments = useRef<Array<{ start: number; end: number }>>([]),
    start = useRef<number | null>(null),
    session = useRef(crypto.randomUUID()),
    completed = useRef<string[]>([]),
    finished = useRef(false);
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
    if (start.current !== null) {
      segments.current.push({ start: start.current, end: performance.now() });
      start.current = null;
    }
    setRunning(false);
    setSeconds(elapsedSeconds(segments.current, null, performance.now()));
  }
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(
      () =>
        setSeconds(
          elapsedSeconds(segments.current, start.current, performance.now()),
        ),
      200,
    );
    const hide = () => {
      if (document.hidden) {
        if (start.current !== null) {
          segments.current.push({
            start: start.current,
            end: performance.now(),
          });
          start.current = null;
        }
        setRunning(false);
      }
    };
    document.addEventListener("visibilitychange", hide);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [running]);
  useEffect(() => {
    if (!started || done) return;
    const before = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, [started, done]);
  function begin() {
    start.current = performance.now();
    setStarted(true);
    setRunning(true);
  }
  async function advance(early = false) {
    if (finished.current) return;
    pause();
    const ids = early
      ? [...completed.current]
      : [...completed.current, items[index].id];
    completed.current = ids;
    if (!early && index < items.length - 1) {
      setIndex(index + 1);
      return;
    }
    const duration = elapsedSeconds(segments.current, null, performance.now());
    const result = await dispatch({
      type: "completePractice",
      studentId: student.id,
      sessionId: session.current,
      durationSeconds: duration,
      itemIds: ids,
      at: new Date().toISOString(),
    });
    if (result.ok) {
      finished.current = true;
      setSeconds(duration);
      setDone(true);
    } else setError(result.error);
  }
  if (done)
    return (
      <section className="card completion">
        <span className="completion-icon">
          <Check size={38} />
        </span>
        <div className="eyebrow green">YOU SHOWED UP FOR YOUR MUSIC</div>
        <h1>Practice complete.</h1>
        <p>That’s another small step forward, {student.name}.</p>
        <strong className="timer-display">
          {Math.floor(seconds / 60)}
          <small> min </small>
          {seconds % 60}
          <small> sec</small>
        </strong>
        <p>Actual time practiced · self-reported</p>
        <div className="completed-list">
          {items
            .filter((i) => completed.current.includes(i.id))
            .map((i) => (
              <p key={i.id}>
                <Check size={15} /> {activityById(i.activityId)?.title}
              </p>
            ))}
        </div>
        <p className="small">
          Only completed activities are checked off. Unfinished steps remain
          assigned.
        </p>
        <div className="teacher-tip">
          Your teacher can now see this session. They’ll listen to your playing
          at your next lesson.
        </div>
        <Link to="/student" className="button">
          Back home <ArrowRight size={17} />
        </Link>
      </section>
    );
  if (!items.length)
    return (
      <section className="card empty">
        <Music2 size={38} />
        <h1>You’re all caught up.</h1>
        <p>
          Your assigned practice is complete, or your teacher hasn’t assigned it
          yet.
        </p>
        <Link className="button" to="/student/learn">
          Explore your lessons
        </Link>
        <p className="small">You can revisit completed activities from Home.</p>
      </section>
    );
  const item = items[index],
    activity = activityById(item.activityId)!;
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
          <Metronome key={done ? "done" : "active"} />
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
          <div className="timer-display" aria-label="Practice elapsed time">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}
            <span>:</span>
            {String(seconds % 60).padStart(2, "0")}
          </div>
          <div className="timer-controls">
            <button className="button" onClick={running ? pause : begin}>
              {running ? <Pause size={17} /> : <Play size={17} />}{" "}
              {running ? "Pause" : started ? "Resume" : "Start practice"}
            </button>
            <span className="small">
              {running
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
              disabled={!started}
              onClick={() => advance()}
            >
              {index === items.length - 1 ? "Finish practice" : "Next activity"}{" "}
              <ArrowRight size={17} />
            </button>
          </div>
          <button
            className="text-link"
            disabled={!started || seconds === 0}
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

function LeavePractice({
  onStay,
  onLeave,
}: {
  onStay: () => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onStay();
      }}
    >
      <h2>Leave this practice?</h2>
      <p>
        Your unfinished session has not been saved. Stay to finish early and
        record your time, or leave and discard it.
      </p>
      <div className="row">
        <button className="button" autoFocus onClick={onStay}>
          Keep practicing
        </button>
        <button className="button secondary" onClick={onLeave}>
          Leave without saving
        </button>
      </div>
    </dialog>
  );
}
