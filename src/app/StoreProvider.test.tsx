import { render, screen, waitFor, act } from "@testing-library/react";
import { beforeEach, expect, it } from "vitest";
import { StoreProvider, useStudio } from "./StoreProvider";
import { loadStudioSnapshot, saveStudioSnapshot } from "../lib/studioSnapshot";
import { seed } from "../test/fixtures";

function Probe() {
  const { status, studioMode, state, dispatch } = useStudio();
  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="mode">{studioMode ? "studio" : "server"}</span>
      <span data-testid="students">{state.students.length}</span>
      <button
        type="button"
        onClick={() => {
          void dispatch({
            type: "completePractice",
            studentId: "noah",
            at: new Date().toISOString(),
            sessionId: `test-session-${Date.now()}`,
            durationSeconds: 600,
            itemIds: [],
          });
        }}
      >
        log session
      </button>
    </div>
  );
}

beforeEach(() => {
  localStorage.clear();
});

it("boots into studio mode from a saved snapshot without a server", async () => {
  const state = seed();
  saveStudioSnapshot({ state, actor: { role: "student", studentId: "noah" }, savedAt: 1 });
  render(
    <StoreProvider>
      <Probe />
    </StoreProvider>,
  );
  // If the provider tried the server instead, jsdom has no server and the
  // status would land on "error" — "ready" proves the snapshot path won.
  await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));
  expect(screen.getByTestId("mode")).toHaveTextContent("studio");
  expect(screen.getByTestId("students")).toHaveTextContent(String(state.students.length));
});

it("persists local changes back to the snapshot", async () => {
  const state = seed();
  const before = state.sessions.length;
  saveStudioSnapshot({ state, actor: { role: "student", studentId: "noah" }, savedAt: 1 });
  render(
    <StoreProvider>
      <Probe />
    </StoreProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));
  await act(async () => {
    screen.getByRole("button", { name: "log session" }).click();
  });
  await waitFor(() => expect(loadStudioSnapshot()?.state.sessions).toHaveLength(before + 1));
});

it("signing out of studio mode removes the snapshot", async () => {
  const state = seed();
  saveStudioSnapshot({ state, actor: { role: "student", studentId: "noah" }, savedAt: 1 });
  function SignOutProbe() {
    const { status, logout } = useStudio();
    return (
      <div>
        <span data-testid="status">{status}</span>
        <button type="button" onClick={() => void logout()}>
          sign out
        </button>
      </div>
    );
  }
  render(
    <StoreProvider>
      <SignOutProbe />
    </StoreProvider>,
  );
  await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("ready"));
  await act(async () => {
    screen.getByRole("button", { name: "sign out" }).click();
  });
  await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("signed-out"));
  expect(loadStudioSnapshot()).toBeNull();
});
