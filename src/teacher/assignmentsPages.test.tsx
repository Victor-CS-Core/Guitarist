import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { AssignmentsOverview } from "./AssignmentsOverview";
import { ActivityPreviewPage } from "./ActivityPreviewPage";
import { StudentDetail } from "./StudentDetail";

function renderOverview() {
  render(
    <MemoryRouter>
      <StoreProvider initialState={seed()} initialActor={{ role: "teacher" }}>
        <AssignmentsOverview />
      </StoreProvider>
    </MemoryRouter>,
  );
}

it("lists every assigned exercise across students", () => {
  renderOverview();
  expect(
    screen.getByRole("heading", { name: "All assignments" }),
  ).toBeVisible();
  for (const title of [
    "Hello, E minor",
    "Make friends with A minor",
    "Rebuild Am from memory",
    "String explorer",
    "Your first little melody",
  ])
    expect(screen.getByText(title)).toBeVisible();
  expect(screen.getAllByText("Emma").length).toBeGreaterThan(0);
  expect(screen.getAllByText("Noah").length).toBeGreaterThan(0);
});

it("filters the overview by student", async () => {
  const user = userEvent.setup();
  renderOverview();
  await user.selectOptions(screen.getByLabelText("Student"), "noah");
  expect(screen.getByText("String explorer")).toBeVisible();
  expect(screen.queryByText("Hello, E minor")).not.toBeInTheDocument();
  await user.selectOptions(screen.getByLabelText("Student"), "");
  expect(screen.getByText("Hello, E minor")).toBeVisible();
});

it("filters the overview by completion status", async () => {
  const user = userEvent.setup();
  renderOverview();
  await user.selectOptions(screen.getByLabelText("Status"), "complete");
  expect(
    screen.getByText("No exercises match these filters."),
  ).toBeVisible();
  await user.selectOptions(screen.getByLabelText("Status"), "open");
  expect(screen.getByText("Hello, E minor")).toBeVisible();
});

it("previews an activity exactly as the student sees it", () => {
  render(
    <MemoryRouter
      initialEntries={[
        "/teacher/preview/activity/em-shape?studentId=emma&itemId=emma-em",
      ]}
    >
      <StoreProvider initialState={seed()} initialActor={{ role: "teacher" }}>
        <Routes>
          <Route
            path="/teacher/preview/activity/:activityId"
            element={<ActivityPreviewPage />}
          />
        </Routes>
      </StoreProvider>
    </MemoryRouter>,
  );
  expect(screen.getAllByText("Hello, E minor").length).toBeGreaterThan(0);
  // Student context: title, description, steps, and the student exercise UI.
  expect(screen.getByText("Let every string ring.")).toBeVisible();
  expect(screen.getByText(/Emma · 3 min · 3 rounds/)).toBeVisible();
});

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
