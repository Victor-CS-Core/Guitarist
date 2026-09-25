import { describe, expect, it, beforeEach } from "vitest";
import {
  THEME_STORAGE_KEY,
  THEME_ATTRIBUTE,
  getStoredTheme,
  setStoredTheme,
  applyTheme,
  initTheme,
} from "./theme";

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.removeAttribute(THEME_ATTRIBUTE);
});

describe("theme helpers", () => {
  it("defaults to light when nothing is stored", () => {
    expect(getStoredTheme()).toBe("light");
  });

  it("rejects unexpected stored values", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "midnight");
    expect(getStoredTheme()).toBe("light");
  });

  it("returns the stored theme", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    expect(getStoredTheme()).toBe("dark");
  });

  it("setStoredTheme persists and applies the theme", () => {
    setStoredTheme("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
    expect(getStoredTheme()).toBe("dark");
  });

  it("applyTheme only sets the attribute", () => {
    applyTheme("dark");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it("initTheme applies the stored theme without writing", () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, "dark");
    const spy = vitest.spyOn(Storage.prototype, "setItem");
    const theme = initTheme();
    expect(theme).toBe("dark");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("dark");
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it("initTheme applies light by default", () => {
    expect(initTheme()).toBe("light");
    expect(document.documentElement.getAttribute(THEME_ATTRIBUTE)).toBe("light");
  });
});
