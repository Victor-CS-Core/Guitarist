import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { it, expect } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { AssignmentsOverview } from "./AssignmentsOverview";

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
