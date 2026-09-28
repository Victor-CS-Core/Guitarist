import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Play, Clock3, Check, Target, Flame, CalendarClock, Timer, Drum, BookOpen, AudioWaveform, ListMusic, Smartphone } from "lucide-react";
import { useStudio, useStudent } from "../app/StoreProvider";
import { isAppUnlocked, studentRoutines } from "../domain/selectors";
import { levels, activityById } from "../curriculum/foundations";
import { dueDateLabel } from "../domain/selectors";
import { formatDueDate } from "../lib/format";
import { ActivityPreview } from "../components/ActivityPreview";
import { CheckInRecorder } from "./CheckInRecorder";
import { EmptyState } from "../components/EmptyState";
import { hasCelebratedUnlock, markUnlockCelebrated } from "../lib/celebration";
import { loadStudioSnapshot, saveStudioSnapshot } from "../lib/studioSnapshot";
import { RoutineCard } from "../routines/RoutineCard";
export function Dashboard() {
  const student = useStudent();
  if (isAppUnlocked(student)) return <UnlockedDashboard />;
  return <CourseDashboard />;
}

const QUICK_TOOLS = [
  { to: "/tools/tuner", icon: AudioWaveform, title: "Tuner", blurb: "Get every string in tune — mic needle or reference tones." },
  { to: "/tools/rhythm", icon: Drum, title: "Rhythm lab", blurb: "Metronome with time signatures, subdivisions, and tap tempo." },
  { to: "/tools/chords", icon: BookOpen, title: "Chord library", blurb: "Look up any chord, with finger numbers and string-by-string help." },
  { to: "/tools/timer", icon: Timer, title: "Study timer", blurb: "Count down a focus block or count up freely." },
];

/** One-tap setup that turns the installed web app into a personal offline
 * studio: the studio is saved to this phone, and from then on the app opens
 * with no sign-in and no connection. Audio check-ins need the teacher's
 * server, so they are hidden once the studio lives on the device. */
function OfflineStudioCard() {
  const { state, actor, studioMode } = useStudio();
  const [saved, setSaved] = useState(() => loadStudioSnapshot() !== null);
  const [failed, setFailed] = useState(false);
  if (studioMode)
    return (
      <p className="notice" role="status">
        <Smartphone size={16} aria-hidden /> Your studio lives on this phone —
        it opens with no sign-in, even with no connection.
      </p>
    );
  function save() {
    const ok = saveStudioSnapshot({ state, actor, savedAt: Date.now() });
    setFailed(!ok);
    if (ok) setSaved(true);
  }
  return (
    <section className="card" aria-label="Take your studio offline">
      <div className="row spread">
        <div>
          <h3>Take your studio offline</h3>
          <p className="small">
            Add Guitarist to your home screen, open it from there, and save
            your studio to this phone. After that it opens instantly — no
            sign-in, no connection needed.
          </p>
        </div>
        <span className="round-icon"><Smartphone size={23} /></span>
      </div>
      {saved ? (
        <p className="small" role="status">
          <Check size={16} aria-hidden /> Saved on this phone — opens offline
          with no sign-in.
        </p>
      ) : (
        <div className="row">
          <button className="button" type="button" onClick={save}>
            <Smartphone size={16} /> Save studio to this phone
          </button>
        </div>
      )}
      {failed && (
        <p role="alert" className="form-message">
          Couldn't save to this phone — check that private browsing is off and
          try again.
        </p>
      )}
    </section>
  );
}

