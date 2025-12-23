import { test } from "@playwright/test";

test.describe("Client-Side Actions", () => {
  test.describe("broken API page", () => {
    test("click all error buttons", async ({ page }) => {
      await page.goto("/testing/client/broken-api");
      await page.waitForLoadState("networkidle");

      // Click each button and wait for the request to complete
      await page.getByRole("button", { name: /Test 500 Error/i }).click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: /Test 404 Not Found/i }).click();
      await page.waitForTimeout(500);

      await page
        .getByRole("button", { name: /Test 400 Validation Error/i })
        .click();
      await page.waitForTimeout(500);
    });
  });

  test.describe("broken mutation page", () => {
    test("click all mutation buttons", async ({ page }) => {
      await page.goto("/testing/client/broken-mutation");
      await page.waitForLoadState("networkidle");

      // Click each button sequentially (using exact text to avoid ambiguity)
      await page
        .getByRole("button", { name: /^Error Mutation mutation/i })
        .click();
      await page.waitForTimeout(500);

      await page
        .getByRole("button", { name: /^Validation Error Mutation/i })
        .click();
      await page.waitForTimeout(500);

      await page.getByRole("button", { name: /^Error Query query/i }).click();
      await page.waitForTimeout(500);

      await page
        .getByRole("button", { name: /^Schema Validation Error/i })
        .click();
      await page.waitForTimeout(500);

      await page
        .getByRole("button", { name: /^Multiple Errors Query/i })
        .click();
      await page.waitForTimeout(500);
    });
  });
});
