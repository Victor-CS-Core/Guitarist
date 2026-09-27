import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";
import { useStudio } from "../app/StoreProvider";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { isAppUnlocked, studentRoutines } from "../domain/selectors";
import { RoutineCard } from "../routines/RoutineCard";

/** Teacher view of a student's routines: share new ones, edit or remove old ones. */
export function StudentRoutines({ studentId }: { studentId: string }) {
  const { state, dispatch } = useStudio();
  const student = state.students.find((s) => s.id === studentId);
  const routines = studentRoutines(state, studentId);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);
  const deletingRef = useRef(false);

  if (!student)
    return (
      <div className="card">
        <h2>Student not found.</h2>
        <p>Routines need a valid student.</p>
      </div>
    );
  const unlocked = isAppUnlocked(student);

  async function remove(routineId: string) {
    if (deletingRef.current) return;
    deletingRef.current = true;
    setDeletingId(routineId);
    setMessage("");
    const result = await dispatch({
      type: "deleteRoutine",
      studentId,
      routineId,
      at: new Date().toISOString(),
    });
    setDeletingId(null);
    deletingRef.current = false;
    if (!result.ok) setMessage(result.error);
  }

  return (
    <div className="learning-layout">
      <section className="card form-card">
        <h2>Share a practice routine</h2>
        <p>
          {unlocked ? (
            <>
              {student.name} keeps the app as their own studio now, so a routine
              lands as a friendly suggestion — no due dates, no pressure. Build a
              guided session they can play block by block.
            </>
          ) : (
            <>
              Build a guided session — warm-up through cool-down — that{" "}
              {student.name} can play block by block, with timers and a
              metronome where they help.
            </>
          )}
        </p>
        <Link className="button" to={`/teacher/students/${studentId}/routines/new`}>
          <Plus size={16} /> New routine
        </Link>
      </section>
      <section className="card">
        <h2>{student.name}’s routines</h2>
        {message && <p role="alert">{message}</p>}
        <div className="stack spaced">
          {routines.map((r) => (
            <RoutineCard
              key={r.id}
              routine={r}
              audience="teacher"
              editTo={`/teacher/students/${studentId}/routines/${r.id}/edit`}
              onDelete={() => setPendingDelete({ id: r.id, name: r.name })}
              deleting={deletingId === r.id}
            />
          ))}
          {!routines.length && <p>No routines yet — share the first one.</p>}
        </div>
      </section>
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete “${pendingDelete?.name ?? "this routine"}”?`}
        message={`This will remove the routine for ${student.name}. This can’t be undone.`}
        onConfirm={() => {
          if (pendingDelete) void remove(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
