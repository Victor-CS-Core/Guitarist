import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
import { initTheme } from "./lib/theme";
// Set the persisted theme before the first paint so the page never flashes
// the wrong theme on load.
initTheme();
import "./app/styles.css";
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

import "./app/visual-refinement.css";

// The app is installable (PWA). Register the service worker in production
// builds only; dev stays uncached so iteration is never stale.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* offline support is a nicety; the app works without it */
    });
  });
}
