import { test, expect } from "@playwright/test";

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

  test.describe("broken tRPC page", () => {
    test("click all tRPC error buttons", async ({ page }) => {
      const observedStatus = new Map<string, number>();
      page.on("response", (response) => {
        const url = response.url();
        const match = url.match(/\/api\/trpc\/([^?]+)/);
        if (match) {
          observedStatus.set(match[1], response.status());
        }
      });

      await page.goto("/testing/client/broken-trpc");
      await page.waitForLoadState("networkidle");

      const cases = [
        {
          buttonName: /^Trigger 500$/,
          procedure: "errors.internal",
          httpStatus: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "Intentional 500 from tRPC procedure",
          sectionHeading: "Trigger 500",
        },
        {
          buttonName: /^Trigger 400$/,
          procedure: "errors.badRequest",
          httpStatus: 400,
          code: "BAD_REQUEST",
          message: "Intentional 400 from tRPC procedure",
          sectionHeading: "Trigger 400",
        },
        {
          buttonName: /^Trigger 404$/,
          procedure: "errors.notFound",
          httpStatus: 404,
          code: "NOT_FOUND",
          message: "Intentional 404 from tRPC procedure",
          sectionHeading: "Trigger 404",
        },
      ];

      for (const c of cases) {
        await page.getByRole("button", { name: c.buttonName }).click();

        const section = page
          .getByRole("heading", { level: 2, name: c.sectionHeading })
          .locator("..");

        await expect(section).toContainText(`code: ${c.code}`, {
          timeout: 5000,
        });
        await expect(section).toContainText(`httpStatus: ${c.httpStatus}`);
        await expect(section).toContainText(`message: ${c.message}`);

        expect(observedStatus.get(c.procedure)).toBe(c.httpStatus);
      }
    });
  });
});
