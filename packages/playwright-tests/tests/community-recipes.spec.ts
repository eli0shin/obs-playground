import { test, expect } from "@playwright/test";

test.describe("Community Recipes", () => {
  test("list page loads", async ({ page }) => {
    await page.goto("/community-recipes");
    await expect(
      page.getByRole("heading", { level: 1, name: /Community Recipes/i }),
    ).toBeVisible();
  });

  test("new recipe form loads", async ({ page }) => {
    await page.goto("/community-recipes/new");
    await expect(page.getByLabel(/Recipe Title/i)).toBeVisible();
  });

  test("create a recipe, then view and edit it", async ({ page }) => {
    const title = `Playwright Recipe ${Date.now()}`;

    await page.goto("/community-recipes/new");
    await page.getByLabel(/Recipe Title/i).fill(title);
    await page.getByLabel(/Description/i).fill("Automated community-recipe test");
    await page.getByLabel(/Prep Time/i).fill("7");
    await page.getByLabel(/Cook Time/i).fill("14");
    await page.getByLabel(/Difficulty/i).selectOption({ label: "Medium" });
    await page.getByLabel(/Servings/i).fill("3");
    await page.getByRole("button", { name: /Create Recipe/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();

    await page.getByRole("link", { name: /^Edit$/i }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Edit Recipe/i }),
    ).toBeVisible();

    await page.getByLabel(/Recipe Title/i).fill(`${title} (edited)`);
    await page.getByRole("button", { name: /Save Changes/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: `${title} (edited)` }),
    ).toBeVisible();
  });

  test("create then delete a recipe", async ({ page }) => {
    const title = `Playwright Delete Target ${Date.now()}`;

    await page.goto("/community-recipes/new");
    await page.getByLabel(/Recipe Title/i).fill(title);
    await page.getByLabel(/Description/i).fill("to be deleted");
    await page.getByLabel(/Prep Time/i).fill("1");
    await page.getByLabel(/Cook Time/i).fill("1");
    await page.getByLabel(/Difficulty/i).selectOption({ label: "Easy" });
    await page.getByLabel(/Servings/i).fill("1");
    await page.getByRole("button", { name: /Create Recipe/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();

    await page.getByRole("button", { name: /Delete/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: /Community Recipes/i }),
    ).toBeVisible();
  });

  test("list page after activity", async ({ page }) => {
    await page.goto("/community-recipes");
    await expect(
      page.getByRole("heading", { level: 1, name: /Community Recipes/i }),
    ).toBeVisible();
  });
});