function UnlockedDashboard() {
  const { state, studioMode } = useStudio(),
    student = useStudent(),
    [celebrated, setCelebrated] = useState(() =>
      hasCelebratedUnlock(student.id),
    );
  const sessions = state.sessions.filter((s) => s.studentId === student.id);
  const days = new Set(sessions.map((s) => new Date(s.at).toDateString())).size;
  const weekAgo = Date.now() - 7 * 86_400_000;
  const weekMinutes = Math.round(
    sessions
      .filter((s) => new Date(s.at).getTime() >= weekAgo)
      .reduce((n, s) => n + s.durationSeconds, 0) / 60,
  );
  const routines = studentRoutines(state, student.id);
  if (!celebrated)
    return (
      <section className="card hero celebration-card">
        <div className="hero-copy">
          <span className="pill">🎓 A GIFT FROM YOUR TEACHER</span>
          <h1>You did it, {student.name}!</h1>
          <p>
            You finished the course — and this app is yours to keep.
            No more assignments, no due dates. Just you, your guitar,
            and everything in your toolkit.
          </p>
          <div className="hero-actions">
            <button
              className="button light hero-start"
              onClick={() => {
                markUnlockCelebrated(student.id);
                setCelebrated(true);
              }}
            >
              Start exploring <ArrowRight size={17} />
            </button>
          </div>
        </div>
      </section>
    );
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div className="eyebrow green">YOUR PRACTICE STUDIO</div>
        <h1>
          Welcome back, {student.name}
          <span className="wave">✺</span>
        </h1>
        <p>The studio is yours now. Pick up right where your fingers left off.</p>
      </div>
      <OfflineStudioCard />
      <div className="section-heading">
        <div>
          <h2>Start playing</h2>
          <p>Your toolkit, ready whenever you are.</p>
        </div>
        <Link className="text-link" to="/tools">
          All tools <ArrowRight size={16} />
        </Link>
      </div>
      <div className="practice-cards">
        {QUICK_TOOLS.map(({ to, icon: Icon, title, blurb }) => (
          <Link to={to} className="practice-card" key={to}>
            <div className="practice-card-content">
              <span className="round-icon"><Icon size={23} /></span>
              <div className="eyebrow">TOOL</div>
              <h3>{title}</h3>
              <p>{blurb}</p>
              <div className="card-bottom">
                <span className="text-link">Open <ArrowRight size={16} /></span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {!studioMode && (
        <p className="small spaced">
          Sharing is optional now — record a check-in below only if you'd like
          your teacher's ears on your playing.
        </p>
      )}
      <div className="section-heading">
        <div>
          <h2>Your routines</h2>
          <p>Guided sessions you built — or your teacher shared with you.</p>
        </div>
        <Link className="text-link" to="/student/practice">
          Practice <ArrowRight size={16} />
        </Link>
      </div>
      {routines.length === 0 ? (
        <div className="card routine-card">
          <div className="row spread">
            <div>
              <h3>Design your perfect session</h3>
              <p className="small">
                Warm-up, technique, chord changes, song, cool-down — the player
                walks you through each block with a timer.
              </p>
            </div>
            <span className="round-icon"><ListMusic size={23} /></span>
          </div>
          <div className="row">
            <Link className="button" to="/student/routines/new">
              <Play size={16} /> Build a routine
            </Link>
          </div>
        </div>
      ) : (
        <div className="routine-grid">
          {routines.slice(0, 3).map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              playTo={`/student/routines/${r.id}/play`}
              editTo={r.createdBy === "student" ? `/student/routines/${r.id}/edit` : undefined}
            />
          ))}
        </div>
      )}
      {!studioMode && (
        <section id="audio-check-in" aria-label="Audio check-in">
          <CheckInRecorder />
        </section>
      )}
      <div className="dashboard-footer-note">
        <div className="small-stat">
          <Flame size={23} />
          <div>
            <strong>
              {days} practice {days === 1 ? "day" : "days"}
            </strong>
            <p>Every time you show up counts.</p>
          </div>
        </div>
        <div className="small-stat">
          <Clock3 size={23} />
          <div>
            <strong>{weekMinutes} min this week</strong>
            <p>Keep the strings warm.</p>
          </div>
        </div>
      </div>
    </>
  );
}

