import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { submitDiagnostic, getFirstDiagnostic, interpreterScore } from "@/lib/services/diagnosticService"
import { diagnosticSubmitSchema } from "@/lib/validations/diagnosticSchema"
import { rateLimit } from "@/lib/rateLimit"
import { logAudit } from "@/lib/audit"

export async function GET() {
  const diagnostic = await getFirstDiagnostic()
  if (!diagnostic) return NextResponse.json({ error: "Aucun diagnostic trouvé" }, { status: 404 })
  return NextResponse.json(diagnostic)
}

export async function POST(req: NextRequest) {
  const limited = rateLimit(req, { windowMs: 60_000, max: 10, keyPrefix: "diagnostic" })
  if (limited) {
    await logAudit({
      action: "RATE_LIMIT_HIT",
      ip: req.headers.get("x-forwarded-for") || null,
      metadata: { route: "diagnostic" },
    })
    return limited
  }

  const body = await req.json()
  const result = diagnosticSubmitSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  const { prisma } = await import("@/lib/prisma")
  const questions = await prisma.question.findMany({
    where: { id: { in: result.data.questionIds } },
    select: { pointsAssocies: true },
  })
  const score = questions.reduce((sum, q) => sum + q.pointsAssocies, 0)
  const interpretation = interpreterScore(score)

  if (!session) {
    return NextResponse.json({ score, interpretation, saved: false })
  }

  const utilisateurId = parseInt((session.user as any).id)
  const resultat = await submitDiagnostic({
    diagnosticId: result.data.diagnosticId,
    questionIds: result.data.questionIds,
    utilisateurId,
  })

  await logAudit({
    action: "DIAGNOSTIC_SUBMIT",
    actorId: utilisateurId,
    targetId: utilisateurId,
    ip: req.headers.get("x-forwarded-for") || null,
    metadata: { diagnosticId: result.data.diagnosticId, score },
  })

  return NextResponse.json({ ...resultat, saved: true }, { status: 201 })
}
