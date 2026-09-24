import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect } from "vitest";
import { StoreProvider, useDemo } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { AssessmentForm } from "./AssessmentForm";
function Readback() {
  const { state } = useDemo();
  return (
    <output data-testid="assignment">
      {state.assignments.at(-1)?.items[0].activityId}
    </output>
  );
}
it("assigns memory-specific reconstruction and records reinforcement", async () => {
  const user = userEvent.setup();
  render(
    <StoreProvider initialState={seed()} initialActor={{ role: "teacher" }}>
      <AssessmentForm studentId="emma" />
      <Readback />
    </StoreProvider>,
  );
  await user.selectOptions(screen.getByLabelText("Skill"), "chord-am");
  await user.selectOptions(
    screen.getByLabelText("Reinforcement reason"),
    "memory",
  );
  await user.click(
    screen.getByRole("button", { name: "Assign reinforcement" }),
  );
  expect(screen.getByTestId("assignment")).toHaveTextContent(
    "am-reconstruction",
  );
});
it("does not mutate assessment when targeted reinforcement is locked", async () => {
  const user = userEvent.setup();
  render(
    <StoreProvider initialState={seed()} initialActor={{ role: "teacher" }}>
      <AssessmentForm studentId="emma" />
    </StoreProvider>,
  );
  await user.selectOptions(
    screen.getByLabelText("Reinforcement reason"),
    "rhythm",
  );
  expect(
    screen.getByRole("button", { name: "Assign reinforcement" }),
  ).toBeDisabled();
  expect(screen.getByText(/unlock.*Rhythm/i)).toBeVisible();
});
