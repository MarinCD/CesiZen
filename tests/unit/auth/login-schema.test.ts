import { describe, it, expect } from "vitest"
import { loginSchema } from "@/lib/validations/userSchema"

describe("loginSchema", () => {
  it("valide des credentials corrects", () => {
    const result = loginSchema.safeParse({ email: "user@cesizen.fr", motDePasse: "Aa1!aaaaaa" })
    expect(result.success).toBe(true)
  })

  it("rejette un email invalide", () => {
    const result = loginSchema.safeParse({ email: "invalide", motDePasse: "Aa1!aaaaaa" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.email).toBeDefined()
  })

  it("rejette un mot de passe vide", () => {
    const result = loginSchema.safeParse({ email: "user@cesizen.fr", motDePasse: "" })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.motDePasse).toBeDefined()
  })
})
