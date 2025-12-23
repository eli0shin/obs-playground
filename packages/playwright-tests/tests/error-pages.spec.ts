import { test } from "@playwright/test";

test.describe("Error Pages", () => {
  test("errors hub", async ({ page }) => {
    await page.goto("/testing/errors");
    await page.waitForLoadState("networkidle");
  });

  test("500 error", async ({ page }) => {
    // This page throws an intentional error, just visit it
    await page.goto("/testing/errors/500");
    // Don't wait for networkidle - page may error before completing
  });

  test("not found error", async ({ page }) => {
    await page.goto("/testing/errors/not-found");
    await page.waitForLoadState("networkidle");
  });

  test("express error", async ({ page }) => {
    await page.goto("/testing/errors/express-error");
    await page.waitForLoadState("networkidle");
  });

  test("graphql error", async ({ page }) => {
    await page.goto("/testing/errors/graphql-error");
    await page.waitForLoadState("networkidle");
  });

  test("partial failure", async ({ page }) => {
    await page.goto("/testing/errors/partial-failure");
    await page.waitForLoadState("networkidle");
  });

  test("suspense error", async ({ page }) => {
    await page.goto("/testing/errors/suspense-error");
    await page.waitForLoadState("networkidle");
  });

  test("nested suspense", async ({ page }) => {
    await page.goto("/testing/errors/nested-suspense");
    await page.waitForLoadState("networkidle");
  });

  test("timeout page @slow", async ({ page }) => {
    // This page waits 30 seconds
    await page.goto("/testing/errors/timeout");
    await page.waitForLoadState("networkidle");
  });
});
