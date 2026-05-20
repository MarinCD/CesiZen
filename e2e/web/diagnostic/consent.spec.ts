import { test, expect } from "@playwright/test"

test.describe("Consentement diagnostic (données de santé art. 9 RGPD)", () => {
  test("affiche l'écran de consentement avant le questionnaire", async ({ page }) => {
    await page.goto("/diagnostic")
    await expect(page.getByText(/Consentement éclairé/i)).toBeVisible()
    await expect(page.getByRole("button", { name: /commencer le diagnostic/i })).toBeVisible()
  })

  test("le bouton 'Commencer' est désactivé sans cocher la case", async ({ page }) => {
    await page.goto("/diagnostic")
    const btn = page.getByRole("button", { name: /commencer le diagnostic/i })
    await expect(btn).toBeDisabled()
  })

  test("après cocher la case, le bouton s'active et lance le questionnaire", async ({ page }) => {
    await page.goto("/diagnostic")
    await page.getByRole("checkbox").check()
    const btn = page.getByRole("button", { name: /commencer le diagnostic/i })
    await expect(btn).toBeEnabled()
    await btn.click()
    // On voit alors la barre de progression / questions
    await expect(page.getByText(/Page 1 sur/i)).toBeVisible()
  })

  test("lien vers la politique de confidentialité depuis l'écran de consentement", async ({ page }) => {
    await page.goto("/diagnostic")
    const link = page.getByRole("link", { name: /politique de confidentialité/i }).first()
    await expect(link).toBeVisible()
  })
})
