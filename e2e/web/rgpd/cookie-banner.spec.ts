import { test, expect } from "@playwright/test"

test.describe("Information sur les cookies", () => {
  test("s'affiche à la première visite", async ({ page, context }) => {
    await context.clearCookies()
    await page.goto("/")
    await expect(page.getByRole("dialog", { name: /cookies/i })).toBeVisible()
  })

  test("disparaît après fermeture et reste fermée au rechargement", async ({ page, context }) => {
    await context.clearCookies()
    await page.goto("/")
    await page.getByRole("button", { name: /fermer/i }).click()
    await expect(page.getByRole("dialog", { name: /cookies/i })).not.toBeVisible()

    // Au rechargement la bannière ne doit pas réapparaître
    await page.reload()
    await expect(page.getByRole("dialog", { name: /cookies/i })).not.toBeVisible()
  })
})
