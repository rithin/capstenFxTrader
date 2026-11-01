import { defineConfig, devices } from "@playwright/test";

// Browser checks against a production build (`next build` must have run; `make test m=web-e2e` does both).
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: { baseURL: "http://localhost:3100", ...devices["Desktop Chrome"] },
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100/dev/components",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
