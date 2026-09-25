import { fireEvent, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { PracticePage } from "./PracticePage";

// useBlocker needs a data router, so mount through one rather than MemoryRouter.
function renderPractice(item: string) {
  const router = createMemoryRouter(
    [{ path: "/student/practice", element: <PracticePage /> }],
    { initialEntries: [`/student/practice?item=${item}`] },
  );
  return render(
    <StoreProvider
      initialState={seed()}
      initialActor={{ role: "student", studentId: "noah" }}
    >
      <RouterProvider router={router} />
    </StoreProvider>,
  );
}

describe("PracticePage suggested-tempo chip", () => {
  it("shows the chip for an activity with a tempo preset", () => {
    renderPractice("noah-notes");
    expect(
      screen.getByRole("button", {
        name: /suggested tempo of 60 BPM in 4\/4/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Suggested: 60 BPM · 4\/4/)).toBeInTheDocument();
  });

  it("shows no chip for an activity without a preset", () => {
    renderPractice("noah-strings");
    expect(
      screen.queryByRole("button", { name: /Suggested:/ }),
    ).toBeNull();
  });

  it("loads the preset into the metronome when the chip is tapped", () => {
    renderPractice("noah-notes");
    const bpm = screen.getByLabelText("Beats per minute");
    // Change it away first so the chip tap proves it loads the preset back.
    fireEvent.change(bpm, { target: { value: "70" } });
    expect(screen.getByLabelText("Beats per minute")).toHaveValue(70);
    fireEvent.click(
      screen.getByRole("button", { name: /suggested tempo of 60 BPM in 4\/4/i }),
    );
    expect(screen.getByLabelText("Beats per minute")).toHaveValue(60);
  });
});
