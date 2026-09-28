import { Check, CalendarClock } from "lucide-react";
import { useStudio } from "../app/StoreProvider";
import { activityById } from "../curriculum/foundations";
import { dueDateLabel, isOverdue } from "../domain/selectors";
import { formatDueDate } from "../lib/format";
import { AssignmentForm } from "./AssignmentForm";

/**
 * The Assignments tab of the student workspace: the assignment builder plus
 * the student's assigned-practice list with due-date and completion states.
 */
export function StudentAssignmentsTab({ studentId }: { studentId: string }) {
  const { state } = useStudio();
  const items = state.assignments
    .filter((a) => a.studentId === studentId)
    .flatMap((a) => a.items);

  return (
    <div className="learning-layout">
      <AssignmentForm studentId={studentId} />
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
                      · <CalendarClock size={12} /> due {formatDueDate(i.dueDate)}
                    </>
                  )}
                </p>
              </div>
              <div className="row">
                {isOverdue(i) && (
                  <span className="status overdue">
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
  );
}
