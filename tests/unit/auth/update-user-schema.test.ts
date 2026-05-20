import { describe, it, expect } from "vitest"
import { updateUserSchema } from "@/lib/validations/userSchema"

describe("updateUserSchema", () => {
  it("accepte une mise à jour partielle (prénom seul)", () => {
    const r = updateUserSchema.safeParse({ prenom: "Marin" })
    expect(r.success).toBe(true)
  })

  it("accepte un mot de passe vide (= pas de changement)", () => {
    const r = updateUserSchema.safeParse({ motDePasse: "" })
    expect(r.success).toBe(true)
  })

  it("accepte le champ ancienMotDePasse", () => {
    const r = updateUserSchema.safeParse({
      ancienMotDePasse: "Vieux1234!",
      motDePasse: "Nouveau1234!",
    })
    expect(r.success).toBe(true)
  })

  it("rejette un nouveau mot de passe trop court", () => {
    const r = updateUserSchema.safeParse({ motDePasse: "Aa1!" })
    expect(r.success).toBe(false)
  })

  it("rejette un nouveau mot de passe sans majuscule", () => {
    const r = updateUserSchema.safeParse({ motDePasse: "aaaaaaaa1" })
    expect(r.success).toBe(false)
  })

  it("rejette un email invalide", () => {
    const r = updateUserSchema.safeParse({ email: "pas-un-email" })
    expect(r.success).toBe(false)
  })

  it("rejette un rôle inconnu", () => {
    const r = updateUserSchema.safeParse({ role: "SUPERADMIN" as any })
    expect(r.success).toBe(false)
  })
})
