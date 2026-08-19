import { describe, expect, it } from "vitest"
import {
  retourUtilisateurSchema,
  statutRetourUtilisateurSchema,
} from "@/lib/validations/retourUtilisateurSchema"

const valid = {
  type: "ANOMALIE",
  estBloquant: true,
  emplacement: "Page Diagnostic",
  pageUrl: "/diagnostic",
  description: "Le bouton ne permet pas de terminer le questionnaire.",
}

describe("retourUtilisateurSchema", () => {
  it("accepte un signalement complet", () => {
    expect(retourUtilisateurSchema.safeParse(valid).success).toBe(true)
  })

  it("accepte une proposition non bloquante", () => {
    expect(
      retourUtilisateurSchema.safeParse({
        ...valid,
        type: "PROPOSITION",
        estBloquant: false,
      }).success
    ).toBe(true)
  })

  it("refuse une description trop courte", () => {
    expect(retourUtilisateurSchema.safeParse({ ...valid, description: "Bug" }).success).toBe(false)
  })

  it("refuse une adresse de page externe", () => {
    expect(
      retourUtilisateurSchema.safeParse({ ...valid, pageUrl: "https://example.com" }).success
    ).toBe(false)
  })

  it("refuse un type inconnu", () => {
    expect(retourUtilisateurSchema.safeParse({ ...valid, type: "AUTRE" }).success).toBe(false)
  })
})

describe("statutRetourUtilisateurSchema", () => {
  it.each(["NOUVEAU", "EN_COURS", "TRAITE"])("accepte le statut %s", (statut) => {
    expect(statutRetourUtilisateurSchema.safeParse({ statut }).success).toBe(true)
  })

  it("refuse un statut inconnu", () => {
    expect(statutRetourUtilisateurSchema.safeParse({ statut: "ARCHIVE" }).success).toBe(false)
  })
})
