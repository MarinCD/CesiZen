import { test, expect } from "@playwright/test"

// CT-E2E-W-001 — Inscription complète
test.describe("Inscription", () => {
  const uniqueEmail = () => `test+${Date.now()}@cesizen.fr`

  test("CT-E2E-W-001 — inscription nominale redirige vers le dashboard", async ({ page }) => {
    await page.goto("/register")
    await page.getByLabel(/prénom/i).fill("Jean")
    await page.getByLabel(/^nom/i).fill("Dupont")
    await page.getByLabel(/email/i).fill(uniqueEmail())
    await page.getByLabel(/mot de passe/i).fill("Aa1!aaaaaa")
    // Cocher le consentement RGPD si présent
    const rgpd = page.getByLabel(/rgpd|conditions/i)
    if (await rgpd.isVisible()) await rgpd.check()
    await page.getByRole("button", { name: /créer|s'inscrire|inscription/i }).click()
    await expect(page).toHaveURL(/dashboard|login/)
  })

  // CT-E2E-W-014 — mot de passe faible refusé en UI
  test("CT-E2E-W-014 — mot de passe trop faible affiche une erreur de validation", async ({ page }) => {
    await page.goto("/register")
    await page.getByLabel(/prénom/i).fill("Jean")
    await page.getByLabel(/^nom/i).fill("Dupont")
    await page.getByLabel(/email/i).fill(uniqueEmail())
    await page.getByLabel(/mot de passe/i).fill("abc")
    await page.getByRole("button", { name: /créer|s'inscrire|inscription/i }).click()
    // Chercher spécifiquement le message d'erreur (classe text-destructive)
    await expect(page.locator(".text-destructive").first()).toBeVisible()
    await expect(page).toHaveURL(/register/)
  })
})
