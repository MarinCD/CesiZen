import { test, expect } from "@playwright/test"

async function login(page: any, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(password)
  await page.getByRole("button", { name: /connexion|se connecter/i }).click()
  await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })
}

test.describe("Changement de mot de passe", () => {
  test("affiche un message d'erreur si ancien mdp incorrect", async ({ page }) => {
    await login(page, "user@cesizen.fr", "User1234!")
    await page.goto("/profil")
    await page.getByLabel(/mot de passe actuel/i).fill("MauvaisAncien1!")
    await page.getByLabel("Nouveau mot de passe", { exact: true }).fill("Nouveau1234!")
    await page.getByLabel(/confirmer le nouveau/i).fill("Nouveau1234!")
    await page.getByRole("button", { name: /sauvegarder/i }).click()
    await expect(page.getByRole("alert")).toBeVisible()
  })

  test("erreur de confirmation visible si les nouveaux mdp diffèrent", async ({ page }) => {
    await login(page, "user@cesizen.fr", "User1234!")
    await page.goto("/profil")
    await page.getByLabel("Nouveau mot de passe", { exact: true }).fill("Nouveau1234!")
    await page.getByLabel(/confirmer le nouveau/i).fill("Different1234!")
    await expect(page.getByText(/ne correspondent pas/i)).toBeVisible()
  })
})

test.describe("Export RGPD", () => {
  test("le bouton 'Exporter mes données' est présent sur /profil", async ({ page }) => {
    await login(page, "user@cesizen.fr", "User1234!")
    await page.goto("/profil")
    await expect(page.getByRole("link", { name: /exporter mes données/i })).toBeVisible()
  })

  test("le bouton pointe vers l'endpoint d'export", async ({ page }) => {
    await login(page, "user@cesizen.fr", "User1234!")
    await page.goto("/profil")
    const link = page.getByRole("link", { name: /exporter mes données/i })
    await expect(link).toHaveAttribute("href", /\/api\/utilisateurs\/\d+\/export/, { timeout: 10000 })
  })
})
