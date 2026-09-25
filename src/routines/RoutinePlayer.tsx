import { useEffect, useRef, useState } from "react";
import { Link, useBlocker, useNavigate } from "react-router-dom";
import {
  Play,
  Pause,
  Check,
  ArrowRight,
  Flame,
  Target,
  LayoutGrid,
  Music2,
  Waves,
} from "lucide-react";
import { useDemo, useStudent } from "../app/StoreProvider";
import { isAppUnlocked, routineMinutes, studentRoutines } from "../domain/selectors";
import { activityById } from "../curriculum/foundations";
import { chords } from "../curriculum/chords";
import { routineBlockKindLabels, type Routine, type RoutineBlockKind } from "../domain/types";
import { Exercises } from "../student/Exercises";
import { ChordDiagram } from "../components/ChordDiagram";
import { Metronome } from "../practice/Metronome";

const KIND_ICONS: Record<RoutineBlockKind, typeof Flame> = {
  warmup: Flame,
  technique: Target,
  chords: LayoutGrid,
  song: Music2,
  cooldown: Waves,
};

function formatClock(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60),
    s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function RoutinePlayer({ routineId }: { routineId: string }) {
  const { state } = useDemo();
  const student = useStudent();
  const routine = studentRoutines(state, student.id).find((r) => r.id === routineId);
  if (!routine || routine.blocks.length === 0)
    return (
      <section className="card empty">
        <h1>Routine not found.</h1>
        <p>It may have been deleted.</p>
        <Link className="button" to="/student/practice">Back to practice</Link>
      </section>
    );
  return <PlayerView routine={routine} />;
}

