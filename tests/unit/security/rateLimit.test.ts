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

  it("ignore la partie falsifiable de x-forwarded-for et retient le dernier saut", async () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t8" }
    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9, 192.168.1.1" },
    })
    expect(await rateLimit(req, opts)).toBeNull()

    // Première valeur différente (celle que l'attaquant contrôle), même dernier
    // saut : le compteur doit rester le même.
    const spoofed = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4, 192.168.1.1" },
    })
    expect((await rateLimit(spoofed, opts))?.status).toBe(429)
  })

  it("respecte TRUSTED_PROXY_HOPS pour choisir le saut de confiance", async () => {
    process.env.TRUSTED_PROXY_HOPS = "2"
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t9" }
    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "9.9.9.9, 203.0.113.5, 192.168.1.1" },
    })
    expect(await rateLimit(req, opts)).toBeNull()

    const spoofed = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "x-forwarded-for": "8.8.8.8, 203.0.113.5, 192.168.1.1" },
    })
    expect((await rateLimit(spoofed, opts))?.status).toBe(429)
    delete process.env.TRUSTED_PROXY_HOPS
  })

  it("privilégie cf-connecting-ip sur x-forwarded-for", async () => {
    const opts = { windowMs: 60_000, max: 1, keyPrefix: "t10" }
    const req = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "cf-connecting-ip": "198.51.100.9", "x-forwarded-for": "1.1.1.1" },
    })
    expect(await rateLimit(req, opts)).toBeNull()

    const spoofed = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: { "cf-connecting-ip": "198.51.100.9", "x-forwarded-for": "2.2.2.2" },
    })
    expect((await rateLimit(spoofed, opts))?.status).toBe(429)
  })

  it("compte par identifiant de compte, quelle que soit l'IP", async () => {
    const opts = { windowMs: 60_000, max: 2, keyPrefix: "login-account", identifier: "cible@cesizen.fr" }
    expect(await rateLimit(makeReq("11.0.0.1"), opts)).toBeNull()
    expect(await rateLimit(makeReq("11.0.0.2"), opts)).toBeNull()
    // Troisième tentative depuis une IP encore différente : bloquée malgré la rotation.
    expect((await rateLimit(makeReq("11.0.0.3"), opts))?.status).toBe(429)
  })

  it("isole les compteurs de deux comptes distincts", async () => {
    const base = { windowMs: 60_000, max: 1, keyPrefix: "login-account" }
    expect(await rateLimit(makeReq("12.0.0.1"), { ...base, identifier: "a@cesizen.fr" })).toBeNull()
    expect(await rateLimit(makeReq("12.0.0.1"), { ...base, identifier: "b@cesizen.fr" })).toBeNull()
    expect(
      (await rateLimit(makeReq("12.0.0.1"), { ...base, identifier: "a@cesizen.fr" }))?.status
    ).toBe(429)
  })
})
