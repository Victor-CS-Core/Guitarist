import { useState } from "react";
import { useStudio } from "../app/StoreProvider";
import { skills } from "../curriculum/foundations";
import type { Level } from "../curriculum/types";
import type { Student } from "../domain/types";
import { StatusBadge } from "../components/StatusBadge";
import { canUnlock } from "../domain/selectors";

/**
 * The Overview tab of the student workspace: skills at a glance, the next
 * lesson goal, and the chapter-unlock control with its override path.
 */
export function StudentOverviewTab({
  student,
  next,
  onBeginAssessment,
}: {
  student: Student;
  next: Level | undefined;
  onBeginAssessment: () => void;
}) {
  const { state, dispatch } = useStudio();
  const [override, setOverride] = useState("");
  const [message, setMessage] = useState("");
  const [unlockPending, setUnlockPending] = useState(false);

  return (
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
          <button className="button" onClick={onBeginAssessment}>
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
              disabled={unlockPending}
              onClick={async () => {
                if (unlockPending) return;
                setUnlockPending(true);
                const r = await dispatch({
                  type: "unlock",
                  studentId: student.id,
                  levelId: next.id,
                  overrideReason: override,
                  at: new Date().toISOString(),
                });
                setUnlockPending(false);
                setMessage(
                  r.ok ? "The next chapter is now available." : r.error,
                );
              }}
            >
              {unlockPending ? "Unlocking…" : `Unlock Level ${next.order}`}
            </button>
            <p role="status" className="form-message">
              {message}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
