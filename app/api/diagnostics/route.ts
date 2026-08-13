import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  evaluateDiagnostic,
  getFirstDiagnostic,
  InvalidDiagnosticSelectionError,
  saveDiagnosticResult,
} from "@/lib/services/diagnosticService"
import { diagnosticSubmitSchema } from "@/lib/validations/diagnosticSchema"
import { clientIp, rateLimit } from "@/lib/rateLimit"
import { logAudit } from "@/lib/audit"

export async function GET() {
  const diagnostic = await getFirstDiagnostic()
  if (!diagnostic) return NextResponse.json({ error: "Aucun diagnostic trouvé" }, { status: 404 })
  return NextResponse.json(diagnostic)
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, { windowMs: 60_000, max: 10, keyPrefix: "diagnostic" })
  if (limited) {
    await logAudit({
      action: "RATE_LIMIT_HIT",
      ip: clientIp(req),
      metadata: { route: "diagnostic" },
    })
    return limited
  }

  const body = await req.json()
  const result = diagnosticSubmitSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  let evaluation: { score: number; interpretation: string }
  try {
    evaluation = await evaluateDiagnostic(result.data.diagnosticId, result.data.questionIds)
  } catch (error) {
    if (error instanceof InvalidDiagnosticSelectionError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    throw error
  }

  const { score, interpretation } = evaluation
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ score, interpretation, saved: false })
  }

  if (process.env.NODE_ENV === "production" && process.env.HDS_COMPLIANT_STORAGE !== "1") {
    return NextResponse.json({
      score,
      interpretation,
      saved: false,
      storageDisabledReason: "L'historisation nécessite un hébergement déclaré conforme HDS.",
    })
  }

  const utilisateurId = parseInt((session.user as any).id)
  const resultat = await saveDiagnosticResult({
    diagnosticId: result.data.diagnosticId,
    utilisateurId,
    score,
    interpretation,
  })

  await logAudit({
    action: "DIAGNOSTIC_SUBMIT",
    actorId: utilisateurId,
    targetId: utilisateurId,
    ip: clientIp(req),
    metadata: { diagnosticId: result.data.diagnosticId },
  })

  return NextResponse.json({ ...resultat, saved: true }, { status: 201 })
}
