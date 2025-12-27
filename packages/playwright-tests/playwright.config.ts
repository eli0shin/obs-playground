import { defineConfig, devices } from "@playwright/test";

const isSlowTests = process.env.SLOW_TESTS === "true";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "https://localhost",
    trace: "off",
    screenshot: "off",
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
