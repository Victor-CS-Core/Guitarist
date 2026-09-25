import { useState, type CSSProperties } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Clock3, CalendarClock } from "lucide-react";
import { useDemo } from "../app/StoreProvider";
import { levels, skills, activityById } from "../curriculum/foundations";
import { StatusBadge } from "../components/StatusBadge";
import { canUnlock, dueDateLabel, formatDueDate, isOverdue } from "../domain/selectors";
import { AssessmentForm } from "./AssessmentForm";
import { AssignmentForm } from "./AssignmentForm";
import { StudentRoutines } from "./StudentRoutines";

const overdueBadge: CSSProperties = {
  background: "#fbe4dd",
  color: "#a4442a",
};
export function StudentDetail() {
  const { studentId } = useParams(),
    { state, dispatch, accounts, resetStudentPassword, setStudentDisabled } = useDemo(),
    student = state.students.find((s) => s.id === studentId);
  const studentTabs = [
    "Overview",
    "Assess",
    "Assignments",
    "Routines",
    "Notes",
    "Activity",
    "Account",
  ],
    [searchParams] = useSearchParams(),
    requestedTab = searchParams.get("tab");
  const [tab, setTab] = useState(
      studentTabs.includes(requestedTab ?? "") ? requestedTab! : "Overview",
    ),
    [note, setNote] = useState(""),
    [message, setMessage] = useState(""),
    [override, setOverride] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [accountMessage, setAccountMessage] = useState(""),
    [unlockMessage, setUnlockMessage] = useState(""),
    [accountPending, setAccountPending] = useState(false);
  if (!student)
    return (
      <div className="card">
        <h1>Student not found</h1>
        <Link to="/teacher">Back to studio</Link>
      </div>
    );
  const level = levels.find((l) => l.id === student.currentLevelId)!,
    account = accounts.find((a) => a.studentId === student.id),
    next = levels[level.order],
    sessions = state.sessions.filter((s) => s.studentId === student.id),
    items = state.assignments
      .filter((a) => a.studentId === student.id)
      .flatMap((a) => a.items);
  return (
    <>
      <Link className="text-link" to="/teacher">
        <ArrowLeft size={16} /> Your students
      </Link>
      <div className="page-heading row">
        <span className="avatar large">{student.name[0]}</span>
        <div>
          <div className="eyebrow green">STUDENT WORKSPACE</div>
          <h1>{student.name}</h1>
          <p>
            Level {level.order} · {level.title}
            {student.appUnlocked === true && " · App unlocked 🎓"}
          </p>
        </div>
      </div>
      <div className="tab-row" role="tablist" aria-label="Student detail">
        {studentTabs.map((t) => (
          <button
            key={t}
            id={`tab-${t}`}
            role="tab"
            aria-selected={tab === t}
            aria-controls="student-panel"
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="student-panel" aria-labelledby={`tab-${tab}`}>
        {tab === "Overview" && (
          <div className="learning-layout">
            <div className="card">
              <h2>Skills at a glance</h2>
              <div className="skill-list spaced">
                {skills
                  .filter((s) => student.unlockedLevels.includes(s.levelId))
                  .map((s) => (
                    <div className="row spread" key={s.id}>
                      <span>{s.title}</span>
                      <StatusBadge status={student.skills[s.id]} />
                    </div>
                  ))}
              </div>
            </div>
            <div className="stack">
              <div className="card">
                <h3>Next lesson goal</h3>
                <p className="spaced">{student.goal}</p>
                <button className="button" onClick={() => setTab("Assess")}>
                  Begin assessment
                </button>
              </div>
              {next && (
                <section className="card form-card">
                  <h3>Next chapter: {next.title}</h3>
                  <p className="spaced">
                    {canUnlock(state, student.id, next.id)
                      ? "All prerequisite skills are mastered. You can unlock the next chapter."
                      : "Some prerequisite skills are still growing. Reinforce them, or record a considered override."}
                  </p>
                  {!canUnlock(state, student.id, next.id) && (
                    <label>
                      Override reason
                      <textarea
                        value={override}
                        onChange={(e) => setOverride(e.target.value)}
                        placeholder="Why is this student ready?"
                      />
                    </label>
                  )}
                  <button
                    className="button secondary"
                    onClick={async () => {
                      const r = await dispatch({
                        type: "unlock",
                        studentId: student.id,
                        levelId: next.id,
                        overrideReason: override,
                        at: new Date().toISOString(),
                      });
                      setMessage(
                        r.ok ? "The next chapter is now available." : r.error,
                      );
                    }}
                  >
                    Unlock Level {next.order}
                  </button>
                  <p role="status" className="form-message">
                    {message}
                  </p>
                </section>
              )}
            </div>
          </div>
        )}
        {tab === "Assess" && (
          <AssessmentForm key={student.id} studentId={student.id} />
        )}
        {tab === "Assignments" && (
          <div className="learning-layout">
            <AssignmentForm studentId={student.id} />
            <section className="card">
              <h2>Assigned practice</h2>
              <div className="stack spaced">
                {items.map((i) => (
                  <div className="row spread" key={i.id}>
                    <div>
                      <h3>{activityById(i.activityId)?.title}</h3>
                      <p>
                        {i.minutes} min · {i.repetitions} rounds
                        {i.dueDate && (
                          <>
                            {" "}
                            · <CalendarClock size={12} /> due{" "}
                            {formatDueDate(i.dueDate)}
                          </>
                        )}
                      </p>
                    </div>
                    <div className="row">
                      {isOverdue(i) && (
                        <span className="status" style={overdueBadge}>
                          {dueDateLabel(i.dueDate!)}
                        </span>
                      )}
                      {i.completed ? (
                        <span className="status">
                          <Check size={12} /> Complete
                        </span>
                      ) : (
                        <span className="status">To practice</span>
                      )}
                    </div>
                  </div>
                ))}
                {!items.length && <p>No assignments yet.</p>}
              </div>
            </section>
          </div>
        )}
        {tab === "Routines" && (
          <StudentRoutines key={student.id} studentId={student.id} />
        )}
        {tab === "Notes" && (
          <div className="learning-layout">
            <form
              className="card form-card"
              onSubmit={async (e) => {
                e.preventDefault();
                const r = await dispatch({
                  type: "saveNote",
                  studentId: student.id,
                  text: note,
                  at: new Date().toISOString(),
                });
                setMessage(r.ok ? "Lesson note saved." : r.error);
                if (r.ok) setNote("");
              }}
            >
              <h2>Lesson notes</h2>
              <p>These notes are visible only in your teacher account.</p>
              <label>
                Your note
                <textarea
                  rows={6}
                  maxLength={3000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  required
                />
              </label>
              <button className="button" type="submit">
                Save note
              </button>
              <p role="status" className="form-message">
                {message}
              </p>
            </form>
            <div className="stack">
              {state.notes
                .filter((n) => n.studentId === student.id)
                .slice()
                .reverse()
                .map((n) => (
                  <article className="card" key={n.id}>
                    <span className="eyebrow">
                      {new Date(n.at).toLocaleDateString()}
                    </span>
                    <p className="note-text spaced">{n.text}</p>
                  </article>
                ))}
            </div>
          </div>
        )}
        {tab === "Activity" && (
          <div className="learning-layout">
            <section className="card">
              <h2>Practice activity</h2>
              <p>Self-reported time, not evidence of mastery.</p>
              {sessions.length ? (
                sessions
                  .slice()
                  .reverse()
                  .map((s) => (
                    <div className="activity-row" key={s.id}>
                      <Clock3 size={18} />
                      <div>
                        <strong>
                          {Math.floor(s.durationSeconds / 60)} min{" "}
                          {s.durationSeconds % 60} sec practiced
                        </strong>
                        <p>
                          {new Date(s.at).toLocaleString()} · {s.itemIds.length}{" "}
                          activities
                        </p>
                      </div>
                    </div>
                  ))
              ) : (
                <p className="spaced">No practice sessions yet.</p>
              )}
            </section>
            <section className="card">
              <h2>Progress history</h2>
              {state.events
                .filter((e) => e.studentId === student.id)
                .slice()
                .reverse()
                .map((e) => (
                  <div className="activity-row" key={e.id}>
                    <div>
                      <strong>{e.text}</strong>
                      <p>{new Date(e.at).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              {!state.events.some((e) => e.studentId === student.id) && (
                <p className="spaced">
                  New teaching and practice actions will appear here.
                </p>
              )}
            </section>
          </div>
        )}
        {tab === "Account" && (
          <section className="card form-card account-panel">
            <h2>Student access</h2>
            <p>Username: <strong>{account?.username}</strong></p>
            <p>{account?.disabled ? "This account is disabled." : "This student can sign in."}</p>
            <form onSubmit={async (event) => {
              event.preventDefault(); setAccountPending(true); setAccountMessage("");
              const result = await resetStudentPassword(student.id, newPassword);
              setAccountPending(false);
              setAccountMessage(result.ok ? "Password changed. The student must sign in again." : result.error);
              if (result.ok) setNewPassword("");
            }}>
              <label htmlFor="reset-password">New password</label>
              <input id="reset-password" type="password" autoComplete="new-password" minLength={10} maxLength={256} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
              <button className="button secondary" type="submit" disabled={accountPending}>Reset password</button>
            </form>
            <button className="button secondary" type="button" disabled={accountPending} onClick={async () => {
              setAccountPending(true); setAccountMessage("");
              const result = await setStudentDisabled(student.id, !account?.disabled);
              setAccountPending(false);
              setAccountMessage(result.ok ? (account?.disabled ? "Student access enabled." : "Student access disabled.") : result.error);
            }}>{account?.disabled ? "Enable student access" : "Disable student access"}</button>
            {accountMessage && <p role="status" className="form-message">{accountMessage}</p>}
          </section>
        )}
        {tab === "Account" && (
          <section className="card form-card spaced" aria-labelledby="unlock-app-heading">
            <h2 id="unlock-app-heading">Graduation gift: unlock the app</h2>
            <p>
              {student.appUnlocked === true
                ? `${student.name} keeps the app as a personal practice studio — no more assignments or due dates, just tools, the full chord library, and their own practice rhythm.`
                : `Finished the course? Unlock the app and ${student.name} keeps it as a personal practice studio — a gift for the road ahead.`}
            </p>
            <button
              className="button"
              type="button"
              disabled={accountPending}
              onClick={async () => {
                setAccountPending(true); setUnlockMessage("");
                const r = await dispatch({
                  type: "setAppUnlocked",
                  studentId: student.id,
                  unlocked: student.appUnlocked !== true,
                  at: new Date().toISOString(),
                });
                setAccountPending(false);
                setUnlockMessage(r.ok
                  ? (student.appUnlocked === true ? "The app is locked for this student again." : "The app is unlocked — it’s theirs to keep.")
                  : r.error);
              }}
            >{student.appUnlocked === true ? "Lock the app again" : `Unlock the app for ${student.name}`}</button>
            {unlockMessage && <p role="status" className="form-message">{unlockMessage}</p>}
          </section>
        )}
      </div>
    </>
  );
}
