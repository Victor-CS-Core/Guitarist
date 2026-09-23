import {
  createBrowserRouter,
  RouterProvider,
  Routes,
  Route,
  Navigate,
  Link,
  useLocation,
} from "react-router-dom";
import type { ReactNode } from "react";
import { StoreProvider, useDemo } from "../demo/StoreProvider";
import { AppShell } from "../components/AppShell";
import { Dashboard } from "../student/Dashboard";
import { LearnPage, LevelPage } from "../student/LevelPage";
import { ProgressPage } from "../student/ProgressPage";
import { PracticePage } from "../practice/PracticePage";
import { TeacherDashboard } from "../teacher/Dashboard";
import { StudentDetail } from "../teacher/StudentDetail";
function Guard({
  teacher = false,
  children,
}: {
  teacher?: boolean;
  children: ReactNode;
}) {
  const { actor } = useDemo();
  if ((actor.role === "teacher") !== teacher)
    return (
      <div className="card empty">
        <h1>{teacher ? "Your teacher’s workspace" : "Your student’s view"}</h1>
        <p>
          Use the demo view selector above to explore this part of Guitarist.
        </p>
        <Link
          className="button"
          to={actor.role === "teacher" ? "/teacher" : "/student"}
        >
          Back home
        </Link>
      </div>
    );
  return children;
}
function PracticeRoute() {
  const { actor } = useDemo();
  const location = useLocation();
  return (
    <PracticePage
      key={`${actor.role === "student" ? actor.studentId : "teacher"}:${location.search}`}
    />
  );
}
export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/student" replace />} />
        <Route
          path="/student"
          element={
            <Guard>
              <Dashboard />
            </Guard>
          }
        />
        <Route
          path="/student/learn"
          element={
            <Guard>
              <LearnPage />
            </Guard>
          }
        />
        <Route
          path="/student/learn/:levelId"
          element={
            <Guard>
              <LevelPage />
            </Guard>
          }
        />
        <Route
          path="/student/practice"
          element={
            <Guard>
              <PracticeRoute />
            </Guard>
          }
        />
        <Route
          path="/student/progress"
          element={
            <Guard>
              <ProgressPage />
            </Guard>
          }
        />
        <Route
          path="/teacher"
          element={
            <Guard teacher>
              <TeacherDashboard />
            </Guard>
          }
        />
        <Route
          path="/teacher/students/:studentId"
          element={
            <Guard teacher>
              <StudentDetail />
            </Guard>
          }
        />
        <Route
          path="/teacher/curriculum"
          element={
            <Guard teacher>
              <LearnPage />
            </Guard>
          }
        />
        <Route
          path="/teacher/curriculum/:levelId"
          element={
            <Guard teacher>
              <LevelPage />
            </Guard>
          }
        />
        <Route
          path="*"
          element={
            <div className="card empty">
              <h1>That page hit a quiet note.</h1>
              <p>Let’s get you back to your music.</p>
              <Link className="button" to="/">
                Back home
              </Link>
            </div>
          }
        />
      </Route>
    </Routes>
  );
}
const router = createBrowserRouter([{ path: "*", element: <AppRoutes /> }]);
export function App() {
  return (
    <StoreProvider>
      <RouterProvider router={router} />
    </StoreProvider>
  );
}
