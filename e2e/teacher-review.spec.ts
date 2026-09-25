import { test, expect, type Page } from "@playwright/test";

const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? "example-test-password";

async function signInAsTeacher(page: Page) {
  await page.goto("/");
  await page.getByLabel("Username").fill("Ktr0nn");
  await page.getByLabel("Password").fill(adminPassword);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/teacher$/);
}

async function createStudent(page: Page) {
  const suffix = Date.now().toString();
  const username = `review${suffix}`;
  const name = `Review Player ${suffix}`;
  const password = "example-student-password";
  await page.getByRole("button", { name: "Add student" }).click();
  await page.getByLabel("Student name").fill(name);
  await page.getByLabel("Student username").fill(username);
  await page.getByLabel("Student password").fill(password);
  await page.getByRole("button", { name: "Create student" }).click();
  await expect(page.getByRole("heading", { name })).toBeVisible();
  await page
    .getByRole("link")
    .filter({ has: page.getByRole("heading", { name }) })
    .click();
  return { username, name, password };
}

test("teacher assignments overview lists an assigned exercise with a preview link", async ({
  page,
}) => {
  await signInAsTeacher(page);
  const { name } = await createStudent(page);
  await page.getByRole("tab", { name: "Assignments" }).click();
  const form = page.locator("form", {
    has: page.getByRole("heading", { name: "Plan the next small step." }),
  });
  await form.getByRole("button", { name: "Assign practice" }).click();
  await expect(form.getByRole("status")).toContainText("Practice assigned");

  await page.goto("/teacher/assignments");
  await expect(
    page.getByRole("heading", { name: "All assignments" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name })).toBeVisible();
  await expect(page.getByText(/assigned exercise/)).toBeVisible();
  const preview = page.getByRole("link", { name: "Preview as student" }).first();
  await expect(preview).toBeVisible();
  await preview.click();
  await expect(page).toHaveURL(/\/teacher\/preview\/activity\/[^/]+/);
  await expect(page.getByText("STUDENT PREVIEW")).toBeVisible();
  await expect(page.getByRole("heading").first()).toBeVisible();
});

test("activity preview renders a known curriculum activity", async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto("/teacher/preview/activity/first-notes");
  await expect(page.getByText("STUDENT PREVIEW")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your first little melody" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Back to all assignments" }),
  ).toBeVisible();
});

test("activity preview handles an unknown activity id", async ({ page }) => {
  await signInAsTeacher(page);
  await page.goto("/teacher/preview/activity/not-a-real-activity");
  await expect(
    page.getByRole("heading", { name: "That activity isn’t here." }),
  ).toBeVisible();
});
