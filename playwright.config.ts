import { defineConfig } from "@playwright/test"

const PUPPETEER_CHROME = "/home/harwain/.cache/puppeteer/chrome/linux-148.0.7778.97/chrome-linux64/chrome"

export default defineConfig({
  testDir: "./e2e/web",
  fullyParallel: false,
  workers: 2,
  retries: 1,
  reporter: [["html", { open: "never" }], ["list"]],
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    headless: true,
    launchOptions: {
      executablePath: PUPPETEER_CHROME,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    },
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 30000,
  },
})
