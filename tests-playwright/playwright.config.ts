import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config();

const activeBaseUrl = process.env.BASE_URL || "http://localhost:4000/api";
if (require.main === module) {
  console.log(`🌍 Playwright startuje z BASE_URL: ${activeBaseUrl}`);
}

export default defineConfig({
  // 📁 Katalog z testami
  testDir: "./tests/api",

  // ⏱️ Globalne limity czasu
  timeout: 15_000, // maksymalny czas trwania pojedynczego testu (15s)
  expect: {
    timeout: 5_000, // maksymalny czas oczekiwania na asercje (5s)
  },

  // 🔁 Ilość powtórzeń testów w razie błędu (można zwiększyć przy flakach)
  retries: 0,

  // 🧪 Ilość równoległych workerów
  workers: 2, // backendowe testy lepiej wykonywać z ograniczoną równoległością

  // 🗺️ Bazowy adres API
  use: {
    baseURL: activeBaseUrl,
    extraHTTPHeaders: {
      "Content-Type": "application/json",
    },
  },

  // 🧾 Raportowanie wyników testów
  reporter: [
    ["list"], // proste logi w terminalu
    ["html", { open: "never", outputFolder: "playwright-report" }], // raport HTML
  ],

  // 🌍 Środowiska (projects) – tylko Node.js (bez przeglądarek)
  projects: [
    {
      name: "API tests",
      use: { ...devices["Desktop Chrome"] }, // tylko dla kompatybilności; testy API i tak nie otwierają przeglądarki
    },
  ],

  // 🧹 Ustawienia po testach
  outputDir: "test-results/",

  // 🧰 Dodatkowe hooki
  // Możesz np. ustawić globalny setup, który czyści bazę przed testami
  // globalSetup: require.resolve('./global-setup.ts'),
});

// import { defineConfig, devices } from "@playwright/test";

// /**
//  * Read environment variables from file.
//  * https://github.com/motdotla/dotenv
//  */
// // import dotenv from 'dotenv';
// // import path from 'path';
// // dotenv.config({ path: path.resolve(__dirname, '.env') });

// /**
//  * See https://playwright.dev/docs/test-configuration.
//  */
// export default defineConfig({
//   testDir: "./tests",
//   /* Run tests in files in parallel */
//   fullyParallel: true,
//   /* Fail the build on CI if you accidentally left test.only in the source code. */
//   forbidOnly: !!process.env.CI,
//   /* Retry on CI only */
//   retries: process.env.CI ? 2 : 0,
//   /* Opt out of parallel tests on CI. */
//   workers: process.env.CI ? 1 : undefined,
//   /* Reporter to use. See https://playwright.dev/docs/test-reporters */
//   reporter: "html",
//   /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
//   use: {
//     /* Base URL to use in actions like `await page.goto('')`. */
//     // baseURL: 'http://localhost:3000',

//     /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
//     trace: "on-first-retry",
//   },

//   /* Configure projects for major browsers */
//   projects: [
//     {
//       name: "chromium",
//       use: { ...devices["Desktop Chrome"] },
//     },

//     {
//       name: "firefox",
//       use: { ...devices["Desktop Firefox"] },
//     },

//     {
//       name: "webkit",
//       use: { ...devices["Desktop Safari"] },
//     },

//     /* Test against mobile viewports. */
//     // {
//     //   name: 'Mobile Chrome',
//     //   use: { ...devices['Pixel 5'] },
//     // },
//     // {
//     //   name: 'Mobile Safari',
//     //   use: { ...devices['iPhone 12'] },
//     // },

//     /* Test against branded browsers. */
//     // {
//     //   name: 'Microsoft Edge',
//     //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
//     // },
//     // {
//     //   name: 'Google Chrome',
//     //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
//     // },
//   ],

//   /* Run your local dev server before starting the tests */
//   // webServer: {
//   //   command: 'npm run start',
//   //   url: 'http://localhost:3000',
//   //   reuseExistingServer: !process.env.CI,
//   // },
// });
