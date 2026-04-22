import { defineConfig, devices } from "@playwright/test";

const isSlowTests = process.env.SLOW_TESTS === "true";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 4 : undefined,
  outputDir: process.env.PLAYWRIGHT_OUTPUT_DIR || "test-results",
  reporter: [
    ["list"],
    [
      "html",
      {
        open: "never",
        outputFolder: process.env.PLAYWRIGHT_HTML_REPORT || "playwright-report",
      },
    ],
  ],
  use: {
    baseURL: process.env.BASE_URL || "https://localhost",
    trace: "on",
    screenshot: "only-on-failure",
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      grep: isSlowTests ? /@slow/ : undefined,
      grepInvert: isSlowTests ? undefined : /@slow/,
      timeout: isSlowTests ? 60000 : undefined,
    },
  ],
});
