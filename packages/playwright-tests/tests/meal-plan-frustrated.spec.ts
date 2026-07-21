import { test, expect, type Page } from "@playwright/test";

async function openMealPlannerFromHome(page: Page) {
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await Promise.all([
    page.waitForURL(/\/meal-planner$/),
    page.getByRole("link", { name: /Weekly Meal Planner/i }).click(),
  ]);
  await expect(
    page.getByRole("heading", { level: 1, name: "Generate a Meal Plan" }),
  ).toBeVisible({ timeout: 15000 });
}

async function submitFailedAttempt(page: Page, attempt: number) {
  await page.locator('select[name="customerSegment"]').selectOption("vegetarian");
  await page.locator('select[name="fulfillmentRegion"]').selectOption("northeast");
  await page.locator('select[name="diet"]').selectOption("vegetarian");
  await page.locator('input[name="allergens"]').fill("");
  await page
    .locator('input[name="preferences"]')
    .fill(attempt % 2 === 0 ? "quick,variety" : "quick");
  await page.locator('input[name="budgetMaxUsd"]').fill(String(25 + attempt));
  await page.locator('input[name="mealCount"]').fill("3");
  await page
    .locator('select[name="failureScenario"]')
    .selectOption("vegetarian_produce_shortage_northeast");
  await expect(page.locator('select[name="failureScenario"]')).toHaveValue(
    "vegetarian_produce_shortage_northeast",
  );
  await page.getByRole("button", { name: "Generate meal plan" }).click();

  await expect(
    page.getByRole("heading", {
      level: 2,
      name: "Planning could not build a valid meal plan",
    }),
  ).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/inventory_unavailable/)).toBeVisible({
    timeout: 15000,
  });
}

test.describe("frustrated meal planner customer", () => {
  test("vegetarian northeast user retries 15 times during produce shortage", async ({
    page,
  }) => {
    await openMealPlannerFromHome(page);

    for (let attempt = 1; attempt <= 15; attempt += 1) {
      await submitFailedAttempt(page, attempt);
    }

    await page.getByRole("link", { name: /Back to home/i }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("link", { name: /Pancakes/i }).click();
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("heading", { name: /Pancakes/i })).toBeVisible();
  });
});
