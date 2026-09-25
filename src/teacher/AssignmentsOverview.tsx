import { useMemo, useState, type CSSProperties } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Check, ClipboardList, CalendarClock } from "lucide-react";
import { useDemo } from "../app/StoreProvider";
import {
  isDueSoon,
  isOverdue,
  dueDateLabel,
  formatDueDate,
} from "../domain/selectors";
import {
  countOpen,
  countOverdue,
  filterAssignments,
  flattenAssignments,
  sortAssignmentsNewest,
  sortAssignmentsByDueDate,
  type AssignmentStatusFilter,
} from "./assignmentSelectors";

const overdueBadge: CSSProperties = {
  background: "#fbe4dd",
  color: "#a4442a",
};
const dueSoonBadge: CSSProperties = {
  background: "#f8eddb",
  color: "#8a5f2b",
};

type AssignmentSort = "newest" | "dueDate";

export function AssignmentsOverview() {
  const { state } = useDemo();
  const [studentId, setStudentId] = useState("");
  const [status, setStatus] = useState<AssignmentStatusFilter>("all");
  const [sort, setSort] = useState<AssignmentSort>("newest");
  const all = useMemo(
    () =>
      sort === "dueDate"
        ? sortAssignmentsByDueDate(flattenAssignments(state))
        : sortAssignmentsNewest(flattenAssignments(state)),
    [state, sort],
  );
  const rows = useMemo(
    () =>
      filterAssignments(all, {
        studentId: studentId || undefined,
        status,
      }),
    [all, studentId, status],
  );
  const open = countOpen(all),
    overdue = countOverdue(all);
  return (
    <>
      <Link className="text-link" to="/teacher">
        <ArrowLeft size={16} /> Your studio
      </Link>
      <div className="page-heading">
        <div className="eyebrow green">YOUR TEACHING STUDIO</div>
        <h1>All assignments</h1>
        <p>
          Every exercise assigned in your studio — open any one to review it
          exactly as the student sees it.
        </p>
      </div>
      <section className="card form-card spaced">
        <div className="row spread">
          <label>
            Student
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">All students</option>
              {state.students.map((s) => (
                <option value={s.id} key={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Status
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as AssignmentStatusFilter)
              }
            >
              <option value="all">All</option>
              <option value="open">To practice</option>
              <option value="complete">Complete</option>
              <option value="overdue">Overdue</option>
            </select>
          </label>
          <label>
            Sort
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as AssignmentSort)}
            >
              <option value="newest">Newest first</option>
              <option value="dueDate">By due date</option>
            </select>
          </label>
        </div>
        <p className="small">
          {all.length} assigned {all.length === 1 ? "exercise" : "exercises"} ·{" "}
          {open} still to practice
          {overdue > 0 && ` · ${overdue} overdue`}
        </p>
      </section>
      <section className="card">
        <h2>Assigned exercises</h2>
        {rows.length ? (
          <div className="stack spaced">
            {rows.map((row) => (
              <div className="activity-row" key={row.itemId}>
                <BookOpen size={18} />
                <div>
                  <strong>{row.activityTitle}</strong>
                  <p>
                    {row.minutes} min · {row.repetitions}{" "}
                    {row.repetitions === 1 ? "round" : "rounds"} · assigned{" "}
                    {new Date(row.assignedAt).toLocaleDateString()}
                    {row.dueDate && (
                      <>
                        {" "}
                        · <CalendarClock size={12} /> due{" "}
                        {formatDueDate(row.dueDate)}
                      </>
                    )}
                  </p>
                  <p className="small">
                    <Link
                      className="text-link"
                      to={`/teacher/students/${row.studentId}?tab=Assignments`}
                    >
                      {row.studentName}
                    </Link>{" "}
                    ·{" "}
                    <Link
                      className="text-link"
                      to={`/teacher/preview/activity/${row.activityId}?studentId=${row.studentId}&itemId=${row.itemId}`}
                    >
                      Preview as student
                    </Link>
                  </p>
                </div>
                {row.completed ? (
                  <span className="status">
                    <Check size={12} /> Complete
                  </span>
                ) : (
                  <span className="status">To practice</span>
                )}
                {isOverdue(row) && (
                  <span className="status" style={overdueBadge}>
                    {dueDateLabel(row.dueDate!)}
                  </span>
                )}
                {!row.completed && !isOverdue(row) && isDueSoon(row) && (
                  <span className="status" style={dueSoonBadge}>
                    {dueDateLabel(row.dueDate!)}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">
            <ClipboardList size={35} />
            <h3>No exercises match these filters.</h3>
            <p>
              {all.length
                ? "Try a different student or status."
                : "Assign practice from a student’s Assignments tab to see it here."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
