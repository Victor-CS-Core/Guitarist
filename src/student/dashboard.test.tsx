import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { it, expect, beforeEach } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import type { DemoState } from "../domain/types";
import { Dashboard } from "./Dashboard";
import { LevelPage } from "./LevelPage";

function unlockedSeed(): DemoState {
  const s = seed();
  s.students.find((x) => x.id === "noah")!.appUnlocked = true;
  return s;
}

function renderStudent(
  state: DemoState,
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
