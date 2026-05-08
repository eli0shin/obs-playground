import { test, expect } from "@playwright/test";

test.describe("Recipe CRUD", () => {
  test("create a recipe, then view and edit it", async ({ page }) => {
    const title = `Playwright Recipe ${Date.now()}`;

    await page.goto("/recipes/new");
    await page.getByLabel(/Recipe Title/i).fill(title);
    await page
      .getByLabel(/Description/i)
      .fill("Automated recipe test");
    await page.getByLabel(/Prep Time/i).fill("7");
    await page.getByLabel(/Cook Time/i).fill("14");
    await page.getByLabel(/Difficulty/i).selectOption({ label: "Medium" });
    await page.getByLabel(/Servings/i).fill("3");
    await page.getByLabel(/Category/i).selectOption({ index: 1 });
    await page.getByRole("button", { name: /Create Recipe/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: /^Edit$/i }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: /Edit Recipe/i }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByLabel(/Recipe Title/i).fill(`${title} (edited)`);
    await page.getByRole("button", { name: /Save Changes/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: `${title} (edited)` }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("create then delete a recipe", async ({ page }) => {
    const title = `Playwright Delete Target ${Date.now()}`;

    await page.goto("/recipes/new");
    await page.getByLabel(/Recipe Title/i).fill(title);
    await page.getByLabel(/Description/i).fill("to be deleted");
    await page.getByLabel(/Prep Time/i).fill("1");
    await page.getByLabel(/Cook Time/i).fill("1");
    await page.getByLabel(/Difficulty/i).selectOption({ label: "Easy" });
    await page.getByLabel(/Servings/i).fill("1");
    await page.getByLabel(/Category/i).selectOption({ index: 1 });
    await page.getByRole("button", { name: /Create Recipe/i }).click();

    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /Delete/i }).click();

    await page.waitForURL("/");

    await expect(
      page.getByRole("heading", { level: 2, name: "All Recipes" }),
    ).toBeVisible({ timeout: 15000 });

    await expect(
      page.getByRole("heading", { level: 3, name: title }),
    ).toHaveCount(0);
  });
});
