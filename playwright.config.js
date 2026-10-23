import fs from "fs";
import { defineConfig, devices } from "@playwright/test";

const systemChromium = ["/usr/bin/chromium", "/usr/bin/google-chrome"].find((p) =>
  fs.existsSync(p)
);

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        ...( !process.env.CI && systemChromium
          ? { launchOptions: { executablePath: systemChromium } }
          : {} ),
      },
    },
  ],
  webServer: {
    command: "npx vite --port 4173",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
  },
});
