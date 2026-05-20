import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/prisma", () => ({
  prisma: { auditLog: { create: vi.fn() } },
}))

import { logAudit } from "@/lib/audit"
import { prisma } from "@/lib/prisma"

const mockCreate = vi.mocked(prisma.auditLog.create)

beforeEach(() => vi.clearAllMocks())

describe("logAudit", () => {
  it("persiste action seule (sans acteur ni cible)", async () => {
    mockCreate.mockResolvedValue({} as any)
    await logAudit({ action: "LOGIN_FAILED" })
    expect(mockCreate).toHaveBeenCalledWith({
      data: { action: "LOGIN_FAILED", actorId: null, targetId: null, ip: null, metadata: null },
    })
  })

  it("sérialise les metadata en JSON", async () => {
    mockCreate.mockResolvedValue({} as any)
    await logAudit({ action: "RATE_LIMIT_HIT", ip: "1.2.3.4", metadata: { route: "diagnostic" } })
    const call = mockCreate.mock.calls[0][0]
    expect(call.data.metadata).toBe('{"route":"diagnostic"}')
    expect(call.data.ip).toBe("1.2.3.4")
  })

  it("ne throw pas si la BDD est indisponible", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {})
    mockCreate.mockRejectedValue(new Error("DB down"))
    await expect(logAudit({ action: "LOGIN_SUCCESS" })).resolves.toBeUndefined()
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it("propage actorId et targetId distincts", async () => {
    mockCreate.mockResolvedValue({} as any)
    await logAudit({ action: "EXPORT_USER_DATA", actorId: 1, targetId: 2 })
    expect(mockCreate.mock.calls[0][0].data.actorId).toBe(1)
    expect(mockCreate.mock.calls[0][0].data.targetId).toBe(2)
  })
})
