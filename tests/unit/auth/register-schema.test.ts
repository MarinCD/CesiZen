import { describe, it, expect } from "vitest"
import { registerSchema } from "@/lib/validations/userSchema"

// CT-UT-001 / CT-UT-002 adaptés au schema réel (bcryptjs, min 8c + maj + chiffre)
describe("registerSchema", () => {
  const valid = {
    nom: "Doe",
    prenom: "John",
    email: "a@b.fr",
    motDePasse: "Aa1!aaaaaa",
    consentementRGPD: true as const,
  }

  it("CT-UT-001 — valide un payload complet et correct", () => {
    const result = registerSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it("CT-UT-002a — rejette un mot de passe trop court (< 8c)", () => {
    const result = registerSchema.safeParse({ ...valid, motDePasse: "Aa1!" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.motDePasse).toBeDefined()
  })

  it("CT-UT-002b — rejette un mot de passe sans majuscule", () => {
    const result = registerSchema.safeParse({ ...valid, motDePasse: "aa1!aaaaaa" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.motDePasse).toBeDefined()
  })

  it("CT-UT-002c — rejette un mot de passe sans chiffre", () => {
    const result = registerSchema.safeParse({ ...valid, motDePasse: "Aaaaaaaaa!" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.motDePasse).toBeDefined()
  })

  it("rejette un email invalide", () => {
    const result = registerSchema.safeParse({ ...valid, email: "pas-un-email" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.email).toBeDefined()
  })

  it("rejette si consentementRGPD est false", () => {
    const result = registerSchema.safeParse({ ...valid, consentementRGPD: false })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.consentementRGPD).toBeDefined()
  })

  it("rejette un nom trop court (< 2c)", () => {
    const result = registerSchema.safeParse({ ...valid, nom: "X" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.nom).toBeDefined()
  })
})
