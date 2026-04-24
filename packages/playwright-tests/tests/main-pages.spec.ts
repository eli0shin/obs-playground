import { test, expect } from "@playwright/test";

test.describe("Main Pages", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test("recipe detail pages", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const recipeLinks = page.locator('a[href^="/recipes/"]');
    const count = await recipeLinks.count();
    expect(count).toBeGreaterThan(0);

    const href = await recipeLinks.first().getAttribute("href");
    expect(href).toBeTruthy();
    const recipeUrl = String(href);

    await page.goto(recipeUrl);
    await page.waitForLoadState("networkidle");

    for (const subpage of ["with-cost", "nutrition", "full"]) {
      await page.goto(`${recipeUrl}/${subpage}`);
      await page.waitForLoadState("networkidle");
    }
  });

  test("shopping list", async ({ page }) => {
    await page.goto("/shopping-list");
    await page.waitForLoadState("networkidle");
  });

  test("meal planner", async ({ page }) => {
    await page.goto("/meal-planner");
    await page.waitForLoadState("networkidle");
  });

  test("batch nutrition", async ({ page }) => {
    await page.goto("/batch-nutrition");
    await page.waitForLoadState("networkidle");
  });

  // Category pages
  for (const slug of ["breakfast", "lunch", "dinner", "dessert", "snacks"]) {
    test(`category - ${slug}`, async ({ page }) => {
      await page.goto(`/categories/${slug}`);
      await page.waitForLoadState("networkidle");
    });
  }
});
