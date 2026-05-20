import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getQuestionnaires, createQuestionnaire } from "@/lib/services/diagnosticService"
import { questionnaireSchema } from "@/lib/validations/diagnosticSchema"

export async function GET() {
  const questionnaires = await getQuestionnaires()
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
  return NextResponse.json(questionnaire, { status: 201 })
}