function CourseDashboard() {
  const { state } = useStudio(),
    student = useStudent(),
    level = levels.find((l) => l.id === student.currentLevelId);
  if (!level)
    return (
      <EmptyState
        title="Your chapter is missing"
        message="We couldn’t find your current chapter. Your teacher can get you back on track at your next lesson."
      />
    );
  const items = state.assignments
    .filter((a) => a.studentId === student.id)
    .flatMap((a) => a.items);
  const mastered = level.skills.filter(
    (s) => student.skills[s.id] === "MASTERED",
  ).length;
  const sessions = state.sessions.filter((s) => s.studentId === student.id);
  const days = new Set(sessions.map((s) => new Date(s.at).toDateString())).size;
  return (
    <>
      <div className="page-heading dashboard-heading">
        <div className="eyebrow green">LET’S MAKE A LITTLE MUSIC</div>
        <h1>
          Good to see you, {student.name}
          <span className="wave">✺</span>
        </h1>
        <p>Your next small step could be your favorite sound.</p>
      </div>
      <div className="dashboard-grid">
        <section className="hero">
          <div className="hero-copy">
            <span className="pill">
              LEVEL {level.order} <span>•</span> YOUR CURRENT CHAPTER
            </span>
            <h2>{level.title}</h2>
            <p>
              {level.description}
              <br />
              Let’s see what your fingers can do.
            </p>
            <div className="hero-actions">
              <Link to="/student/practice" className="button light hero-start">
                <Play size={17} fill="currentColor" /> Start practice
              </Link>
              <Link
                to={`/student/learn/${level.id}`}
                className="hero-lesson-link"
              >
                Explore this chapter <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-progress">
              <div>
                <span>
                  {mastered} of {level.skills.length} skills mastered
                </span>
                <span>
                  {Math.round((mastered / level.skills.length) * 100)}%
                </span>
              </div>
              <progress
                value={mastered}
                max={level.skills.length}
                aria-label={`${mastered} of ${level.skills.length} skills mastered`}
              />
              <small>One skill at a time. At your own pace.</small>
            </div>
          </div>
          <div className="hero-guitar" aria-hidden="true">
            <img
              src="/images/acoustic-guitar-hero.webp"
              alt=""
              width="1024"
              height="1536"
              fetchPriority="high"
            />
            <span className="guitar-caption">SIX STRINGS. YOUR STORY.</span>
          </div>
        </section>
        <aside className="goal-card">
          <span className="round-icon">
            <Target size={23} />
          </span>
          <div className="eyebrow">YOUR NEXT LITTLE WIN</div>
          <h3>{student.goal}</h3>
          <p>No rush. Your teacher will help you know when you’re ready.</p>
          <span className="teacher-sign">Your teacher is with you every step.</span>
        </aside>
      </div>
      <div className="section-heading">
        <div>
          <h2>
            Today’s practice{" "}
            <span className="count">
              {items.filter((i) => !i.completed).length}
            </span>
          </h2>
          <p>A few focused minutes. A little more confidence.</p>
        </div>
        <Link className="text-link" to="/student/practice">
          View practice <ArrowRight size={16} />
        </Link>
      </div>
      <div className="practice-cards">
        {items.length ? (
          items.slice(0, 3).map((item, index) => {
            const a = activityById(item.activityId);
            if (!a) return null;
            return (
              <Link
                to={`/student/practice?item=${item.id}`}
                className="practice-card"
                key={item.id}
              >
                <div className={`activity-art art-${index % 3}`}>
                  <ActivityPreview activity={a} />
                  <span className="activity-index">0{index + 1}</span>
                </div>
                <div className="practice-card-content">
                  <span className="eyebrow">
                    {a.kind === "builder"
                      ? "MEMORY & MOVEMENT"
                      : "GUIDED PRACTICE"}
                  </span>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                  {item.dueDate && (
                    <p className="small">
                      <CalendarClock size={12} /> {dueDateLabel(item.dueDate)} ·{" "}
                      {formatDueDate(item.dueDate)}
                    </p>
                  )}
                  <div className="card-bottom">
                    <span>
                      <Clock3 size={14} />
                      {item.minutes} min <span className="divider">·</span>{" "}
                      {item.repetitions} rounds
                    </span>
                    <span
                      className={item.completed ? "card-check" : "card-play"}
                    >
                      {item.completed ? (
                        <Check size={18} />
                      ) : (
                        <Play size={16} fill="currentColor" />
                      )}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })
        ) : (
          <div className="card">
            <h3>A little free time for music</h3>
            <p>
              Your teacher hasn’t assigned practice yet. Explore your current
              level.
            </p>
            <Link to="/student/learn">Go to Learn</Link>
          </div>
        )}
      </div>
      <section id="audio-check-in" aria-label="Audio check-in">
        <CheckInRecorder />
      </section>
      <div className="dashboard-footer-note">
        <div className="small-stat">
          <Flame size={23} />
          <div>
            <strong>
              {days} practice {days === 1 ? "day" : "days"}
            </strong>
            <p>Every time you show up counts.</p>
          </div>
        </div>
        <Link to="/student/progress" className="text-link">
          See your journey <ArrowRight size={16} />
        </Link>
      </div>
    </>
  );
}
