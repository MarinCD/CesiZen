import { test, expect } from "@playwright/test"

// CT-E2E-W-010 / CT-E2E-W-011 — Module Informations (public)
test.describe("Liste des informations (public)", () => {
  test("CT-E2E-W-010 — visiteur anonyme voit la liste des articles", async ({ page }) => {
    await page.goto("/informations")
    await expect(page).toHaveURL(/informations/)
    // Au moins un article chargé depuis la seed (admin@cesizen.fr en a créé)
    const articles = page.locator("article, [data-testid='article'], .information-card, li")
    await expect(articles.first()).toBeVisible({ timeout: 5000 })
  })

  test("CT-E2E-W-011 — un article peut être ouvert en détail", async ({ page }) => {
    await page.goto("/informations")
    const premierLien = page.getByRole("link").filter({ hasText: /.+/ }).first()
    await premierLien.click()
    await expect(page).not.toHaveURL("/informations")
    await expect(page.locator("h1, h2").first()).toBeVisible()
  })

  test("les boutons de modification sont absents pour un visiteur", async ({ page }) => {
    await page.goto("/informations")
    await expect(page.getByRole("button", { name: /modifier|éditer|supprimer/i })).toHaveCount(0)
  })
})
