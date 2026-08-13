import { defineConfig, devices } from "@playwright/test"

// Use process.env.PORT by default and fallback to port 3000
const PORT = process.env.PORT || 3000

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = `http://localhost:${PORT}`

// Reference: https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Timeout per test
  timeout: 30 * 1000,
  // Test directory
  testDir: "./e2e",
  // Artifacts folder where screenshots, videos, and traces are stored.
  outputDir: "test-results/",

  // Run your local dev server before starting the tests:
  // https://playwright.dev/docs/test-advanced#launching-a-development-web-server-during-the-tests
  webServer: {
    command: "npm run dev",
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },

  // Fail CI if tests are left focused or if the CI flag is set without
  // an explicit --workers count.
  forbidOnly: !!process.env.CI,
  // Retry on CI to flake out transient failures.
  retries: process.env.CI ? 2 : 0,
  // Opt out of parallel tests on CI.
  workers: process.env.CI ? 1 : undefined,

  use: {
    // Use baseURL so to make navigations relative.
    baseURL,

    // Retry a test if its failing with enabled tracing. This allows you to analyze the DOM, console logs, network traffic etc.
    trace: "retain-on-failure",

    // Exercise the same full-motion behavior as the shipped site.
    contextOptions: {
      reducedMotion: "no-preference",
    },

    // Only capture screenshots on failure.
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "Desktop Chrome",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 7"],
      },
    },
    // {
    //   name: "Desktop Firefox",
    //   use: {
    //     ...devices["Desktop Firefox"],
    //   },
    // },
    // {
    //   name: "Desktop Safari",
    //   use: {
    //     ...devices["Desktop Safari"],
    //   },
    // },
  ],
})
