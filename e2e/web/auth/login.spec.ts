import { test, expect } from "@playwright/test"

// CT-E2E-W-002 — Connexion + persistance session
test.describe("Connexion", () => {
  test("CT-E2E-W-002 — login avec credentials valides redirige vers /", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("user@cesizen.fr")
    await page.getByLabel(/mot de passe/i).fill("User1234!")
    await page.getByRole("button", { name: /connexion|se connecter/i }).click()
    // Login redirige vers "/" puis les routes protégées deviennent accessibles
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })
  })

  test("affiche une erreur avec des credentials invalides", async ({ page }) => {
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("inconnu@cesizen.fr")
    await page.getByLabel(/mot de passe/i).fill("MauvaisMotDePasse1!")
    await page.getByRole("button", { name: /connexion|se connecter/i }).click()
    await expect(page.getByRole("alert")).toBeVisible()
    await expect(page).toHaveURL(/login/)
  })
})

// CT-E2E-W-003 — Logout
test.describe("Déconnexion", () => {
  test("CT-E2E-W-003 — logout supprime la session et redirige vers /", async ({ page }) => {
    // Connexion préalable
    await page.goto("/login")
    await page.getByLabel(/email/i).fill("user@cesizen.fr")
    await page.getByLabel(/mot de passe/i).fill("User1234!")
    await page.getByRole("button", { name: /connexion|se connecter/i }).click()
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })

    // Déconnexion (callbackUrl: "/")
    await page.getByRole("button", { name: "Déconnexion" }).first().click()
    await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })

    // Attendre que le signOut soit complètement terminé
    await page.waitForLoadState("networkidle")
    // Les routes protégées redirigent maintenant vers /login
    await page.goto("/profil", { waitUntil: "domcontentloaded" })
    await expect(page).toHaveURL(/login/)
  })
})
