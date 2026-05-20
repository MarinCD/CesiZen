import { describe, it, expect } from "vitest"
import { interpreterScore } from "@/lib/services/diagnosticService"

describe("interpreterScore (échelle Holmes & Rahe)", () => {
  it("0 -> FAIBLE", () => expect(interpreterScore(0)).toBe("FAIBLE"))
  it("149 -> FAIBLE (limite haute)", () => expect(interpreterScore(149)).toBe("FAIBLE"))
  it("150 -> MODERE (seuil bas)", () => expect(interpreterScore(150)).toBe("MODERE"))
  it("299 -> MODERE (limite haute)", () => expect(interpreterScore(299)).toBe("MODERE"))
  it("300 -> ELEVE (seuil bas)", () => expect(interpreterScore(300)).toBe("ELEVE"))
  it("9999 -> ELEVE", () => expect(interpreterScore(9999)).toBe("ELEVE"))
})
