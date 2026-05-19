import { test, expect } from "@playwright/test"

// CT-E2E-W-004 — Protection route admin pour user simple
test.describe("Protection des routes admin", () => {
  test("CT-E2E-W-004 — utilisateur simple est redirigé hors de /admin", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("user@cesizen.fr")
    await page.getByLabel(/mot de passe/i).fill("User1234!")
    await page.getByRole("button", { name: /connexion|se connecter/i }).click()
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })

    await page.goto("/admin")
    // Le middleware redirige vers /login (non ADMINISTRATEUR)
    await expect(page).toHaveURL(/login/)
  })

  // CT-E2E-W-005 — Admin accède au back-office
  test("CT-E2E-W-005 — admin accède à /admin", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("admin@cesizen.fr")
    await page.getByLabel(/mot de passe/i).fill("Admin1234!")
    await page.getByRole("button", { name: /connexion|se connecter/i }).click()
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })

    // /admin redirige vers /admin/dashboard
    await page.goto("/admin/dashboard")
    await expect(page).toHaveURL(/admin/)
    await expect(page.getByRole("heading", { name: /tableau de bord/i })).toBeVisible()
  })
})
