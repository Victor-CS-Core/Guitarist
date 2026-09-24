import { test, expect } from "@playwright/test";

const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "example-test-password";

test("signed-out visitors see only login, including on protected deep links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to Guitarist" })).toBeVisible();
  await expect(page.getByText("Emma")).toHaveCount(0);
  await page.goto("/teacher/students/private-id");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("heading", { name: "Sign in to Guitarist" })).toBeVisible();
});

test("teacher creates a student without email and practice persists across browsers", async ({ page, browser }) => {
  const username = `player${Date.now()}`;
  const displayName = `Practice Player ${Date.now()}`;
  const password = "example-student-password";
  await page.goto("/");
  await page.getByLabel("Username").fill("Ktr0nn");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
  await page.getByRole("button", { name: "Add student" }).click();
  await page.getByLabel("Student name").fill(displayName);
  await page.getByLabel("Student username").fill(username);
  await page.getByLabel("Student password").fill(password);
  await page.getByRole("button", { name: "Create student" }).click();
  await expect(page.getByRole("heading", { name: displayName })).toBeVisible();
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name: displayName }) }).click();
  await page.getByRole("tab", { name: "Assignments" }).click();
  await page.getByRole("button", { name: "Assign practice" }).click();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.goto("/");
  await studentPage.getByLabel("Username").fill(username);
  await studentPage.getByLabel("Password").fill(password);
  await studentPage.getByRole("button", { name: "Sign in" }).click();
  await expect(studentPage).toHaveURL(/\/student$/);
  await studentPage.getByRole("link", { name: /Start practice/ }).click();
  await studentPage.getByRole("button", { name: "Start practice", exact: true }).click();
  await studentPage.route("**/api/commands", (route) => route.fulfill({ status: 409, contentType: "application/json", body: '{"error":"Progress changed. Reload and try again."}' }));
  await studentPage.getByRole("button", { name: "Finish practice" }).click();
  await expect(studentPage.getByRole("alert")).toContainText("Progress changed");
  await studentPage.unroute("**/api/commands");
  await studentPage.getByRole("button", { name: "Finish practice" }).click();
  await expect(studentPage.getByRole("heading", { name: "Practice complete." })).toBeVisible();
  await studentPage.goto("/student/progress");
  await studentPage.reload();
  await expect(studentPage.getByText("PRACTICE SESSIONS")).toBeVisible();
  await expect(studentPage.getByText("PRACTICE SESSIONS").locator("..").getByText("1")).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Activity" }).click();
  await expect(page.getByText(/sec practiced/)).toBeVisible();
  await studentPage.route("**/api/logout", (route) => route.fulfill({ status: 503, contentType: "application/json", body: '{"error":"Temporary failure"}' }));
  await studentPage.getByRole("button", { name: "Sign out" }).click();
  await expect(studentPage.getByRole("status")).toContainText("Could not sign out");
  await expect(studentPage).toHaveURL(/\/student\/progress$/);
  await studentPage.unroute("**/api/logout");
  await studentPage.getByRole("button", { name: "Sign out" }).click();
  await expect(studentPage.getByRole("heading", { name: "Sign in to Guitarist" })).toBeVisible();
  await studentContext.close();
});

test("password reset and disabling revoke a student's active session", async ({ page, browser }) => {
  const suffix = Date.now().toString();
  const username = `access${suffix}`;
  const name = `Access Player ${suffix}`;
  const firstPassword = "example-student-password";
  const nextPassword = "another-student-password";
  await page.goto("/");
  await page.getByLabel("Username").fill("Ktr0nn");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Add student" }).click();
  await page.getByLabel("Student name").fill(name);
  await page.getByLabel("Student username").fill(username);
  await page.getByLabel("Student password").fill(firstPassword);
  await page.getByRole("button", { name: "Create student" }).click();
  await page.getByRole("link").filter({ has: page.getByRole("heading", { name }) }).click();

  const studentContext = await browser.newContext();
  const studentPage = await studentContext.newPage();
  await studentPage.goto("/");
  await studentPage.getByLabel("Username").fill(username);
  await studentPage.getByLabel("Password").fill(firstPassword);
  await studentPage.getByRole("button", { name: "Sign in" }).click();
  await expect(studentPage).toHaveURL(/\/student$/);

  await page.getByRole("tab", { name: "Account" }).click();
  await page.getByLabel("New password").fill(nextPassword);
  await page.getByRole("button", { name: "Reset password" }).click();
  await expect(page.getByRole("status")).toContainText("Password changed");
  await studentPage.reload();
  await expect(studentPage.getByRole("heading", { name: "Sign in to Guitarist" })).toBeVisible();
  await studentPage.getByLabel("Username").fill(username);
  await studentPage.getByLabel("Password").fill(nextPassword);
  await studentPage.getByRole("button", { name: "Sign in" }).click();
  await expect(studentPage).toHaveURL(/\/student$/);

  await page.getByRole("button", { name: "Disable student access" }).click();
  await expect(page.getByRole("status")).toContainText("Student access disabled");
  await studentPage.reload();
  await expect(studentPage.getByRole("heading", { name: "Sign in to Guitarist" })).toBeVisible();
  await studentContext.close();
});
