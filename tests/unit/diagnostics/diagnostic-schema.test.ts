import { describe, it, expect } from "vitest"
import { diagnosticSubmitSchema } from "@/lib/validations/diagnosticSchema"

describe("diagnosticSubmitSchema", () => {
  it("valide un payload correct", () => {
    const result = diagnosticSubmitSchema.safeParse({
      diagnosticId: 1,
      questionIds: [1, 2, 3],
    })
    expect(result.success).toBe(true)
  })

  it("rejette diagnosticId négatif", () => {
    const result = diagnosticSubmitSchema.safeParse({ diagnosticId: -1, questionIds: [1] })
    expect(result.success).toBe(false)
    expect(result.error?.flatten().fieldErrors.diagnosticId).toBeDefined()
  })

  it("rejette questionIds vide", () => {
    const result = diagnosticSubmitSchema.safeParse({ diagnosticId: 1, questionIds: [] })
    expect(result.success).toBe(false)
  })

  it("rejette si questionIds contient un id non entier", () => {
    const result = diagnosticSubmitSchema.safeParse({ diagnosticId: 1, questionIds: [1.5] })
    expect(result.success).toBe(false)
  })
})
