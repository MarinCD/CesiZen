import { NextRequest, NextResponse } from "next/server"
import { getQuestionnaireById } from "@/lib/services/diagnosticService"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const questionnaire = await getQuestionnaireById(parseInt(id))
  if (!questionnaire) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(questionnaire)
}
