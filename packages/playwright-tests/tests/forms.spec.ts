import { test, expect } from "@playwright/test";

test.describe("Form Pages", () => {
  test("new recipe form - fill and submit", async ({ page }) => {
    const title = "Test Recipe from Playwright";

    await page.goto("/recipes/new");
    await page.waitForLoadState("networkidle");

    // Fill form fields
    await page.fill('input[name="title"]', title);
    await page.fill(
      'textarea[name="description"]',
      "Automated test recipe description",
    );
    await page.fill('input[name="prepTime"]', "15");
    await page.fill('input[name="cookTime"]', "30");
    await page.selectOption('select[name="difficulty"]', "Medium");
    await page.fill('input[name="servings"]', "4");
    await page.selectOption('select[name="categoryId"]', "1");

    // Submit the form
    await page.getByRole("button", { name: /Create Recipe/i }).click();

    // Server Action creates the recipe, then redirects to /recipes/:id.
    // Detail page renders the recipe title as its <h1>.
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible({ timeout: 15000 });
  });

  test("broken create form - submit", async ({ page }) => {
    await page.goto("/testing/forms/broken-create");
    await page.waitForLoadState("networkidle");

    // Form has default values, just click submit
    await page.getByRole("button", { name: /Submit \(Will Fail\)/i }).click();

    // Wait for the error response
    await page.waitForTimeout(1000);
  });
});
