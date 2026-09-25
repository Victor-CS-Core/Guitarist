export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "guitarist:theme";
export const THEME_ATTRIBUTE = "data-theme";

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark";
}

/** Read the persisted theme; defaults to "light" for anything missing or invalid. */
export function getStoredTheme(): Theme {
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(raw) ? raw : "light";
  } catch {
    return "light";
  }
}

/** Apply a theme to the document. Idempotent. */
export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute(THEME_ATTRIBUTE, theme);
}

/** Persist a theme and apply it. */
export function setStoredTheme(theme: Theme): Theme {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Private browsing or blocked storage: still apply for this session.
  }
  applyTheme(theme);
  return theme;
}

/** Read the stored theme and apply it. Call before first render to avoid a flash. */
export function initTheme(): Theme {
  const theme = getStoredTheme();
  applyTheme(theme);
  return theme;
}
