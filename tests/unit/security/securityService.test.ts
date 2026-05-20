import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

import { getSecurityStats } from "@/lib/services/securityService"
import { prisma } from "@/lib/prisma"

const mockCount = vi.mocked(prisma.auditLog.count)
const mockFindMany = vi.mocked(prisma.auditLog.findMany)

beforeEach(() => vi.clearAllMocks())

describe("getSecurityStats", () => {
  it("retourne les KPIs et masque les IPs", async () => {
    mockCount.mockResolvedValue(0 as any)
    mockFindMany.mockResolvedValue([] as any)

    const stats = await getSecurityStats()
    expect(stats).toHaveProperty("failed24h")
    expect(stats).toHaveProperty("topFailedIps")
    expect(stats).toHaveProperty("topFailedAccounts")
    expect(stats).toHaveProperty("bruteForceAlerts")
    expect(stats).toHaveProperty("recentEvents")
  })

  it("masque les IPv4 (192.168.1.42 -> 192.168.x.x)", async () => {
    mockCount.mockResolvedValue(1 as any)
    const now = new Date()
    mockFindMany.mockImplementation((args: any) => {
      if (args?.where?.action === "LOGIN_FAILED" && args?.select) {
        return Promise.resolve([
          { ip: "192.168.1.42", metadata: null, createdAt: now },
          { ip: "192.168.1.42", metadata: null, createdAt: now },
        ]) as any
      }
      return Promise.resolve([]) as any
    })

    const stats = await getSecurityStats()
    expect(stats.topFailedIps[0]?.ipMasked).toBe("192.168.x.x")
  })

  it("pseudonymise les emails en hash stable (acct-XXXXXXXX)", async () => {
    mockCount.mockResolvedValue(0 as any)
    const now = new Date()
    mockFindMany.mockImplementation((args: any) => {
      if (args?.where?.action === "LOGIN_FAILED" && args?.select) {
        return Promise.resolve([
          { ip: null, metadata: JSON.stringify({ email: "victim@example.com" }), createdAt: now },
          { ip: null, metadata: JSON.stringify({ email: "victim@example.com" }), createdAt: now },
        ]) as any
      }
      return Promise.resolve([]) as any
    })

    const stats = await getSecurityStats()
    expect(stats.topFailedAccounts[0]?.accountHash).toMatch(/^acct-[0-9a-f]{8}$/)
    expect(stats.topFailedAccounts[0]?.count).toBe(2)
  })

  it("hash stable : même email -> même pseudonyme", async () => {
    mockCount.mockResolvedValue(0 as any)
    const now = new Date()

    const runOnce = (email: string) => {
      mockFindMany.mockReset()
      mockFindMany.mockImplementation((args: any) => {
        if (args?.where?.action === "LOGIN_FAILED" && args?.select) {
          return Promise.resolve([
            { ip: null, metadata: JSON.stringify({ email }), createdAt: now },
          ]) as any
        }
        return Promise.resolve([]) as any
      })
      return getSecurityStats()
    }

    const a = await runOnce("alice@test.fr")
    const b = await runOnce("alice@test.fr")
    expect(a.topFailedAccounts[0]?.accountHash).toBe(b.topFailedAccounts[0]?.accountHash)
  })

  it("ne révèle aucun email dans recentEvents (minimisation RGPD)", async () => {
    mockCount.mockResolvedValue(0 as any)
    const now = new Date()
    mockFindMany.mockImplementation((args: any) => {
      if (args?.orderBy) {
        return Promise.resolve([
          {
            id: 1,
            action: "LOGIN_FAILED",
            actorId: null,
            targetId: 42,
            ip: "8.8.8.8",
            metadata: JSON.stringify({ reason: "bad_password", email: "leak@me.com" }),
            createdAt: now,
          },
        ]) as any
      }
      return Promise.resolve([]) as any
    })

    const stats = await getSecurityStats()
    expect(stats.recentEvents[0]?.detail).not.toContain("leak@me.com")
    expect(stats.recentEvents[0]?.detail).toContain("bad_password")
    expect(stats.recentEvents[0]?.ipMasked).toBe("8.8.x.x")
    expect(stats.recentEvents[0]?.targetRef).toBe("#42")
  })

  it("détecte le brute-force (≥ 5 échecs/IP en 1h)", async () => {
    mockCount.mockResolvedValue(0 as any)
    const now = new Date()
    mockFindMany.mockImplementation((args: any) => {
      if (args?.where?.action === "LOGIN_FAILED" && args?.select?.ip && args?.select?.createdAt && !args?.select?.metadata) {
        // appel pour brute-force (1h)
        return Promise.resolve(
          Array.from({ length: 6 }).map(() => ({ ip: "1.2.3.4", createdAt: now }))
        ) as any
      }
      return Promise.resolve([]) as any
    })

    const stats = await getSecurityStats()
    expect(stats.bruteForceAlerts).toHaveLength(1)
    expect(stats.bruteForceAlerts[0]?.count).toBe(6)
    expect(stats.bruteForceAlerts[0]?.ipMasked).toBe("1.2.x.x")
  })

  it("ne déclenche PAS d'alerte si < 5 échecs/h", async () => {
    mockCount.mockResolvedValue(0 as any)
    const now = new Date()
    mockFindMany.mockImplementation((args: any) => {
      if (args?.where?.action === "LOGIN_FAILED" && args?.select?.ip && args?.select?.createdAt && !args?.select?.metadata) {
        return Promise.resolve(
          Array.from({ length: 4 }).map(() => ({ ip: "1.2.3.4", createdAt: now }))
        ) as any
      }
      return Promise.resolve([]) as any
    })

    const stats = await getSecurityStats()
    expect(stats.bruteForceAlerts).toHaveLength(0)
  })

  it("exclut DIAGNOSTIC_SUBMIT du journal sécurité (données santé)", async () => {
    mockCount.mockResolvedValue(0 as any)
    mockFindMany.mockImplementation((args: any) => {
      if (args?.orderBy && args?.where?.action?.in) {
        // Vérifie que DIAGNOSTIC_SUBMIT n'est pas demandé
        expect(args.where.action.in).not.toContain("DIAGNOSTIC_SUBMIT")
        return Promise.resolve([]) as any
      }
      return Promise.resolve([]) as any
    })

    await getSecurityStats()
  })
})
