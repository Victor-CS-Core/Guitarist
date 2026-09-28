import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { it, expect, beforeEach } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import type { AppState } from "../domain/types";
import { Dashboard } from "./Dashboard";
import { LevelPage } from "./LevelPage";
import { loadStudioSnapshot, saveStudioSnapshot } from "../lib/studioSnapshot";
import { markUnlockCelebrated } from "../lib/celebration";

function unlockedSeed(): AppState {
  const s = seed();
  s.students.find((x) => x.id === "noah")!.appUnlocked = true;
  return s;
}

function renderStudent(
  state: AppState,
  studentId: string,
  entry: string,
  route: string,
  element: React.ReactNode,
) {
  return render(
    <StoreProvider initialState={state} initialActor={{ role: "student", studentId }}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path={route} element={element} />
        </Routes>
      </MemoryRouter>
    </StoreProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

it("shows the graduation celebration once, then the practice studio home", () => {
  renderStudent(unlockedSeed(), "noah", "/student", "/student", <Dashboard />);
  expect(screen.getByText(/you did it, noah/i)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: /start exploring/i }));
  expect(screen.getByText(/your practice studio/i)).toBeVisible();
  expect(screen.getByText(/start playing/i)).toBeVisible();
  expect(screen.getByRole("link", { name: /tuner/i })).toHaveAttribute("href", "/tools/tuner");
  expect(screen.queryByRole("heading", { name: /today.*practice/i })).toBeNull();
  expect(localStorage.getItem("guitarist:unlock-celebrated:noah")).toBe("1");
});

it("skips the celebration once it was dismissed", () => {
  localStorage.setItem("guitarist:unlock-celebrated:noah", "1");
  renderStudent(unlockedSeed(), "noah", "/student", "/student", <Dashboard />);
  expect(screen.queryByText(/you did it/i)).toBeNull();
  expect(screen.getByText(/welcome back, noah/i)).toBeVisible();
});

it("keeps the course dashboard for students whose app is still locked", () => {
  renderStudent(seed(), "noah", "/student", "/student", <Dashboard />);
  expect(screen.getByRole("heading", { name: /today.*practice/i })).toBeVisible();
  expect(screen.queryByText(/you did it/i)).toBeNull();
});

it("lets an unlocked student open chapters that are still locked in the course", () => {
  renderStudent(unlockedSeed(), "noah", "/student/learn/level-6", "/student/learn/:levelId", <LevelPage />);
  expect(screen.queryByText(/your teacher will unlock/i)).toBeNull();
});

it("offers to save the studio to the phone after graduation", () => {
  renderStudent(unlockedSeed(), "noah", "/student", "/student", <Dashboard />);
  fireEvent.click(screen.getByRole("button", { name: /start exploring/i }));
  const save = screen.getByRole("button", { name: /save studio to this phone/i });
  expect(save).toBeVisible();
  fireEvent.click(save);
  expect(loadStudioSnapshot()).not.toBeNull();
  expect(screen.getByText(/saved on this phone/i)).toBeVisible();
});

it("in studio mode shows the on-phone note and hides audio check-ins", async () => {
  saveStudioSnapshot({ state: unlockedSeed(), actor: { role: "student", studentId: "noah" }, savedAt: Date.now() });
  markUnlockCelebrated("noah");
  render(
    <StoreProvider>
      <MemoryRouter initialEntries={["/student"]}>
        <Routes>
          <Route path="/student" element={<Dashboard />} />
        </Routes>
      </MemoryRouter>
    </StoreProvider>,
  );
  expect(await screen.findByText(/your studio lives on this phone/i)).toBeVisible();
  expect(screen.queryByLabelText(/audio check-in/i)).toBeNull();
});
