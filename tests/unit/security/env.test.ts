import { describe, it, expect, afterEach, vi } from "vitest"
import { checkSecretStrength, assertStrongSecret } from "@/lib/env"

const STRONG = "kQ7/Zx2Lp9WvR4tYs6BnE1dHgJmC8fUaOiX3ZbT0rNqPlKeSwVyMzA5uD"

describe("checkSecretStrength", () => {
  it("rejette une valeur absente", () => {
    expect(checkSecretStrength(undefined).valid).toBe(false)
    expect(checkSecretStrength("").valid).toBe(false)
  })

  it("rejette une valeur trop courte", () => {
    expect(checkSecretStrength("kQ7/Zx2Lp9WvR4tYs6Bn").valid).toBe(false)
  })

  it("rejette une chaîne construite autour du nom du projet", () => {
    const result = checkSecretStrength("cesizen-super-secret-application-2026")
    expect(result.valid).toBe(false)
    expect(result.reason).toMatch(/devinable/i)
  })

  it("rejette les gabarits et valeurs de CI", () => {
    expect(checkSecretStrength("change-me-please-with-a-long-value-here").valid).toBe(false)
    expect(checkSecretStrength("ci-only-secret-not-used-in-production-x").valid).toBe(false)
  })

  it("rejette une valeur longue mais sans entropie", () => {
    expect(checkSecretStrength("abababababababababababababababababab").valid).toBe(false)
  })

  it("accepte une valeur aléatoire de 48 octets encodée", () => {
    expect(checkSecretStrength(STRONG).valid).toBe(true)
  })
})

describe("assertStrongSecret", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  const setNodeEnv = (value: string) => vi.stubEnv("NODE_ENV", value)

  it("échoue au démarrage en production sur un secret faible", () => {
    setNodeEnv("production")
    expect(() => assertStrongSecret("NEXTAUTH_SECRET", "cesizen-secret")).toThrow(/NEXTAUTH_SECRET/)
  })

  it("laisse passer le build de production (secrets injectés à l'exécution)", () => {
    setNodeEnv("production")
    vi.stubEnv("NEXT_PHASE", "phase-production-build")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(() => assertStrongSecret("NEXTAUTH_SECRET", "change-me")).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })

  it("se contente d'un avertissement hors production", () => {
    setNodeEnv("development")
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    expect(() => assertStrongSecret("NEXTAUTH_SECRET", "change-me")).not.toThrow()
    expect(warn).toHaveBeenCalled()
  })

  it("n'émet rien sur un secret robuste", () => {
    setNodeEnv("production")
    expect(() => assertStrongSecret("NEXTAUTH_SECRET", STRONG)).not.toThrow()
  })
})
