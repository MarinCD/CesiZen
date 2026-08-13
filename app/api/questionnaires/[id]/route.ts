import { NextRequest, NextResponse } from "next/server"
import { getQuestionnaireById } from "@/lib/services/diagnosticService"
import { parseId } from "@/lib/validations/params"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: rawId } = await params
  const id = parseId(rawId)
  if (id === null) return NextResponse.json({ error: "Identifiant invalide" }, { status: 400 })

  const questionnaire = await getQuestionnaireById(id)
  if (!questionnaire) return NextResponse.json({ error: "Introuvable" }, { status: 404 })
  return NextResponse.json(questionnaire)
}
