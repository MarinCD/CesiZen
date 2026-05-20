import { describe, it, expect, vi } from "vitest"

vi.mock("@/lib/prisma", () => ({ prisma: { utilisateur: { findUnique: vi.fn() } } }))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }))

import { authOptions } from "@/lib/auth"

describe("NextAuth — configuration", () => {
  it("utilise la stratégie JWT (compatible Edge runtime)", () => {
    expect(authOptions.session?.strategy).toBe("jwt")
  })

  it("définit /login comme page de connexion", () => {
    expect(authOptions.pages?.signIn).toBe("/login")
  })

  it("expose un seul provider Credentials", () => {
    expect(authOptions.providers).toHaveLength(1)
    expect((authOptions.providers[0] as any).id).toBe("credentials")
  })

  it("expose une fonction authorize sur le provider Credentials", () => {
    expect(typeof (authOptions.providers[0] as any).authorize).toBe("function")
  })
})

describe("NextAuth — callbacks jwt et session", () => {
  it("jwt callback ajoute id et role au token au premier login", async () => {
    const result = await (authOptions.callbacks as any).jwt({
      token: {},
      user: { id: "5", role: "ADMINISTRATEUR" },
    })
    expect(result.id).toBe("5")
    expect(result.role).toBe("ADMINISTRATEUR")
  })

  it("jwt callback préserve le token sur refresh (user undefined)", async () => {
    const result = await (authOptions.callbacks as any).jwt({
      token: { id: "5", role: "UTILISATEUR" },
      user: undefined,
    })
    expect(result.id).toBe("5")
    expect(result.role).toBe("UTILISATEUR")
  })

  it("session callback expose id et role au client", async () => {
    const result = await (authOptions.callbacks as any).session({
      session: { user: { email: "x@y.fr" } },
      token: { id: "5", role: "ADMINISTRATEUR" },
    })
    expect((result.user as any).id).toBe("5")
    expect((result.user as any).role).toBe("ADMINISTRATEUR")
  })

  it("session callback ne renvoie pas le mot de passe", async () => {
    const result = await (authOptions.callbacks as any).session({
      session: { user: { email: "x@y.fr" } },
      token: { id: "5", role: "UTILISATEUR" },
    })
    expect(result.user).not.toHaveProperty("motDePasse")
  })

  it("session callback gère un user undefined sans planter", async () => {
    const result = await (authOptions.callbacks as any).session({
      session: {},
      token: { id: "5", role: "UTILISATEUR" },
    })
    expect(result).toBeDefined()
  })
})
