import { test, expect } from "@playwright/test";

const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "example-test-password";

test("teacher assessments unlock the next chapter for a signed-in student", async ({ page, browser }) => {
  const suffix = Date.now().toString();
  const username = `learner${suffix}`;
  const name = `Learning Player ${suffix}`;
  const password = "example-student-password";

  await page.goto("/");
  await page.getByLabel("Username").fill("Ktr0nn");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Add student" }).click();
  await page.getByLabel("Student name").fill(name);
  await page.getByLabel("Student username").fill(username);
  await page.getByLabel("Student password").fill(password);
  await page.getByRole("button", { name: "Create student" }).click();
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name }) }).click();

  await page.getByRole("tab", { name: "Assess" }).click();
  await page.getByLabel("Skill", { exact: true }).selectOption({ label: "Guitar parts" });
  await page.getByRole("button", { name: "Assign reinforcement" }).click();
  await expect(page.getByRole("status")).toContainText("Reinforcement assigned");
  for (const skill of ["Guitar parts", "String numbers", "Finger numbers", "Holding your guitar", "Your first notes"]) {
    await page.getByLabel("Skill", { exact: true }).selectOption({ label: skill });
    await page.getByRole("button", { name: "Mark mastered" }).click();
    await expect(page.getByRole("status")).toContainText("Assessment saved");
  }
  await page.getByRole("tab", { name: "Overview" }).click();
  await page.getByRole("button", { name: "Unlock Level 2" }).click();
  await expect(page.getByRole("status")).toContainText("next chapter is now available");

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.goto("/student/learn/level-2");
  await expect(studentPage).toHaveURL(/\/$/);
  await studentPage.getByLabel("Username").fill(username);
  await studentPage.getByLabel("Password").fill(password);
  await studentPage.getByRole("button", { name: "Sign in" }).click();
  await studentPage.goto("/student/learn/level-2");
  await expect(studentPage.getByRole("heading", { name: "First Notes" })).toBeVisible();
  await studentPage.reload();
  await expect(studentPage.getByRole("heading", { name: "First Notes" })).toBeVisible();
  await studentContext.close();
});
