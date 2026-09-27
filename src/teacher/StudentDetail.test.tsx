import { render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { StudentDetail } from "./StudentDetail";

it("links student names to that student's Assignments tab", () => {
  render(
    <MemoryRouter initialEntries={["/teacher/students/emma?tab=Assignments"]}>
      <StoreProvider initialState={seed()} initialActor={{ role: "teacher" }}>
        <Routes>
          <Route
            path="/teacher/students/:studentId"
            element={<StudentDetail />}
          />
        </Routes>
      </StoreProvider>
    </MemoryRouter>,
  );
  const tab = screen.getByRole("tab", { name: "Assignments" });
  expect(tab).toHaveAttribute("aria-selected", "true");
  expect(screen.getByRole("heading", { name: "Assigned practice" })).toBeVisible();
  expect(
    within(screen.getByRole("tabpanel")).getAllByText("Hello, E minor").length,
  ).toBeGreaterThan(0);
});
