import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { it, expect } from "vitest";
import { StoreProvider } from "../demo/StoreProvider";
import { seed } from "../demo/seed";
import { LevelPage } from "./LevelPage";
it("keeps locked material unavailable on direct navigation", () => {
  render(
    <StoreProvider
      initialState={seed()}
      initialActor={{ role: "student", studentId: "noah" }}
    >
      <MemoryRouter initialEntries={["/student/learn/level-6"]}>
        <Routes>
          <Route path="/student/learn/:levelId" element={<LevelPage />} />
        </Routes>
      </MemoryRouter>
    </StoreProvider>,
  );
  expect(screen.getByText(/your teacher will unlock/i)).toBeVisible();
  expect(
    screen.queryByRole("button", { name: /start this lesson/i }),
  ).toBeNull();
});
