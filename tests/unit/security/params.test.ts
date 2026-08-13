import { describe, it, expect } from "vitest"
import { parseId, parsePage } from "@/lib/validations/params"

describe("parseId", () => {
  it("accepte un entier positif", () => {
    expect(parseId("42")).toBe(42)
  })

  it("rejette une valeur non numérique", () => {
    expect(parseId("abc")).toBeNull()
    expect(parseId("1abc")).toBeNull()
  })

  it("rejette zéro, les négatifs et les décimaux", () => {
    expect(parseId("0")).toBeNull()
    expect(parseId("-3")).toBeNull()
    expect(parseId("1.5")).toBeNull()
  })

  it("rejette une valeur vide ou absente", () => {
    expect(parseId("")).toBeNull()
    expect(parseId(null)).toBeNull()
    expect(parseId(undefined)).toBeNull()
  })
})

describe("parsePage", () => {
  it("retourne la page par défaut si le paramètre est absent", () => {
    expect(parsePage(null)).toBe(1)
    expect(parsePage(undefined, 3)).toBe(3)
  })

  it("accepte une page valide", () => {
    expect(parsePage("4")).toBe(4)
  })

  it("rejette une page non numérique ou hors bornes", () => {
    expect(parsePage("abc")).toBeNull()
    expect(parsePage("-5")).toBeNull()
    expect(parsePage("0")).toBeNull()
  })
})
