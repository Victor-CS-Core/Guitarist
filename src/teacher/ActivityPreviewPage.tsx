import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, Eye } from "lucide-react";
import { useDemo } from "../app/StoreProvider";
import { activityById } from "../curriculum/foundations";
import { Exercises } from "../student/Exercises";

/**
 * Teacher preview of a curriculum activity, rendered with the exact same
 * Exercises component the student view uses — what the teacher sees here is
 * what the student sees in their learning panel.
 *
 * Route: /teacher/preview/activity/:activityId
 * Optional query params (supplied by the assignments overview):
 *   studentId — shows who this exercise is assigned to and restores the back link
 *   itemId    — shows the assigned minutes/rounds and completion status
 */
export function ActivityPreviewPage() {
  const { activityId } = useParams();
  const [searchParams] = useSearchParams();
  const { state } = useDemo();
  const activity = activityById(activityId ?? "");
  const studentId = searchParams.get("studentId");
  const itemId = searchParams.get("itemId");
  const student = state.students.find((s) => s.id === studentId);
  const assignment = state.assignments.find((a) =>
    a.items.some((i) => i.id === itemId),
  );
  const item = assignment?.items.find((i) => i.id === itemId);
  const backTo = student
    ? `/teacher/students/${student.id}?tab=Assignments`
    : "/teacher/assignments";
  const backLabel = student
    ? `Back to ${student.name}’s assignments`
    : "Back to all assignments";
  if (!activity)
    return (
      <div className="card empty">
        <Eye size={35} />
        <h1>That activity isn’t here.</h1>
        <p>It may have been removed from the curriculum.</p>
        <Link className="button" to={backTo}>
          {backLabel}
        </Link>
      </div>
    );
  return (
    <>
      <Link className="text-link" to={backTo}>
        <ArrowLeft size={16} /> {backLabel}
      </Link>
      <div className="page-heading">
        <div className="eyebrow green">STUDENT PREVIEW</div>
        <h1>{activity.title}</h1>
        <p>{activity.description}</p>
      </div>
      {student && item && (
        <section className="card spaced">
          <div className="row spread">
            <div>
              <span className="eyebrow">ASSIGNED TO</span>
              <p>
                {student.name} · {item.minutes} min · {item.repetitions}{" "}
                {item.repetitions === 1 ? "round" : "rounds"}
              </p>
            </div>
            {item.completed ? (
              <span className="status">
                <Check size={12} /> Complete
              </span>
            ) : (
              <span className="status">To practice</span>
            )}
          </div>
        </section>
      )}
      <aside className="card learning-panel">
        <h2>{activity.title}</h2>
        <ol className="instructions">
          {activity.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <Exercises key={activity.id} activity={activity} />
      </aside>
      <p className="small spaced">
        This is exactly what {student?.name ?? "a student"} sees when opening
        this exercise. Try it, then check the shape or answers the same way
        they would.
      </p>
    </>
  );
}
