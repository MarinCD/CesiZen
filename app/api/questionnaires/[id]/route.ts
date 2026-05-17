import { NextRequest, NextResponse } from "next/server"
import { getQuestionnaireById } from "@/lib/services/diagnosticService"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const questionnaire = await getQuestionnaireById(parseInt(params.id))
  if (!questionnaire) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(questionnaire)
}
