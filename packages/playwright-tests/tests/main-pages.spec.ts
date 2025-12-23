import { test } from "@playwright/test";

test.describe("Main Pages", () => {
  test("home page", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  // Recipe detail pages
  for (const id of ["1", "2", "3"]) {
    test(`recipe ${id} - basic`, async ({ page }) => {
      await page.goto(`/recipes/${id}`);
      await page.waitForLoadState("networkidle");
    });

    test(`recipe ${id} - with cost`, async ({ page }) => {
      await page.goto(`/recipes/${id}/with-cost`);
      await page.waitForLoadState("networkidle");
    });

    test(`recipe ${id} - nutrition`, async ({ page }) => {
      await page.goto(`/recipes/${id}/nutrition`);
      await page.waitForLoadState("networkidle");
    });

    test(`recipe ${id} - full`, async ({ page }) => {
      await page.goto(`/recipes/${id}/full`);
      await page.waitForLoadState("networkidle");
    });
  }

  test("recipe compare", async ({ page }) => {
    await page.goto("/recipes/compare?ids=1,2");
    await page.waitForLoadState("networkidle");
  });

  test("shopping list", async ({ page }) => {
    await page.goto("/shopping-list?ids=1,2");
    await page.waitForLoadState("networkidle");
  });

  test("meal planner", async ({ page }) => {
    await page.goto("/meal-planner");
    await page.waitForLoadState("networkidle");
  });

  test("batch nutrition", async ({ page }) => {
    await page.goto("/batch-nutrition?ids=1,2,3");
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
