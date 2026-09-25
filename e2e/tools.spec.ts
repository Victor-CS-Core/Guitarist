import { test, expect, type Page } from "@playwright/test";

const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "example-test-password";

async function signInAsTeacher(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill("Ktr0nn");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
}

test("tools hub links to all four tools", async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto("/tools");
  await expect(page.getByRole("heading", { name: "Tools" })).toBeVisible();
  for (const name of [
    "Study timer",
    "Chromatic tuner",
    "Rhythm lab",
    "Chord library",
  ]) {
    await expect(page.getByRole("link", { name })).toBeVisible();
  }
  await page.getByRole("link", { name: "Study timer" }).click();
  await expect(page).toHaveURL(/\/tools\/timer$/);
  await expect(
    page.getByRole("heading", { name: "Study timer" }),
  ).toBeVisible();
});

test("study timer renders controls and can start/pause", async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto("/tools/timer");
  await expect(page.getByRole("heading", { name: "Study timer" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Preset durations" }),
  ).toBeVisible();
  for (const preset of ["5 min", "10 min", "15 min", "25 min", "45 min"]) {
    await expect(
      page.getByRole("button", { name: preset, exact: true }),
    ).toBeVisible();
  }
  await expect(page.getByLabel("Timer display")).toContainText("25:00");
  await page.getByRole("button", { name: "10 min", exact: true }).click();
  await expect(page.getByLabel("Timer display")).toContainText("10:00");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("button", { name: "Pause" })).toBeVisible();
  await page.getByRole("button", { name: "Pause" }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByLabel("Timer display")).toContainText("10:00");
});

test("tuner shows the mic-denied fallback with usable reference tones", async ({
  browser,
}) => {
  const context = await browser.newContext();
  // Simulate the user denying the microphone permission prompt:
  // getUserMedia rejects with NotAllowedError, the same rejection a real
  // Chromium produces on denial. (The headless shell used here has no
  // audio capture at all, so it rejects with NotSupportedError instead —
  // the stub keeps the test on the permission-denied path.)
  await context.addInitScript(() => {
    const md = navigator.mediaDevices;
    if (md?.getUserMedia) {
      md.getUserMedia = () =>
        Promise.reject(new DOMException("Permission denied", "NotAllowedError"));
    }
  });
  const page = await context.newPage();
  await signInAsTeacher(page);
  await page.goto("/tools/tuner");
  await expect(
    page.getByRole("heading", { name: "Chromatic tuner" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start tuning" }).click();
  await expect(page.getByRole("status")).toContainText(
    "Microphone access was denied",
  );
  await expect(
    page.getByRole("heading", { name: "Reference tones" }),
  ).toBeVisible();
  const tone = page.getByRole("button", { name: "E2 str 6" });
  await expect(tone).toBeVisible();
  await tone.click();
  await expect(tone).toHaveAttribute("aria-pressed", "true");
  await tone.click();
  await expect(tone).toHaveAttribute("aria-pressed", "false");
  await context.close();
});

test("rhythm lab renders controls and signature changes the beat dots", async ({
  page,
}) => {
  await signInAsTeacher(page);
  await page.goto("/tools/rhythm");
  await expect(page.getByRole("heading", { name: "Rhythm lab" })).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Time signature" }),
  ).toBeVisible();
  await expect(page.getByLabel("Tempo in beats per minute")).toBeVisible();
  await expect(page.getByText("80 BPM")).toBeVisible();
  const dots = page.locator(".beat-dots span");
  await expect(dots).toHaveCount(4);
  await page.getByLabel("Tempo in beats per minute").fill("120");
  await expect(page.getByText("120 BPM")).toBeVisible();
  const sigGroup = page.getByRole("group", { name: "Time signature" });
  await sigGroup.getByRole("button", { name: "6/8" }).click();
  await expect(sigGroup.getByRole("button", { name: "6/8" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dots).toHaveCount(6);
  await expect(page.getByText("6 beats per bar")).toBeVisible();
});

test("chord library renders cards and search filters them", async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto("/tools/chords");
  await expect(
    page.getByRole("heading", { name: "Chord library" }),
  ).toBeVisible();
  await expect(page.getByText("G major")).toBeVisible();
  const search = page.getByLabel("Search chords by name");
  await search.fill("minor");
  await expect(page.getByText("E minor")).toBeVisible();
  await expect(page.getByText("A minor")).toBeVisible();
  await expect(page.getByText("G major")).toHaveCount(0);
  await search.fill("");
  await expect(page.getByText("G major")).toBeVisible();
  await search.fill("zzz-no-such-chord");
  await expect(
    page.getByRole("heading", { name: "No chords found" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.getByText("G major")).toBeVisible();
});
