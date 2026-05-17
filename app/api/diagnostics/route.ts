import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { submitDiagnostic, getFirstDiagnostic, interpreterScore } from "@/lib/services/diagnosticService"
import { diagnosticSubmitSchema } from "@/lib/validations/diagnosticSchema"

export async function GET() {
  const diagnostic = await getFirstDiagnostic()
  if (!diagnostic) return NextResponse.json({ error: "Aucun diagnostic trouvé" }, { status: 404 })
  return NextResponse.json(diagnostic)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const result = diagnosticSubmitSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const session = await getServerSession(authOptions)

  // Calcul du score sans sauvegarde si pas connecté
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

  return NextResponse.json({ ...resultat, saved: true }, { status: 201 })
}
