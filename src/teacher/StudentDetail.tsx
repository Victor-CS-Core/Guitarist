import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Check, Clock3 } from "lucide-react";
import { useDemo } from "../demo/StoreProvider";
import { levels, skills, activityById } from "../curriculum/foundations";
import { StatusBadge } from "../components/StatusBadge";
import { canUnlock } from "../domain/selectors";
import { AssessmentForm } from "./AssessmentForm";
import { AssignmentForm } from "./AssignmentForm";
export function StudentDetail() {
  const { studentId } = useParams(),
    { state, dispatch } = useDemo(),
    student = state.students.find((s) => s.id === studentId);
  const [tab, setTab] = useState("Overview"),
    [note, setNote] = useState(""),
    [message, setMessage] = useState(""),
    [override, setOverride] = useState("");
  if (!student)
    return (
      <div className="card">
        <h1>Student not found</h1>
        <Link to="/teacher">Back to studio</Link>
      </div>
    );
  const level = levels.find((l) => l.id === student.currentLevelId)!,
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
          </p>
        </div>
      </div>
      <div className="tab-row" role="tablist" aria-label="Student detail">
        {["Overview", "Assess", "Assignments", "Notes", "Activity"].map((t) => (
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
                    onClick={() => {
                      const r = dispatch({
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
                      </p>
                    </div>
                    {i.completed ? (
                      <span className="status">
                        <Check size={12} /> Complete
                      </span>
                    ) : (
                      <span className="status">To practice</span>
                    )}
                  </div>
                ))}
                {!items.length && <p>No assignments yet.</p>}
              </div>
            </section>
          </div>
        )}
        {tab === "Notes" && (
          <div className="learning-layout">
            <form
              className="card form-card"
              onSubmit={(e) => {
                e.preventDefault();
                const r = dispatch({
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
              <p>
                Teacher-view notes in this fictional demo. Real privacy requires
                the planned server.
              </p>
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
      </div>
    </>
  );
}
