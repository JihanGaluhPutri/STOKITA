import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";

import { loadTestEnv } from "./tests/e2e/support/env";

// Muat .env.local (Supabase + akun uji) sebelum test dijalankan.
loadTestEnv();

const testDir = defineBddConfig({
  features: "tests/e2e/features/**/*.feature",
  // fixtures.ts ikut dimuat agar file test yang digenerate memakai `test`
  // kustom (fixture `skenario`) — pengganti opsi importTestFrom yang deprecated.
  steps: ["tests/e2e/steps/**/*.ts", "tests/e2e/fixtures.ts"],
});

const PORT = process.env.PORT ?? "3000";
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir,
  outputDir: "test-results",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: 0,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],
  use: {
    baseURL,
    locale: "id-ID",
    timezoneId: "Asia/Jakarta",
    actionTimeout: 15_000,
    navigationTimeout: 60_000,
    screenshot: "only-on-failure",
    video: "on",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
