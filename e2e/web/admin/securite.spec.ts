import { test, expect } from "@playwright/test"

async function login(page: any, email: string, password: string) {
  await page.goto("/login")
  await page.getByLabel(/email/i).fill(email)
  await page.getByLabel(/mot de passe/i).fill(password)
  await page.getByRole("button", { name: /connexion|se connecter/i }).click()
  await expect(page).toHaveURL("http://localhost:3000/", { timeout: 10000 })
}

test.describe("Page admin /securite", () => {
  test("un utilisateur lambda est redirigé vers /login", async ({ page }) => {
    await login(page, "user@cesizen.fr", "User1234!")
    await page.goto("/admin/securite")
    await expect(page).toHaveURL(/login/)
  })

  test("un admin accède à la page Cybersécurité", async ({ page }) => {
    await login(page, "admin@cesizen.fr", "Admin1234!")
    await page.goto("/admin/securite")
    await expect(page.getByRole("heading", { name: /Cybersécurité/i })).toBeVisible()
    await expect(page.getByText(/Échecs de connexion/i)).toBeVisible()
    await expect(page.getByRole("heading", { name: /Journal d'audit/i })).toBeVisible()
  })

  test("la sidebar admin contient le lien Cybersécurité", async ({ page }) => {
    await login(page, "admin@cesizen.fr", "Admin1234!")
    await page.goto("/admin/dashboard")
    await expect(page.getByRole("link", { name: /Cybersécurité/i })).toBeVisible()
  })
})

test.describe("Création de questionnaire (admin)", () => {
  test("la page nouveau questionnaire est accessible", async ({ page }) => {
    await login(page, "admin@cesizen.fr", "Admin1234!")
    await page.goto("/admin/questionnaires/nouveau")
    await expect(page.getByRole("heading", { name: /Nouveau questionnaire/i })).toBeVisible()
    await expect(page.getByLabel(/titre du questionnaire/i)).toBeVisible()
    await expect(page.getByLabel(/nom du diagnostic associé/i)).toBeVisible()
  })
})