function PlayerView({ routine }: { routine: Routine }) {
  const { dispatch, setPracticeActive } = useDemo();
  const student = useStudent();
  const navigate = useNavigate();
  const appUnlocked = isAppUnlocked(student);

  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [running, setRunning] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [remaining, setRemaining] = useState(routine.blocks[0].minutes * 60);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const elapsed = useRef(0);
  const sessionId = useRef(crypto.randomUUID());
  const finished = useRef(false);
  const completedCount = useRef(0);

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

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      elapsed.current += 1;
      setRemaining((r) => {
        if (r <= 1) {
          setRunning(false);
          setTimeUp(true);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [running]);

  const block = routine.blocks[index];
  const activity = block.activityId ? activityById(block.activityId) : undefined;
  const KindIcon = KIND_ICONS[block.kind];

  function startBlock() {
    setStarted(true);
    setRunning(true);
    setTimeUp(false);
  }
  function pause() {
    setRunning(false);
  }
  function resume() {
    setTimeUp(false);
    setRunning(true);
  }
  async function advance() {
    if (finished.current) return;
    setRunning(false);
    setTimeUp(false);
    completedCount.current += 1;
    if (index < routine.blocks.length - 1) {
      const next = routine.blocks[index + 1];
      setIndex(index + 1);
      setRemaining(next.minutes * 60);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await dispatch({
        type: "completePractice",
        studentId: student.id,
        sessionId: sessionId.current,
        durationSeconds: elapsed.current,
        itemIds: [],
        routineId: routine.id,
        label: routine.name,
        at: new Date().toISOString(),
      });
      if (result.ok) {
        finished.current = true;
        setDone(true);
      } else {
        setError(result.error);
        setSaving(false);
      }
    } catch {
      setError("Could not save this session. Please try again.");
      setSaving(false);
    }
  }

  if (done)
    return (
      <section className="card completion">
        <span className="completion-icon">
          <Check size={38} />
        </span>
        <div className="eyebrow green">ROUTINE COMPLETE</div>
        <h1>You played “{routine.name}.”</h1>
        <p>
          {completedCount.current} {completedCount.current === 1 ? "block" : "blocks"} ·{" "}
          {Math.floor(elapsed.current / 60)} min{" "}
          {elapsed.current % 60 > 0 ? `${elapsed.current % 60} sec` : ""} of music.
        </p>
        <strong className="timer-display">
          {Math.floor(elapsed.current / 60)}
          <small> min </small>
          {elapsed.current % 60}
          <small> sec</small>
        </strong>
        <p>Actual time practiced · self-reported</p>
        <div className="teacher-tip">
          {appUnlocked
            ? "This session is logged in your practice history — just for you."
            : "Your teacher can now see this session. They’ll listen to your playing at your next lesson."}
        </div>
        <div className="row">
          <Link to="/student" className="button">
            Back home <ArrowRight size={17} />
          </Link>
          <Link to="/student/practice" className="text-link">
            Practice more
          </Link>
        </div>
      </section>
    );

  return (
    <>
      {blocker.state === "blocked" && (
        <LeaveRoutine onStay={() => blocker.reset()} onLeave={() => blocker.proceed()} />
      )}
      <div className="page-heading">
        <div className="eyebrow green">YOUR GUIDED SESSION</div>
        <h1>{routine.name}</h1>
        <p>
          {routine.blocks.length} blocks · about {routineMinutes(routine)} minutes · at your own pace
        </p>
      </div>
      <div className="practice-layout">
        <aside className="stack">
          <div className="card session-steps">
            <h3>The session</h3>
            {routine.blocks.map((b, n) => {
              const Icon = KIND_ICONS[b.kind];
              return (
                <div className={`session-step ${n === index ? "current" : ""}`} key={b.id}>
                  <span>{n < index ? <Check size={15} /> : <Icon size={15} />}</span>
                  <div>
                    <strong>{b.title}</strong>
                    <small>
                      {routineBlockKindLabels[b.kind]} · {b.minutes} min
                    </small>
                  </div>
                </div>
              );
            })}
          </div>
          {block.bpm && (
            <Metronome
              key={`routine-${block.id}`}
              preset={{ bpm: block.bpm, beatsPerBar: 4 }}
            />
          )}
        </aside>
        <section className="card practice-focus">
          <div className="row spread">
            <span className="eyebrow green">
              BLOCK {index + 1} OF {routine.blocks.length} · {routineBlockKindLabels[block.kind].toUpperCase()}
            </span>
            <span className="small">Aim for {block.minutes} min</span>
          </div>
          <h2>
            <KindIcon size={22} /> {block.title}
          </h2>
          {block.notes && <p>{block.notes}</p>}
          {activity && (
            <>
              <p>{activity.description}</p>
              <ol className="instructions">
                {activity.steps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <Exercises key={block.id} activity={activity} />
            </>
          )}
          {block.chordIds && block.chordIds.length > 0 && (
            <div className="chord-change-grid">
              {block.chordIds.map((id) => (
                <figure key={id} className="chord-change-cell">
                  <ChordDiagram chordId={id} compact />
                  <figcaption>{chords[id]?.name ?? id}</figcaption>
                </figure>
              ))}
            </div>
          )}
          {block.bpm && !activity && (
            <p className="small">
              The metronome on the side is set to {block.bpm} BPM — settle in before you speed up.
            </p>
          )}
          <div className="timer-display" aria-label="Time remaining in this block">
            {formatClock(remaining)}
          </div>
          {!started ? (
            <div className="timer-controls">
              <button className="button" onClick={startBlock}>
                <Play size={17} /> Start block
              </button>
              <span className="small">Tune up, breathe, begin.</span>
            </div>
          ) : timeUp ? (
            <div className="timer-controls">
              <button className="button" onClick={advance} disabled={saving}>
                {index === routine.blocks.length - 1 ? "Finish routine" : "Next block"} <ArrowRight size={17} />
              </button>
              <span className="small">Time’s up — lovely work. Move on when ready.</span>
            </div>
          ) : (
            <div className="timer-controls">
              <button className="button" onClick={running ? pause : resume}>
                {running ? <Pause size={17} /> : <Play size={17} />}{" "}
                {running ? "Pause" : "Resume"}
              </button>
              <button className="button secondary" onClick={advance} disabled={saving}>
                {index === routine.blocks.length - 1 ? "Finish early" : "Next block early"}
              </button>
            </div>
          )}
          {error && <p role="alert">{error}</p>}
          {started && !done && (
            <button
              className="text-link"
              onClick={() => navigate("/student/practice")}
            >
              Leave without saving
            </button>
          )}
        </section>
      </div>
    </>
  );
}

function LeaveRoutine({ onStay, onLeave }: { onStay: () => void; onLeave: () => void }) {
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
      <h2>Leave this routine?</h2>
      <p>
        Your unfinished session has not been saved. Stay to finish it, or leave
        and discard your time so far.
      </p>
      <div className="row">
        <button className="button" autoFocus onClick={onStay}>
          Keep playing
        </button>
        <button className="button secondary" onClick={onLeave}>
          Leave without saving
        </button>
      </div>
    </dialog>
  );
}
