import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useDemo, useStudent } from "../app/StoreProvider";
import { isAppUnlocked, studentRoutines } from "../domain/selectors";
import { RoutineCard } from "./RoutineCard";

/**
 * The student's routine library: run, edit, delete, and build new.
 * Shown on the Practice page above assignments. Building routines is a
 * graduation gift — students still in the course see teacher-shared routines.
 */
export function RoutineSection() {
  const { state, dispatch } = useDemo();
  const student = useStudent();
  const routines = studentRoutines(state, student.id);
  const unlocked = isAppUnlocked(student);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function remove(routineId: string, name: string) {
    if (!window.confirm(`Delete the routine “${name}”? This can’t be undone.`)) return;
    setDeletingId(routineId);
    setError("");
    const result = await dispatch({
      type: "deleteRoutine",
      studentId: student.id,
      routineId,
      at: new Date().toISOString(),
    });
    setDeletingId(null);
    if (!result.ok) setError(result.error);
  }

  if (!unlocked && routines.length === 0) return null;
  const canEdit = (createdBy: string) => unlocked && createdBy === "student";

  return (
    <section className="stack" aria-label="Practice routines">
      <div className="row spread">
        <h2>Practice routines</h2>
        {unlocked && (
          <Link className="button secondary" to="/student/routines/new">
            <Plus size={16} /> Build a routine
          </Link>
        )}
      </div>
      {routines.length === 0 ? (
        <p className="small">
          No routines yet. Build one and the player will walk you through it,
          block by block, with a timer and metronome where they help.
        </p>
      ) : (
        <div className="routine-grid">
          {routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              playTo={`/student/routines/${r.id}/play`}
              editTo={canEdit(r.createdBy) ? `/student/routines/${r.id}/edit` : undefined}
              onDelete={canEdit(r.createdBy) ? () => remove(r.id, r.name) : undefined}
              deleting={deletingId === r.id}
            />
          ))}
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
