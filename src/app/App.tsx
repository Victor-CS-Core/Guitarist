import { createBrowserRouter, RouterProvider, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { StoreProvider, useStudio } from "./StoreProvider";
import { LoginPage } from "../auth/LoginPage";
import { AppShell } from "../components/AppShell";
import { Dashboard } from "../student/Dashboard";
import { LearnPage, LevelPage } from "../student/LevelPage";
import { ProgressPage } from "../student/ProgressPage";
import { PracticePage } from "../practice/PracticePage";
import { TeacherDashboard } from "../teacher/Dashboard";
import { StudentDetail } from "../teacher/StudentDetail";
import { AssignmentsOverview } from "../teacher/AssignmentsOverview";
import { CheckInsPage } from "../teacher/CheckInsPage";
import { ActivityPreviewPage } from "../teacher/ActivityPreviewPage";
import { ToolsHome } from "../tools/ToolsHome";
import { StudyTimerPage } from "../tools/StudyTimer";
import { TunerPage } from "../tools/Tuner";
import { RhythmToolPage } from "../tools/RhythmTool";
import { ChordLibraryPage } from "../tools/ChordLibrary";
import {
  EditRoutineRoute,
  NewRoutineRoute,
  PlayRoutineRoute,
  TeacherEditRoutineRoute,
  TeacherNewRoutineRoute,
} from "../routines/routes";

function HomeRedirect() {
  const { status, actor } = useStudio();
  if (status === "loading") return <div className="auth-loading">Loading Guitarist…</div>;
  if (status !== "ready") return <Navigate to="/" replace />;
  return <Navigate to={actor.role === "teacher" ? "/teacher" : "/student"} replace />;
}
function AuthenticatedShell() {
  const { status, warning } = useStudio();
  if (status === "loading") return <div className="auth-loading">Loading Guitarist…</div>;
  if (status === "error") return <div className="card empty"><h1>Connection unavailable</h1><p>{warning}</p><button className="button" onClick={() => location.reload()}>Try again</button></div>;
  if (status !== "ready") return <Navigate to="/" replace />;
  return <AppShell />;
}
function Guard({ teacher = false, children }: { teacher?: boolean; children: ReactNode }) {
  const { actor } = useStudio();
  if ((actor.role === "teacher") !== teacher) return <Navigate to={actor.role === "teacher" ? "/teacher" : "/student"} replace />;
  return children;
}
function PracticeRoute() {
  const { actor } = useStudio();
  const location = useLocation();
  return <PracticePage key={(actor.role === "student" ? actor.studentId : "teacher") + ":" + location.search} />;
}
export function AppRoutes() {
  return <Routes>
    <Route path="/" element={<LoginPage />} />
    <Route path="/home" element={<HomeRedirect />} />
    <Route element={<AuthenticatedShell />}>
      <Route path="/student" element={<Guard><Dashboard /></Guard>} />
      <Route path="/student/learn" element={<Guard><LearnPage /></Guard>} />
      <Route path="/student/learn/:levelId" element={<Guard><LevelPage /></Guard>} />
      <Route path="/student/practice" element={<Guard><PracticeRoute /></Guard>} />
      <Route path="/student/progress" element={<Guard><ProgressPage /></Guard>} />
      <Route path="/student/routines/new" element={<Guard><NewRoutineRoute /></Guard>} />
      <Route path="/student/routines/:routineId/edit" element={<Guard><EditRoutineRoute /></Guard>} />
      <Route path="/student/routines/:routineId/play" element={<Guard><PlayRoutineRoute /></Guard>} />
      <Route path="/teacher/students/:studentId/routines/new" element={<Guard teacher><TeacherNewRoutineRoute /></Guard>} />
      <Route path="/teacher/students/:studentId/routines/:routineId/edit" element={<Guard teacher><TeacherEditRoutineRoute /></Guard>} />
      <Route path="/teacher" element={<Guard teacher><TeacherDashboard /></Guard>} />
      <Route path="/teacher/students/:studentId" element={<Guard teacher><StudentDetail /></Guard>} />
      <Route path="/teacher/assignments" element={<Guard teacher><AssignmentsOverview /></Guard>} />
      <Route path="/teacher/check-ins" element={<Guard teacher><CheckInsPage /></Guard>} />
      <Route path="/teacher/preview/activity/:activityId" element={<Guard teacher><ActivityPreviewPage /></Guard>} />
      <Route path="/teacher/curriculum" element={<Guard teacher><LearnPage /></Guard>} />
      <Route path="/teacher/curriculum/:levelId" element={<Guard teacher><LevelPage /></Guard>} />
      <Route path="/tools" element={<ToolsHome />} />
      <Route path="/tools/timer" element={<StudyTimerPage />} />
      <Route path="/tools/tuner" element={<TunerPage />} />
      <Route path="/tools/rhythm" element={<RhythmToolPage />} />
      <Route path="/tools/chords" element={<ChordLibraryPage />} />
      <Route path="*" element={<div className="card empty"><h1>That page hit a quiet note.</h1><p>Let’s get you back to your music.</p><Link className="button" to="/home">Back home</Link></div>} />
    </Route>
  </Routes>;
}
const router = createBrowserRouter([{ path: "*", element: <AppRoutes /> }]);
export function App() { return <StoreProvider><RouterProvider router={router} /></StoreProvider>; }
