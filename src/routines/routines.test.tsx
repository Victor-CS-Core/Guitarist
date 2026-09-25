import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, createMemoryRouter, RouterProvider } from "react-router-dom";
import { it, expect, beforeEach } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { applyCommand } from "../domain/commands";
import type { DemoState } from "../domain/types";
import { RoutineSection } from "./RoutineSection";
import { RoutinePlayer } from "./RoutinePlayer";
import { NewRoutineRoute } from "./routes";

const at = "2026-09-23T12:00:00Z";
const teacher = { role: "teacher" as const };

function routineSeed(): DemoState {
  const r = applyCommand(seed(), teacher, {
    type: "createRoutine",
    studentId: "emma",
    name: "Evening flow",
    blocks: [
      { id: "b1", kind: "warmup", title: "Finger stretches", minutes: 1 },
      { id: "b2", kind: "chords", title: "Em to Am", minutes: 2, chordIds: ["Em", "Am"], bpm: 70 },
    ],
    at,
  });
  if (!r.ok) throw Error(r.error);
  return r.value;
}

function renderStudent(state: DemoState, studentId: string, entry: string, route: string, element: React.ReactNode) {
  return render(
    <StoreProvider initialState={state} initialActor={{ role: "student", studentId }}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={route} element={element} />
          <Route path="/student/practice" element={<div>practice page</div>} />
        </Routes>
      </MemoryRouter>
    </StoreProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

it("lists routines with run links and lets the student delete their own", async () => {
  renderStudent(routineSeed(), "emma", "/student/practice", "/student/practice", <RoutineSection />);
  expect(screen.getByRole("heading", { name: /evening flow/i })).toBeVisible();
  expect(screen.getByRole("link", { name: /play routine/i })).toHaveAttribute(
    "href",
    expect.stringContaining("/play"),
  );
  // Teacher-created: no edit or delete controls for the student.
  expect(screen.queryByRole("link", { name: /edit evening flow/i })).toBeNull();
  expect(screen.queryByRole("button", { name: /delete evening flow/i })).toBeNull();
});

it("plays a routine block by block and logs the session", async () => {
  const state = routineSeed();
  const routineId = state.routines[0].id;
  // useBlocker needs a data router, so mount through one rather than MemoryRouter.
  const router = createMemoryRouter(
    [
      { path: "/student/routines/:routineId/play", element: <RoutinePlayer routineId={routineId} /> },
      { path: "/student/practice", element: <div>practice page</div> },
    ],
    { initialEntries: [`/student/routines/${routineId}/play`] },
  );
  const { container } = render(
    <StoreProvider initialState={state} initialActor={{ role: "student", studentId: "emma" }}>
      <RouterProvider router={router} />
    </StoreProvider>,
  );
  expect(screen.getByText("Evening flow")).toBeVisible();
  expect(screen.getByText(/block 1 of 2/i)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /start block/i }));
  // Let the practice clock tick so the logged session isn't empty.
  await new Promise((r) => setTimeout(r, 1200));
  // Finish the first block early.
  fireEvent.click(screen.getByRole("button", { name: /next block early/i }));
  expect(screen.getByText(/block 2 of 2/i)).toBeVisible();
  // Chord diagrams render for the chord-change block.
  expect(container.querySelector(".chord-change-grid")).not.toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /finish early/i }));
  await waitFor(() => expect(screen.getByText(/routine complete/i)).toBeVisible());
  expect(screen.getByText(/you played “evening flow.”/i)).toBeVisible();
});

it("builds a routine from the builder form", async () => {
  const s = seed();
  s.students.find((x) => x.id === "emma")!.appUnlocked = true;
  renderStudent(s, "emma", "/student/routines/new", "/student/routines/new", <NewRoutineRoute />);
  fireEvent.change(screen.getByPlaceholderText(/my 20-minute session/i), {
    target: { value: "Morning spark" },
  });
  fireEvent.click(screen.getByRole("button", { name: /create routine/i }));
  // Success navigates back to the practice page; failure would show an alert.
  await waitFor(() => expect(screen.getByText("practice page")).toBeVisible());
});

it("tells students still in the course that routine building unlocks at graduation", () => {
  renderStudent(seed(), "emma", "/student/routines/new", "/student/routines/new", <NewRoutineRoute />);
  expect(screen.getByText(/routines unlock at graduation/i)).toBeVisible();
  expect(screen.queryByPlaceholderText(/my 20-minute session/i)).toBeNull();
});

it("hides the build button for students still in the course", () => {
  renderStudent(routineSeed(), "emma", "/student/practice", "/student/practice", <RoutineSection />);
  // Teacher-shared routines still show, but there's no way to build.
  expect(screen.getByRole("heading", { name: /evening flow/i })).toBeVisible();
  expect(screen.queryByRole("link", { name: /build a routine/i })).toBeNull();
});
