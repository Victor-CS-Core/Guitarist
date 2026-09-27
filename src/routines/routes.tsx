import { Link, useParams } from "react-router-dom";
import { useStudio, useStudent } from "../app/StoreProvider";
import { isAppUnlocked } from "../domain/selectors";
import { RoutineBuilder } from "./RoutineBuilder";
import { RoutinePlayer } from "./RoutinePlayer";
import { EmptyState } from "../components/EmptyState";

/** Building your own routines is a graduation gift. */
function LockedNotice() {
  return (
    <EmptyState
      title="Routines unlock at graduation."
      message="Your teacher shares practice routines with you while you work through the course. Once they unlock your personal studio, you can build your own."
    >
      <Link className="button" to="/student/practice">
        Back to practice
      </Link>
    </EmptyState>
  );
}

/** /student/routines/new */
export function NewRoutineRoute() {
  const student = useStudent();
  if (!isAppUnlocked(student)) return <LockedNotice />;
  return <RoutineBuilder studentId={student.id} />;
}

/** /student/routines/:routineId/edit */
export function EditRoutineRoute() {
  const student = useStudent();
  const { routineId } = useParams();
  if (!isAppUnlocked(student)) return <LockedNotice />;
  return <RoutineBuilder studentId={student.id} routineId={routineId} />;
}

/** /student/routines/:routineId/play */
export function PlayRoutineRoute() {
  const { routineId } = useParams();
  if (!routineId)
    return <EmptyState title="Routine not found." />;
  return <RoutinePlayer routineId={routineId} />;
}

/** /teacher/students/:studentId/routines/new */
export function TeacherNewRoutineRoute() {
  const { state } = useStudio();
  const { studentId } = useParams();
  const student = state.students.find((s) => s.id === studentId);
  if (!student)
    return <EmptyState title="Student not found." />;
  return <RoutineBuilder studentId={student.id} teacherMode />;
}

/** /teacher/students/:studentId/routines/:routineId/edit */
export function TeacherEditRoutineRoute() {
  const { state } = useStudio();
  const { studentId, routineId } = useParams();
  const student = state.students.find((s) => s.id === studentId);
  if (!student)
    return <EmptyState title="Student not found." />;
  return <RoutineBuilder studentId={student.id} routineId={routineId} teacherMode />;
}
