import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { it, expect } from "vitest";
import { StoreProvider, useStudio } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { AssignmentForm } from "./AssignmentForm";

function Probe() {
  const { state } = useStudio();
  return (
    <div data-testid="assignment-count">{state.assignments.length}</div>
  );
}

function LastAssignmentItems() {
  const { state } = useStudio();
  const last = state.assignments.at(-1);
  return (
    <div data-testid="last-items">
      {(last?.items ?? []).map((i) => `${i.activityId}:${i.dueDate ?? "none"}`).join(",")}
    </div>
  );
}

function renderForm(studentId = "emma") {
  render(
    <MemoryRouter>
      <StoreProvider initialState={seed()} initialActor={{ role: "teacher" }}>
        <AssignmentForm studentId={studentId} />
        <Probe />
        <LastAssignmentItems />
      </StoreProvider>
    </MemoryRouter>,
  );
}

/** The tap-to-pick activity cards (distinct from the set panel's move/remove buttons). */
function card(name: RegExp): HTMLElement {
  const found = [...document.querySelectorAll(".activity-pick-card")].find(
    (c) => c.textContent?.match(name),
  );
  if (!found) throw new Error(`activity card not found: ${name}`);
  return found as HTMLElement;
}

it("builds a multi-activity set by tapping cards and assigns it", async () => {
  const user = userEvent.setup();
  renderForm();
  expect(screen.getByRole("heading", { name: "Build the practice set." })).toBeVisible();
  // Presets are offered up front.
  expect(screen.getByRole("button", { name: "Quick warm-up" })).toBeVisible();

  // Tap two activity cards to add them in order.
  await user.click(card(/String explorer/));
  await user.click(card(/Your first little melody/));
  expect(
    screen.getByRole("heading", { name: /Your set · 2 activities/ }),
  ).toBeVisible();

  // Tapping a selected card removes it again.
  await user.click(card(/String explorer/));
  expect(
    screen.getByRole("heading", { name: /Your set · 1 activity/ }),
  ).toBeVisible();
  await user.click(card(/String explorer/));

  const before = Number(screen.getByTestId("assignment-count").textContent);
  await user.click(
    screen.getByRole("button", { name: /Assign 2 activities/ }),
  );
  expect(
    await screen.findByText(/Assigned 2 activities · about \d+ minutes/),
  ).toBeVisible();
  expect(Number(screen.getByTestId("assignment-count").textContent)).toBe(
    before + 1,
  );
  // The set clears after a successful assign.
  expect(screen.queryByText(/Your set/)).not.toBeInTheDocument();
});

it("fills the set from a preset and applies a due-date chip", async () => {
  const user = userEvent.setup();
  renderForm();
  // Chord foundations is fully inside emma's unlocked chapters.
  await user.click(screen.getByRole("button", { name: "Chord foundations" }));
  expect(
    screen.getByRole("heading", { name: /Your set · 2 activities/ }),
  ).toBeVisible();

  // Steppers tune the first item's minutes.
  const setPanel = screen.getByText(/Your set/).closest("div")!.parentElement!;
  const firstRow = within(setPanel).getAllByRole("group", { name: /minutes/ })[0];
  const minutesLabel = within(firstRow).getByText(/\d+m/);
  const beforeMinutes = Number(minutesLabel.textContent!.replace("m", ""));
  await user.click(within(firstRow).getByRole("button", { name: "More minutes" }));
  expect(minutesLabel.textContent).toBe(`${beforeMinutes + 1}m`);

  await user.click(screen.getByRole("button", { name: "Tomorrow" }));
  await user.click(screen.getByRole("button", { name: /Assign 2 activities/ }));
  await screen.findByText(/Assigned 2 activities/);
  const items = screen.getByTestId("last-items").textContent!;
  const tomorrow = new Date(Date.now() + 86400000);
  const iso = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  expect(items).toContain(`em-shape:${iso}`);
  expect(items).toContain(`am-shape:${iso}`);
});

it("only offers activities from unlocked chapters and lets the set be reordered", async () => {
  const user = userEvent.setup();
  renderForm("noah"); // level-1 only
  expect(screen.getByText(/Chapter 1/)).toBeVisible();
  expect(screen.queryByText(/Chapter 2/)).not.toBeInTheDocument();
  // A preset whose activities are all locked reports that instead of filling.
  await user.click(screen.getByRole("button", { name: "Chord foundations" }));
  expect(
    screen.getByText(/hasn't unlocked yet/),
  ).toBeVisible();

  await user.click(screen.getByRole("button", { name: /String explorer/ }));
  await user.click(screen.getByRole("button", { name: /Your first little melody/ }));
  const setPanel = screen.getByText(/Your set/).closest("div")!.parentElement!;
  const titles = () =>
    within(setPanel)
      .getAllByRole("button", { name: /Move .* earlier/ })
      .map((b) => b.getAttribute("aria-label"));
  expect(titles()[0]).toContain("String explorer");
  await user.click(
    within(setPanel).getByRole("button", { name: /Move String explorer later/ }),
  );
  expect(titles()[0]).toContain("Your first little melody");
});
