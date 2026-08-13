import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getQuestionnaires, createQuestionnaire } from "@/lib/services/diagnosticService"
import { questionnaireSchema } from "@/lib/validations/diagnosticSchema"
import { logAudit } from "@/lib/audit"
import { clientIp } from "@/lib/rateLimit"

export async function GET() {
  const session = await getServerSession(authOptions)
  const isAdmin = (session?.user as any)?.role === "ADMINISTRATEUR"

  // L'identité des créateurs (des comptes administrateurs) n'a pas à être
  // servie à un visiteur anonyme : c'est de la reconnaissance offerte.
  const questionnaires = await getQuestionnaires({ includeCreateur: isAdmin })
  return NextResponse.json(questionnaires)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== "ADMINISTRATEUR") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
  }

  const body = await req.json()
  const result = questionnaireSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten().fieldErrors }, { status: 400 })
  }

  const questionnaire = await createQuestionnaire({
    ...result.data,
    idCreateur: parseInt((session.user as any).id),
  })

  await logAudit({
    action: "CONTENT_CREATED",
    actorId: parseInt((session.user as any).id),
    targetId: questionnaire.id,
    ip: clientIp(req),
    metadata: { type: "questionnaire" },
  })

  return NextResponse.json(questionnaire, { status: 201 })
}
