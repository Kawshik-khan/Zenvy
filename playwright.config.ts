import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.E2E_PORT || 3000);
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    // Signs in once and saves the session (e2e/.auth/student.json) for the other projects.
    { name: "setup", testMatch: /auth\.setup\.ts/, use: { ...devices["Desktop Chrome"] } },
    { name: "smoke", testMatch: /smoke\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"] } },
    { name: "visual-desktop", testMatch: /visual\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Desktop Chrome"] } },
    { name: "visual-mobile", testMatch: /visual\/.*\.spec\.ts/, dependencies: ["setup"], use: { ...devices["Pixel 7"] } },
  ],
  // Expects a production build (`npm run build`). Set E2E_BASE_URL to test an already running server.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `npm run start -- -p ${PORT}`,
        url: `${baseURL}/api/health`,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
