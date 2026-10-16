import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests run against the fake engine (src/lib/engine/fake-worker.ts): no model download, no GPU.
 * Real model behaviour is still verified by hand in a real browser.
 */
const PORT = 5199;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // Plain vite, not `pnpm dev`: the fake engine needs no WebAssembly runtime in public/ort.
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    env: { VITE_FAKE_ENGINE: "1" },
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
});
