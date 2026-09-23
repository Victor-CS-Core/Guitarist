import { test, expect } from "@playwright/test";
test("Noah practices, teacher assesses, then explicitly unlocks", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Demo view").selectOption("noah");
  await page.getByRole("link", { name: "View practice" }).click();
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await page.getByRole("button", { name: "Next activity" }).click();
  await page.getByRole("button", { name: "Resume", exact: true }).click();
  await page.getByRole("button", { name: "Finish practice" }).click();
  await expect(
    page.getByRole("heading", { name: "Practice complete." }),
  ).toBeVisible();
  await page.getByLabel("Demo view").selectOption("teacher");
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: "Noah", exact: true }) })
    .click();
  await page.getByRole("tab", { name: "Activity", exact: true }).click();
  await expect(page.getByText(/sec practiced/)).toBeVisible();
  await page.getByRole("tab", { name: "Assess", exact: true }).click();
  for (const skill of [
    "guitar-parts",
    "string-numbers",
    "finger-numbers",
    "holding",
    "picking",
  ]) {
    await page.getByLabel("Skill", { exact: true }).selectOption(skill);
    await page
      .getByRole("button", { name: "Mark mastered", exact: true })
      .click();
  }
  await page.getByRole("tab", { name: "Overview", exact: true }).click();
  await expect(
    page.getByText(/All prerequisite skills are mastered/),
  ).toBeVisible();
  await page.getByRole("button", { name: "Unlock Level 2" }).click();
  await page.getByLabel("Demo view").selectOption("noah");
  await expect(
    page.getByRole("heading", { name: "First Notes", exact: true }),
  ).toBeVisible();
});
test("memory reinforcement reaches Emma and direct routes survive refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Demo view").selectOption("teacher");
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name: "Emma", exact: true }) })
    .click();
  await page.getByRole("tab", { name: "Assess", exact: true }).click();
  await page.getByLabel("Skill", { exact: true }).selectOption("chord-am");
  await page.getByLabel("Reinforcement reason").selectOption("memory");
  await page.getByRole("button", { name: "Assign reinforcement" }).click();
  await expect(page.getByText(/Reinforcement assigned/)).toBeVisible();
  await page.getByLabel("Demo view").selectOption("emma");
  await page.goto("/student/practice");
  await expect(page.getByText("Rebuild Am from memory").first()).toBeVisible();
  await page.goto("/student/progress");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your progress" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await page.goBack();
  await expect(page).toHaveURL(/\/student\/progress$/);
});
test("mobile has no overflow and direct locked/teacher routes are guarded", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/student");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "/tmp/guitarist-mobile.png", fullPage: true });
  await page.getByLabel("Demo view").selectOption("noah");
  await page.goto("/student/learn/level-6");
  await expect(page.getByText(/Your teacher will unlock/)).toBeVisible();
  await page.goto("/teacher");
  await expect(page.getByText(/Use the demo view selector/)).toBeVisible();
});
test("desktop dashboard renders without runtime errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/student");
  await expect(
    page.getByRole("heading", { name: /Good to see you/ }),
  ).toBeVisible();
  await page.screenshot({ path: "/tmp/guitarist-desktop.png", fullPage: true });
  expect(errors).toEqual([]);
});
test("unfinished practice offers stay/leave and can finish early", async ({
  page,
}) => {
  await page.goto("/student/practice");
  await page
    .getByRole("button", { name: "Start practice", exact: true })
    .click();
  await page.getByRole("link", { name: "Home", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Leave this practice?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Keep practicing", exact: true })
    .click();
  await expect(page.getByLabel("Practice elapsed time")).not.toHaveText(
    "00:00",
  );
  await page.getByRole("button", { name: "Finish early", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Practice complete." }),
  ).toBeVisible();
});
test("practice follows requested item across query navigation", async ({
  page,
}) => {
  await page.goto("/student/practice?item=emma-em");
  await expect(
    page.getByRole("heading", { name: "Hello, E minor", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Practice", exact: true }).click();
  await expect(
    page.getByText("3 activities · about 11 minutes · at your own pace"),
  ).toBeVisible();
});
