import { Link, useParams } from "react-router-dom";
import { useDemo, useStudent } from "../app/StoreProvider";
import { isAppUnlocked } from "../domain/selectors";
import { RoutineBuilder } from "./RoutineBuilder";
import { RoutinePlayer } from "./RoutinePlayer";

/** Building your own routines is a graduation gift. */
function LockedNotice() {
  return (
    <section className="card empty">
      <h1>Routines unlock at graduation.</h1>
      <p>
        Your teacher shares practice routines with you while you work through
        the course. Once they unlock your personal studio, you can build your
        own.
      </p>
      <Link className="button" to="/student/practice">Back to practice</Link>
    </section>
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
    return <section className="card empty"><h1>Routine not found.</h1></section>;
  return <RoutinePlayer routineId={routineId} />;
}

/** /teacher/students/:studentId/routines/new */
export function TeacherNewRoutineRoute() {
  const { state } = useDemo();
  const { studentId } = useParams();
  const student = state.students.find((s) => s.id === studentId);
  if (!student)
    return <section className="card empty"><h1>Student not found.</h1></section>;
  return <RoutineBuilder studentId={student.id} teacherMode />;
}

/** /teacher/students/:studentId/routines/:routineId/edit */
export function TeacherEditRoutineRoute() {
  const { state } = useDemo();
  const { studentId, routineId } = useParams();
  const student = state.students.find((s) => s.id === studentId);
  if (!student)
    return <section className="card empty"><h1>Student not found.</h1></section>;
  return <RoutineBuilder studentId={student.id} routineId={routineId} teacherMode />;
}
