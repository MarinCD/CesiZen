import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: { utilisateur: { findUnique: vi.fn() } },
}))
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn() }))
vi.mock("bcryptjs", () => ({ default: { compare: vi.fn() } }))

import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const jwt = (authOptions.callbacks as any).jwt
const session = (authOptions.callbacks as any).session
const mockFind = vi.mocked(prisma.utilisateur.findUnique)

const STALE = Date.now() - 10 * 60 * 1000 // au-delà de l'intervalle de revalidation

beforeEach(() => vi.clearAllMocks())

describe("Durée de vie de session", () => {
  it("limite la session à deux heures et la fait glisser", () => {
    expect(authOptions.session?.maxAge).toBe(2 * 60 * 60)
    expect(authOptions.session?.updateAge).toBe(15 * 60)
  })
})

describe("Revalidation du jeton", () => {
  it("horodate l'authentification au premier login", async () => {
    const token = await jwt({ token: {}, user: { id: "5", role: "UTILISATEUR" } })
    expect(token.id).toBe("5")
    expect(token.role).toBe("UTILISATEUR")
    expect(typeof token.authTime).toBe("number")
    expect(mockFind).not.toHaveBeenCalled()
  })

  it("ne relit pas la base avant la fin de l'intervalle de revalidation", async () => {
    const token = await jwt({
      token: { id: "5", role: "UTILISATEUR", revalidatedAt: Date.now(), authTime: Date.now() },
    })
    expect(mockFind).not.toHaveBeenCalled()
    expect(token.role).toBe("UTILISATEUR")
  })

  it("rafraîchit le rôle depuis la base : un admin rétrogradé perd ses droits", async () => {
    mockFind.mockResolvedValue({ role: "UTILISATEUR", motDePasseModifieLe: null } as any)

    const token = await jwt({
      token: { id: "5", role: "ADMINISTRATEUR", revalidatedAt: STALE, authTime: STALE },
    })
    expect(token.role).toBe("UTILISATEUR")

    const result = await session({ session: { user: { email: "x@y.fr" } }, token })
    expect((result.user as any).role).toBe("UTILISATEUR")
  })

  it("révoque le jeton d'un compte supprimé", async () => {
    mockFind.mockResolvedValue(null as any)

    const token = await jwt({
      token: { id: "5", role: "ADMINISTRATEUR", revalidatedAt: STALE, authTime: STALE },
    })
    expect(token.revoked).toBe(true)

    // Une session vide fait renvoyer null à getServerSession.
    const result = await session({ session: { user: { email: "x@y.fr" } }, token })
    expect(Object.keys(result)).toHaveLength(0)
  })

  it("révoque les jetons émis avant un changement de mot de passe", async () => {
    mockFind.mockResolvedValue({
      role: "UTILISATEUR",
      motDePasseModifieLe: new Date(Date.now() - 60_000),
    } as any)

    const token = await jwt({
      token: { id: "5", role: "UTILISATEUR", revalidatedAt: STALE, authTime: STALE },
    })
    expect(token.revoked).toBe(true)
  })

  it("conserve un jeton émis après le changement de mot de passe", async () => {
    mockFind.mockResolvedValue({
      role: "UTILISATEUR",
      motDePasseModifieLe: new Date(Date.now() - 60 * 60 * 1000),
    } as any)

    const token = await jwt({
      token: { id: "5", role: "UTILISATEUR", revalidatedAt: STALE, authTime: Date.now() - 5_000 },
    })
    expect(token.revoked).toBeUndefined()
  })

  it("ne réinterroge plus la base une fois le jeton révoqué", async () => {
    await jwt({ token: { id: "5", revoked: true } })
    expect(mockFind).not.toHaveBeenCalled()
  })

  it("conserve le jeton si la base est injoignable", async () => {
    mockFind.mockRejectedValue(new Error("connexion perdue"))
    vi.spyOn(console, "error").mockImplementation(() => {})

    const token = await jwt({
      token: { id: "5", role: "UTILISATEUR", revalidatedAt: STALE, authTime: STALE },
    })
    expect(token.revoked).toBeUndefined()
    expect(token.role).toBe("UTILISATEUR")
  })

  it("révoque un jeton dont l'identifiant est inexploitable", async () => {
    const token = await jwt({ token: { id: "abc", revalidatedAt: STALE } })
    expect(token.revoked).toBe(true)
    expect(mockFind).not.toHaveBeenCalled()
  })
})
