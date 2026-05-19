import { describe, it, expect } from "vitest"
import { informationSchema } from "@/lib/validations/informationSchema"

// CT-UT-010 adapté : article (titre + texte), pas de slug auto sur ce schéma
describe("informationSchema", () => {
  const valid = {
    titre: "Gérer le stress au quotidien",
    texte: "Le stress chronique peut avoir des effets néfastes sur la santé mentale et physique.",
  }

  it("valide un article complet", () => {
    const result = informationSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("valide avec catégorie et datePublication optionnelles", () => {
    const result = informationSchema.safeParse({
      ...valid,
      categorie: "Bien-être",
      datePublication: "2026-05-18",
    })
    expect(result.success).toBe(true)
  })

  it("rejette un titre trop court (< 3c)", () => {
    const result = informationSchema.safeParse({ ...valid, titre: "Ab" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.titre).toBeDefined()
  })

  it("rejette un texte trop court (< 10c)", () => {
    const result = informationSchema.safeParse({ ...valid, texte: "Court" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.texte).toBeDefined()
  })

  it("rejette si titre manquant", () => {
    const result = informationSchema.safeParse({ texte: valid.texte })
    expect(result.success).toBe(false)
  })
})
