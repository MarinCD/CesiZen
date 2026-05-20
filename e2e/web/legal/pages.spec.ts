import { test, expect } from "@playwright/test"

test.describe("Pages légales RGPD", () => {
  test("la politique de confidentialité est accessible et liste les droits RGPD", async ({ page }) => {
    await page.goto("/confidentialite")
    await expect(page.getByRole("heading", { name: /Politique de confidentialité/i })).toBeVisible()
    await expect(page.getByText(/portabilité/i)).toBeVisible()
    await expect(page.getByText(/effacement|oubli/i)).toBeVisible()
    await expect(page.getByText(/CNIL/i)).toBeVisible()
  })

  test("les mentions légales sont accessibles", async ({ page }) => {
    await page.goto("/mentions-legales")
    await expect(page.getByRole("heading", { name: /Mentions légales/i })).toBeVisible()
    await expect(page.getByText(/AlwaysData/i).first()).toBeVisible()
  })

  test("les CGU sont accessibles", async ({ page }) => {
    await page.goto("/cgu")
    await expect(page.getByRole("heading", { name: /Conditions générales/i })).toBeVisible()
    await expect(page.getByText(/3114/)).toBeVisible() // numéro prévention suicide
  })

  test("les liens du footer pointent vers les pages légales", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("link", { name: /Politique de confidentialité/i }).first().click()
    await expect(page).toHaveURL(/confidentialite/)
  })
})
