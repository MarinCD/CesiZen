import { expect, test } from "@playwright/test"

test.describe("Retour utilisateur depuis le footer", () => {
  test("un visiteur peut remplir et envoyer un signalement", async ({ page }) => {
    await page.route("**/api/retours-utilisateur", async (route) => {
      expect(route.request().method()).toBe("POST")
      const payload = route.request().postDataJSON()
      expect(payload).toMatchObject({
        type: "ANOMALIE",
        estBloquant: true,
        pageUrl: "/",
      })
      await route.fulfill({ status: 201, contentType: "application/json", body: '{"id":1}' })
    })

    await page.goto("/")
    await page.getByRole("dialog", { name: /Information sur les cookies/i })
      .getByRole("button", { name: "Fermer" })
      .click()
    await page
      .getByRole("button", { name: /Proposer une amélioration ou signaler un bug/i })
      .click()

    await page.getByLabel("Anomalie", { exact: false }).check()
    await page.getByLabel("Oui", { exact: true }).check()
    await page.getByLabel(/Où cela se produit-il/i).fill("Page d'accueil")
    await page
      .getByLabel("Description", { exact: true })
      .fill("Le bouton principal ne répond pas après plusieurs clics.")
    await page.getByRole("button", { name: /Envoyer mon retour/i }).click()

    await expect(page.getByText(/votre retour a bien été envoyé/i)).toBeVisible()
  })
})
