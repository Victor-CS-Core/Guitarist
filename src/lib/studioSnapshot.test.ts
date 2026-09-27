import { describe, it, expect, beforeEach } from "vitest";
import { saveStudioSnapshot, loadStudioSnapshot, clearStudioSnapshot } from "./studioSnapshot";
import { seed } from "../test/fixtures";

const KEY = "guitarist:studio-snapshot:v1";

beforeEach(() => {
  localStorage.clear();
});

describe("studioSnapshot", () => {
  it("round-trips a snapshot", () => {
    const state = seed();
    expect(
      saveStudioSnapshot({ state, actor: { role: "student", studentId: "noah" }, savedAt: 123 }),
    ).toBe(true);
    const loaded = loadStudioSnapshot();
    expect(loaded?.actor).toEqual({ role: "student", studentId: "noah" });
    expect(loaded?.savedAt).toBe(123);
    expect(loaded?.state.students.map((s) => s.id)).toEqual(state.students.map((s) => s.id));
  });

  it("returns null when nothing is saved", () => {
    expect(loadStudioSnapshot()).toBeNull();
  });

  it("returns null for corrupt or foreign data", () => {
    localStorage.setItem(KEY, "not json{");
    expect(loadStudioSnapshot()).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ state: {} }));
    expect(loadStudioSnapshot()).toBeNull();
    localStorage.setItem(KEY, JSON.stringify({ state: { version: 1 }, actor: { role: "teacher" } }));
    expect(loadStudioSnapshot()).toBeNull();
  });

  it("clear removes the snapshot", () => {
    saveStudioSnapshot({ state: seed(), actor: { role: "student", studentId: "noah" }, savedAt: 1 });
    expect(loadStudioSnapshot()).not.toBeNull();
    clearStudioSnapshot();
    expect(loadStudioSnapshot()).toBeNull();
  });
});
