import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { it, expect } from "vitest";
import { StoreProvider } from "../app/StoreProvider";
import { seed } from "../test/fixtures";
import { ActivityPreviewPage } from "./ActivityPreviewPage";

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
