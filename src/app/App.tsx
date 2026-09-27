import { createBrowserRouter, RouterProvider, Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import type { ReactNode } from "react";
import { StoreProvider, useStudio } from "./StoreProvider";
import { LoginPage } from "../auth/LoginPage";
import { AppShell } from "../components/AppShell";
import { EmptyState } from "../components/EmptyState";

// Route pages are lazy-loaded so the initial bundle stays lean; each page
// (and its heavy dependencies, e.g. the chord catalog) becomes its own chunk.
const Dashboard = lazy(() => import("../student/Dashboard").then((m) => ({ default: m.Dashboard })));
const LearnPage = lazy(() => import("../student/LevelPage").then((m) => ({ default: m.LearnPage })));
const LevelPage = lazy(() => import("../student/LevelPage").then((m) => ({ default: m.LevelPage })));
const ProgressPage = lazy(() => import("../student/ProgressPage").then((m) => ({ default: m.ProgressPage })));
const PracticePage = lazy(() => import("../practice/PracticePage").then((m) => ({ default: m.PracticePage })));
const TeacherDashboard = lazy(() => import("../teacher/Dashboard").then((m) => ({ default: m.TeacherDashboard })));
const StudentDetail = lazy(() => import("../teacher/StudentDetail").then((m) => ({ default: m.StudentDetail })));
const AssignmentsOverview = lazy(() => import("../teacher/AssignmentsOverview").then((m) => ({ default: m.AssignmentsOverview })));
const CheckInsPage = lazy(() => import("../teacher/CheckInsPage").then((m) => ({ default: m.CheckInsPage })));
const ActivityPreviewPage = lazy(() => import("../teacher/ActivityPreviewPage").then((m) => ({ default: m.ActivityPreviewPage })));
const LessonPlansPage = lazy(() => import("../teacher/LessonPlansPage").then((m) => ({ default: m.LessonPlansPage })));
const LessonPlanDetail = lazy(() => import("../teacher/LessonPlanDetail").then((m) => ({ default: m.LessonPlanDetail })));
const ToolsHome = lazy(() => import("../tools/ToolsHome").then((m) => ({ default: m.ToolsHome })));
const StudyTimerPage = lazy(() => import("../tools/StudyTimer").then((m) => ({ default: m.StudyTimerPage })));
const TunerPage = lazy(() => import("../tools/Tuner").then((m) => ({ default: m.TunerPage })));
const RhythmToolPage = lazy(() => import("../tools/RhythmTool").then((m) => ({ default: m.RhythmToolPage })));
const ChordLibraryPage = lazy(() => import("../tools/ChordLibrary").then((m) => ({ default: m.ChordLibraryPage })));
const EditRoutineRoute = lazy(() => import("../routines/routes").then((m) => ({ default: m.EditRoutineRoute })));
const NewRoutineRoute = lazy(() => import("../routines/routes").then((m) => ({ default: m.NewRoutineRoute })));
const PlayRoutineRoute = lazy(() => import("../routines/routes").then((m) => ({ default: m.PlayRoutineRoute })));
const TeacherEditRoutineRoute = lazy(() => import("../routines/routes").then((m) => ({ default: m.TeacherEditRoutineRoute })));
const TeacherNewRoutineRoute = lazy(() => import("../routines/routes").then((m) => ({ default: m.TeacherNewRoutineRoute })));

function RouteLoading() {
  return (
    <div className="auth-loading" role="status">
      Loading…
    </div>
  );
}

function HomeRedirect() {
  const { status, actor } = useStudio();
  if (status === "loading") return <div className="auth-loading">Loading Guitarist…</div>;
  if (status !== "ready") return <Navigate to="/" replace />;
  return <Navigate to={actor.role === "teacher" ? "/teacher" : "/student"} replace />;
}
function AuthenticatedShell() {
  const { status, warning } = useStudio();
  if (status === "loading") return <div className="auth-loading">Loading Guitarist…</div>;
  if (status === "error")
    return (
      <EmptyState title="Connection unavailable" message={warning}>
        <button className="button" onClick={() => location.reload()}>
          Try again
        </button>
      </EmptyState>
    );
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
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
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
      <Route path="/teacher/lesson-plans" element={<Guard teacher><LessonPlansPage /></Guard>} />
      <Route path="/teacher/lesson-plans/:levelId" element={<Guard teacher><LessonPlanDetail /></Guard>} />
      <Route path="/tools" element={<ToolsHome />} />
      <Route path="/tools/timer" element={<StudyTimerPage />} />
      <Route path="/tools/tuner" element={<TunerPage />} />
      <Route path="/tools/rhythm" element={<RhythmToolPage />} />
      <Route path="/tools/chords" element={<ChordLibraryPage />} />
      <Route
        path="*"
        element={
          <EmptyState title="That page hit a quiet note." message="Let’s get you back to your music.">
            <Link className="button" to="/home">
              Back home
            </Link>
          </EmptyState>
        }
      />
    </Route>
  </Routes>
    </Suspense>
  );
}
const router = createBrowserRouter([{ path: "*", element: <AppRoutes /> }]);
export function App() { return <StoreProvider><RouterProvider router={router} /></StoreProvider>; }
