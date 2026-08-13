import { test, expect } from "@playwright/test"

test.describe("Panneau d'accessibilité RGAA", () => {
  test("le bouton flottant est présent sur toutes les pages", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByRole("button", { name: /accessibilité/i })).toBeVisible()
  })

  test("ouvre un dialog avec les options d'accessibilité", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /ouvrir le panneau d'accessibilité/i }).click()
    await expect(page.getByRole("dialog", { name: /accessibilité/i })).toBeVisible()
    await expect(page.getByText(/Taille du texte/i)).toBeVisible()
    await expect(page.getByText(/Contraste élevé/i)).toBeVisible()
    await expect(page.getByText(/Police dyslexie/i)).toBeVisible()
  })

  test("active le contraste élevé et l'applique au DOM", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /ouvrir le panneau d'accessibilité/i }).click()
    await page.getByRole("switch", { name: /contraste élevé/i }).click()

    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-high-contrast")
    )
    expect(hasClass).toBe(true)
  })

  test("persiste les préférences après rechargement", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /ouvrir le panneau d'accessibilité/i }).click()
    await page.getByRole("switch", { name: /police dyslexie/i }).click()
    await page.keyboard.press("Escape")

    await page.reload()
    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-dyslexia")
    )
    expect(hasClass).toBe(true)
  })

  test("le bouton réinitialiser remet tout à zéro", async ({ page }) => {
    await page.goto("/")
    await page.getByRole("button", { name: /ouvrir le panneau d'accessibilité/i }).click()
    await page.getByRole("switch", { name: /contraste élevé/i }).click()
    await page.getByRole("button", { name: /réinitialiser/i }).click()

    const hasClass = await page.evaluate(() =>
      document.documentElement.classList.contains("a11y-high-contrast")
    )
    expect(hasClass).toBe(false)
  })

  test("skip-link Aller au contenu principal est présent (caché jusqu'au focus)", async ({ page }) => {
    await page.goto("/")
    const skip = page.getByRole("link", { name: /aller au contenu principal/i })
    await expect(skip).toBeAttached()
    const href = await skip.getAttribute("href")
    expect(href).toBe("#main-content")
  })
})
