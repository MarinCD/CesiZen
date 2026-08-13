import { describe, it, expect, beforeEach, vi } from "vitest"
import { NextRequest } from "next/server"
import { rateLimit } from "@/lib/rateLimit"

const makeReq = (ip = "10.0.0.1") =>
  new NextRequest("http://localhost:3000/api/test", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  })

describe("rateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    process.env.RATE_LIMIT_ENABLED = "1"
  })

  it("autorise les requêtes en deçà de la limite", async () => {
    const opts = { windowMs: 60_000, max: 3, keyPrefix: "t1" }
    expect(await rateLimit(makeReq("1.1.1.1"), opts)).toBeNull()
    expect(await rateLimit(makeReq("1.1.1.1"), opts)).toBeNull()
    expect(await rateLimit(makeReq("1.1.1.1"), opts)).toBeNull()
  })

  it("bloque dès dépassement de la limite", async () => {
    const opts = { windowMs: 60_000, max: 2, keyPrefix: "t2" }
    await rateLimit(makeReq("2.2.2.2"), opts)
    await rateLimit(makeReq("2.2.2.2"), opts)
    const res = await rateLimit(makeReq("2.2.2.2"), opts)
    expect(res).not.toBeNull()
    expect(res?.status).toBe(429)
  })

  it("retourne un header Retry-After quand bloqué", async () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t3" }
    await rateLimit(makeReq("3.3.3.3"), opts)
    const res = await rateLimit(makeReq("3.3.3.3"), opts)
    expect(res?.headers.get("Retry-After")).toBeTruthy()
    expect(res?.headers.get("X-RateLimit-Limit")).toBe("1")
    expect(res?.headers.get("X-RateLimit-Remaining")).toBe("0")
  })

  it("isole les buckets par IP", async () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t4" }
    expect(await rateLimit(makeReq("4.0.0.1"), opts)).toBeNull()
    expect(await rateLimit(makeReq("4.0.0.2"), opts)).toBeNull()
    expect((await rateLimit(makeReq("4.0.0.1"), opts))?.status).toBe(429)
    expect((await rateLimit(makeReq("4.0.0.2"), opts))?.status).toBe(429)
  })

  it("isole les buckets par keyPrefix (même IP, deux routes)", async () => {
    const ip = "5.5.5.5"
    expect(await rateLimit(makeReq(ip), { windowMs: 60_000, max: 1, keyPrefix: "routeA" })).toBeNull()
    expect(await rateLimit(makeReq(ip), { windowMs: 60_000, max: 1, keyPrefix: "routeB" })).toBeNull()
  })

  it("reset le bucket après la fenêtre temporelle", async () => {
    const opts = { windowMs: 1_000, max: 1, keyPrefix: "t6" }
    await rateLimit(makeReq("6.6.6.6"), opts)
    expect((await rateLimit(makeReq("6.6.6.6"), opts))?.status).toBe(429)
    vi.advanceTimersByTime(1_500)
    expect(await rateLimit(makeReq("6.6.6.6"), opts)).toBeNull()
  })

  it("utilise 'unknown' si aucun header IP n'est fourni", async () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t7" }
    const req = new NextRequest("http://localhost:3000/api/test", { method: "POST" })
    expect(await rateLimit(req, opts)).toBeNull()
    expect((await rateLimit(req, opts))?.status).toBe(429)
  })

  it("prend la première IP de x-forwarded-for (chaîne de proxies)", async () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t8" }
    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1, 192.168.1.1" },
    })
    expect(await rateLimit(req, opts)).toBeNull()
    // Même première IP -> bloqué
    const req2 = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9, 172.16.0.1" },
    })
    expect((await rateLimit(req2, opts))?.status).toBe(429)
  })
})
